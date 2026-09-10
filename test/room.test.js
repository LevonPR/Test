import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Room } from '../server/room.js';
import { buildMessages, buildSystemPrompt, stripSelfPrefix } from '../server/prompt.js';
import { composeMockReply } from '../server/providers/mock.js';
import { createStore } from '../server/store.js';

function roomWith(names, settings = {}) {
  const room = new Room({ name: 't', topic: 'Testing', settings: { turnDelayMs: 0, autoReply: false, ...settings } });
  for (const name of names) room.addAgent({ name, providerId: 'mock' });
  return room;
}

test('buildMessages alternates roles and starts with user', () => {
  const room = roomWith(['Ada', 'Bob']);
  const [ada, bob] = room.agents;
  const transcript = [
    { authorType: 'agent', authorId: ada.id, authorName: 'Ada', content: 'first' },
    { authorType: 'agent', authorId: bob.id, authorName: 'Bob', content: 'second' },
    { authorType: 'human', authorId: 'human', authorName: 'You', content: 'third' },
    { authorType: 'agent', authorId: ada.id, authorName: 'Ada', content: 'fourth' },
  ];
  const msgs = buildMessages({ agent: ada, topic: 'Testing', transcript });

  assert.equal(msgs[0].role, 'user');
  for (let i = 1; i < msgs.length; i++) assert.notEqual(msgs[i].role, msgs[i - 1].role);
  assert.equal(msgs.at(-1).role, 'user');
  assert.match(msgs.find((m) => m.content.includes('[Bob]: second')).content, /\[You\]: third/);
  assert.ok(msgs.some((m) => m.role === 'assistant' && m.content === 'first'));
});

test('stripSelfPrefix removes leaked name prefixes only', () => {
  assert.equal(stripSelfPrefix('Ada: hello', 'Ada'), 'hello');
  assert.equal(stripSelfPrefix('[Ada]: hello', 'Ada'), 'hello');
  assert.equal(stripSelfPrefix('Adam: hello', 'Ada'), 'Adam: hello');
  assert.equal(stripSelfPrefix('hello Ada: there', 'Ada'), 'hello Ada: there');
});

test('@mention from the human routes to that agent; then round-robin resumes', async () => {
  const room = roomWith(['Ada', 'Bob', 'Cleo'], { maxTurns: 3 });
  room.addHumanMessage('Hi @Cleo, you first.');
  await room.step();
  await room.step();
  await room.step();
  const speakers = room.messages.filter((m) => m.authorType === 'agent').map((m) => m.authorName);
  assert.deepEqual(speakers, ['Cleo', 'Ada', 'Bob']);
  assert.equal(room.status, 'finished');
});

test('bare names count only when clearly addressed', async () => {
  // Mentioned in passing → no routing, round-robin picks Bob (first in order).
  const passing = roomWith(['Bob', 'Ada'], { maxTurns: 1 });
  passing.addHumanMessage('I think Ada is wrong about that.');
  await passing.step();
  assert.equal(passing.messages.at(-1).authorName, 'Bob');

  // Addressed directly ("Bob, ...") → Bob is routed even though Ada is first in order.
  const addressed = roomWith(['Ada', 'Bob'], { maxTurns: 1 });
  addressed.addHumanMessage('Bob, what do you think about what Ada said?');
  await addressed.step();
  assert.equal(addressed.messages.at(-1).authorName, 'Bob');
});

test('start/pause loop produces messages and stops at the turn limit', async () => {
  const room = roomWith(['Ada', 'Bob'], { maxTurns: 2 });
  const ended = [];
  room.on('message:end', (m) => ended.push(m.authorName));
  room.start();
  await new Promise((resolve) => room.on('update', (s) => s.status === 'finished' && resolve()));
  assert.deepEqual(ended, ['Ada', 'Bob']);
  assert.ok(room.messages.at(-1).authorType === 'system');
  assert.throws(() => room.start(), /Turn limit/);
});

test('reset mid-turn drops the orphaned message', async () => {
  const room = roomWith(['Ada'], { maxTurns: 0 });
  const removed = [];
  room.on('message:remove', (d) => removed.push(d.id));
  const p = room.step();
  await new Promise((r) => setTimeout(r, 50));
  room.reset();
  await p;
  assert.equal(room.messages.length, 0);
  assert.equal(removed.length, 1);
});

test('auto-reply: a human message in a paused room triggers exactly one turn', async () => {
  const room = roomWith(['Ada', 'Bob'], { autoReply: true });
  const ended = [];
  room.on('message:end', (m) => ended.push(m.authorName));
  room.addHumanMessage('@Bob, hello?');
  await new Promise((resolve) => room.on('update', (s) => s.status === 'paused' && resolve()));
  await new Promise((r) => setTimeout(r, 100));
  assert.deepEqual(ended, ['Bob']);
  assert.equal(room.status, 'paused');
});

test('auto-reply is skipped while running and when disabled', async () => {
  const off = roomWith(['Ada'], { autoReply: false });
  off.addHumanMessage('hi');
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(off.messages.length, 1);
  assert.equal(off.status, 'idle');
});

test('stop phrase finishes the conversation and is mentioned in the system prompt', async () => {
  const room = roomWith(['Ada', 'Bob'], { maxTurns: 0, stopPhrase: 'THE' });
  const system = buildSystemPrompt({ agent: room.agents[0], agents: room.agents, topic: 'x', humanName: 'You', stopPhrase: 'THE' });
  assert.match(system, /"THE"/);

  // Run until the mock says the (case-insensitive) phrase, which it does in most replies.
  room.start();
  await new Promise((resolve) => room.on('update', (s) => s.status === 'finished' && resolve()));
  const agentMsgs = room.messages.filter((m) => m.authorType === 'agent');
  assert.match(agentMsgs.at(-1).content, /the/i);
  assert.match(room.messages.at(-1).content, /ended the conversation/);
  // Start still works afterwards: the stop is soft.
  assert.doesNotThrow(() => room.start());
  room.pause();
});

test('per-agent overrides are validated and optional', () => {
  const room = roomWith([]);
  const a = room.addAgent({ name: 'Hot', providerId: 'mock', temperature: 5, maxTokens: '64' });
  assert.equal(a.temperature, 2);
  assert.equal(a.maxTokens, 64);
  const b = room.addAgent({ name: 'Plain', providerId: 'mock', temperature: '', maxTokens: null });
  assert.equal(b.temperature, null);
  assert.equal(b.maxTokens, null);
});

test('rooms round-trip through toPersisted/fromPersisted', async () => {
  const room = roomWith(['Ada', 'Bob'], { maxTurns: 5, stopPhrase: 'fin' });
  room.addHumanMessage('hello');
  await room.step();
  const restored = Room.fromPersisted(JSON.parse(JSON.stringify(room.toPersisted())));
  assert.equal(restored.id, room.id);
  assert.equal(restored.status, 'paused');
  assert.equal(restored.turnsTaken, 1);
  assert.equal(restored.lastSpeakerId, room.lastSpeakerId);
  assert.deepEqual(restored.agents, room.agents);
  assert.deepEqual(restored.messages, room.messages);
  assert.equal(restored.settings.stopPhrase, 'fin');
  // Continues the round-robin where it left off.
  await restored.step();
  assert.equal(restored.messages.at(-1).authorName, 'Bob');
});

test('store writes atomically on flush and loads what it wrote', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'chatroom-'));
  const file = path.join(dir, 'nested', 'rooms.json');
  const store = createStore(file, { debounceMs: 10_000 });
  assert.equal(store.load(), null);
  store.schedule(() => ({ version: 1, rooms: [{ id: 'a' }] }));
  assert.equal(existsSync(file), false, 'debounced write should not have happened yet');
  store.flush();
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), { version: 1, rooms: [{ id: 'a' }] });
  assert.equal(existsSync(`${file}.tmp`), false);
  assert.deepEqual(store.load(), { version: 1, rooms: [{ id: 'a' }] });
});

test('mock reply reacts to the previous speaker and topic', () => {
  const reply = composeMockReply({
    system: 'A rigorous scientist',
    agentName: 'Ada',
    topic: 'Should cats vote?',
    messages: [{ role: 'user', content: '[Bob]: Cats are obviously ready for democracy.' }],
  });
  assert.ok(reply.length > 20);
  assert.match(reply, /should cats vote|Bob|Cats/);
});
