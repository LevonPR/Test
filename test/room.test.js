import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/room.js';
import { buildMessages, stripSelfPrefix } from '../server/prompt.js';
import { composeMockReply } from '../server/providers/mock.js';

function roomWith(names, settings = {}) {
  const room = new Room({ name: 't', topic: 'Testing', settings: { turnDelayMs: 0, ...settings } });
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
