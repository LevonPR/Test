import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { streamCompletion, getProvider } from './providers/index.js';
import { buildPrompt, stripSelfPrefix } from './prompt.js';

export const PALETTE = [
  '#7c5cff', '#ff5c8a', '#2dd4bf', '#f59e0b', '#38bdf8',
  '#a3e635', '#fb7185', '#c084fc', '#34d399', '#f97316',
];

export const DEFAULT_SETTINGS = {
  mode: 'mention', // 'round-robin' | 'random' | 'mention' (round-robin + @mention override)
  maxTurns: 20, // 0 = unlimited
  turnDelayMs: 1200,
  maxTokens: 300,
  temperature: 0.9,
  historyLimit: 40,
  humanName: 'You',
};

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    if (!ms) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });

/**
 * A single chat room: participants, transcript, and the turn-taking loop.
 *
 * Events:
 *   'update'          – room metadata changed (status, agents, settings, topic)
 *   'message'         – a complete message was appended (human or system)
 *   'message:start'   – an agent started speaking (message with empty content)
 *   'message:delta'   – { id, delta }
 *   'message:end'     – final message
 *   'message:remove'  – { id } (aborted turn with no content)
 */
export class Room extends EventEmitter {
  constructor({ id = randomUUID(), name = 'New room', topic = '', settings = {} } = {}) {
    super();
    this.id = id;
    this.name = name;
    this.topic = topic;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.agents = [];
    this.messages = [];
    this.status = 'idle'; // idle | running | paused | finished
    this.turnsTaken = 0;
    this.turnIndex = 0;
    this.createdAt = Date.now();
    this.lastSpeakerId = null;
    this._loopPromise = null;
    this._abort = null;
    this._stepping = false;
  }

  // ---------- serialization ----------

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      topic: this.topic,
      settings: this.settings,
      agents: this.agents,
      status: this.status,
      turnsTaken: this.turnsTaken,
      createdAt: this.createdAt,
      messageCount: this.messages.length,
    };
  }

  summary() {
    const { id, name, topic, status, createdAt } = this;
    return { id, name, topic, status, createdAt, agentCount: this.agents.length, messageCount: this.messages.length };
  }

  // ---------- configuration ----------

  update({ name, topic, settings }) {
    if (typeof name === 'string' && name.trim()) this.name = name.trim();
    if (typeof topic === 'string') this.topic = topic.trim();
    if (settings && typeof settings === 'object') {
      const s = { ...this.settings };
      if (['round-robin', 'random', 'mention'].includes(settings.mode)) s.mode = settings.mode;
      if (Number.isFinite(+settings.maxTurns)) s.maxTurns = Math.max(0, Math.floor(+settings.maxTurns));
      if (Number.isFinite(+settings.turnDelayMs)) s.turnDelayMs = clamp(+settings.turnDelayMs, 0, 60000);
      if (Number.isFinite(+settings.maxTokens)) s.maxTokens = clamp(Math.floor(+settings.maxTokens), 16, 4096);
      if (Number.isFinite(+settings.temperature)) s.temperature = clamp(+settings.temperature, 0, 2);
      if (Number.isFinite(+settings.historyLimit)) s.historyLimit = clamp(Math.floor(+settings.historyLimit), 2, 500);
      if (typeof settings.humanName === 'string' && settings.humanName.trim()) s.humanName = settings.humanName.trim().slice(0, 40);
      this.settings = s;
    }
    if (this.status === 'finished' && this._canContinue()) this.status = 'paused';
    this._emitUpdate();
  }

  addAgent(spec) {
    const agent = this._normalizeAgent(spec);
    this.agents.push(agent);
    if (this.status === 'finished' && this._canContinue()) this.status = 'paused';
    this._emitUpdate();
    return agent;
  }

  updateAgent(agentId, patch) {
    const idx = this.agents.findIndex((a) => a.id === agentId);
    if (idx === -1) throw httpError(404, 'Agent not found');
    const updated = this._normalizeAgent({ ...this.agents[idx], ...patch, id: agentId });
    this.agents[idx] = updated;
    for (const m of this.messages) {
      if (m.authorType === 'agent' && m.authorId === agentId) {
        m.authorName = updated.name;
        m.color = updated.color;
      }
    }
    this._emitUpdate();
    return updated;
  }

  removeAgent(agentId) {
    const before = this.agents.length;
    this.agents = this.agents.filter((a) => a.id !== agentId);
    if (this.agents.length === before) throw httpError(404, 'Agent not found');
    if (this.agents.length === 0 && this.status === 'running') this.pause();
    this._emitUpdate();
  }

  _normalizeAgent(spec = {}) {
    const name = String(spec.name || '').trim().slice(0, 40);
    if (!name) throw httpError(400, 'Agent name is required');
    if (this.agents.some((a) => a.id !== spec.id && a.name.toLowerCase() === name.toLowerCase())) {
      throw httpError(400, `An agent named "${name}" already exists`);
    }
    const providerId = spec.providerId || 'mock';
    const provider = getProvider(providerId);
    if (!provider) throw httpError(400, `Unknown provider "${providerId}"`);
    const model = String(spec.model || provider.models[0] || '').trim();
    const usedColors = new Set(this.agents.filter((a) => a.id !== spec.id).map((a) => a.color));
    const color = spec.color || PALETTE.find((c) => !usedColors.has(c)) || PALETTE[this.agents.length % PALETTE.length];
    return {
      id: spec.id || randomUUID(),
      name,
      persona: String(spec.persona || '').trim().slice(0, 4000),
      providerId,
      model,
      color,
      emoji: String(spec.emoji || '').trim().slice(0, 4) || name[0].toUpperCase(),
    };
  }

  // ---------- transcript ----------

  addHumanMessage(text, name = this.settings.humanName) {
    const content = String(text || '').trim();
    if (!content) throw httpError(400, 'Message is empty');
    const message = {
      id: randomUUID(),
      authorId: 'human',
      authorName: name,
      authorType: 'human',
      color: '#e2e8f0',
      content,
      createdAt: Date.now(),
    };
    this.messages.push(message);
    this.lastSpeakerId = 'human';
    this.emit('message', message);
    if (this.status === 'finished' && this._canContinue()) {
      this.status = 'paused';
      this._emitUpdate();
    }
    return message;
  }

  _addSystemMessage(content) {
    const message = {
      id: randomUUID(),
      authorId: 'system',
      authorName: 'System',
      authorType: 'system',
      color: '#94a3b8',
      content,
      createdAt: Date.now(),
    };
    this.messages.push(message);
    this.emit('message', message);
    return message;
  }

  // ---------- controls ----------

  start() {
    if (this.agents.length === 0) throw httpError(400, 'Add at least one agent before starting');
    if (!this._canContinue()) throw httpError(400, 'Turn limit reached — raise "max turns" or reset the room');
    if (this.status === 'running') return;
    this.status = 'running';
    this._emitUpdate();
    if (!this._loopPromise) this._loopPromise = this._loop().finally(() => (this._loopPromise = null));
  }

  pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this._abort?.abort();
    this._emitUpdate();
  }

  /**
   * Runs exactly one turn. Validation errors are thrown synchronously so HTTP
   * handlers can report them; the returned promise resolves when the turn ends.
   */
  step() {
    if (this.agents.length === 0) throw httpError(400, 'Add at least one agent first');
    if (this.status === 'running' || this._stepping) throw httpError(409, 'An agent is already speaking');
    if (!this._canContinue()) throw httpError(400, 'Turn limit reached — raise "max turns" or reset the room');
    this._stepping = true;
    this.status = 'running';
    this._emitUpdate();
    return this._takeTurn().finally(() => {
      this._stepping = false;
      if (this.status === 'running') this.status = this._canContinue() ? 'paused' : 'finished';
      this._emitUpdate();
    });
  }

  reset() {
    this._abort?.abort();
    this.messages = [];
    this.turnsTaken = 0;
    this.turnIndex = 0;
    this.lastSpeakerId = null;
    this.status = 'idle';
    this.emit('reset');
    this._emitUpdate();
  }

  destroy() {
    this._abort?.abort();
    this.status = 'paused';
    this.removeAllListeners();
  }

  // ---------- the loop ----------

  _canContinue() {
    return this.settings.maxTurns === 0 || this.turnsTaken < this.settings.maxTurns;
  }

  async _loop() {
    while (this.status === 'running') {
      if (this.agents.length === 0) {
        this.status = 'paused';
        break;
      }
      const ok = await this._takeTurn();
      if (this.status !== 'running') break;
      if (!ok) {
        // Provider failure: stop rather than spin on a broken configuration.
        this.status = 'paused';
        break;
      }
      if (!this._canContinue()) {
        this.status = 'finished';
        this._addSystemMessage(`Reached the turn limit (${this.settings.maxTurns}). Raise it in settings or reset the room to continue.`);
        break;
      }
      const ac = (this._abort = new AbortController());
      await sleep(this.settings.turnDelayMs, ac.signal);
    }
    this._emitUpdate();
  }

  _pickNextAgent() {
    const { agents, settings } = this;
    if (agents.length === 1) return agents[0];

    const last = this.messages[this.messages.length - 1];
    if (last && (settings.mode === 'mention' || last.authorType === 'human')) {
      const mentioned = this._findMention(last.content, last.authorId);
      if (mentioned) return mentioned;
    }

    if (settings.mode === 'random') {
      const pool = agents.filter((a) => a.id !== this.lastSpeakerId);
      return pool[Math.floor(Math.random() * pool.length)];
    }

    let agent = agents[this.turnIndex % agents.length];
    if (agent.id === this.lastSpeakerId) agent = agents[(this.turnIndex + 1) % agents.length];
    return agent;
  }

  _findMention(text, excludeId) {
    if (!text) return null;
    const candidates = this.agents
      .filter((a) => a.id !== excludeId)
      .map((a) => ({ agent: a, idx: findNameMention(text, a.name) }))
      .filter((c) => c.idx !== -1)
      .sort((a, b) => a.idx - b.idx);
    return candidates[0]?.agent ?? null;
  }

  async _takeTurn() {
    const agent = this._pickNextAgent();
    if (!agent) return false;

    const ac = (this._abort = new AbortController());
    const message = {
      id: randomUUID(),
      authorId: agent.id,
      authorName: agent.name,
      authorType: 'agent',
      color: agent.color,
      model: `${agent.providerId}/${agent.model}`,
      content: '',
      createdAt: Date.now(),
      streaming: true,
    };

    const { system, messages } = buildPrompt({
      agent,
      agents: this.agents,
      topic: this.topic,
      transcript: this.messages,
      historyLimit: this.settings.historyLimit,
      humanName: this.settings.humanName,
    });

    this.messages.push(message);
    this.emit('message:start', message);

    let failed = false;
    try {
      const stream = streamCompletion({
        providerId: agent.providerId,
        model: agent.model,
        system,
        messages,
        temperature: this.settings.temperature,
        maxTokens: this.settings.maxTokens,
        signal: ac.signal,
        meta: { agentName: agent.name, topic: this.topic, humanName: this.settings.humanName },
      });
      for await (const delta of stream) {
        if (ac.signal.aborted) break;
        message.content += delta;
        this.emit('message:delta', { id: message.id, delta });
      }
    } catch (err) {
      if (!ac.signal.aborted) {
        failed = true;
        console.error(`[room ${this.id}] ${agent.name} (${agent.providerId}/${agent.model}) failed:`, err.message);
      }
    }

    message.content = stripSelfPrefix(message.content, agent.name).trim();
    message.streaming = false;
    if (ac.signal.aborted) message.interrupted = true;

    if (!this.messages.includes(message)) {
      // The room was reset mid-turn; drop the orphaned message.
      this.emit('message:remove', { id: message.id });
      return true;
    }

    if (!message.content) {
      this.messages = this.messages.filter((m) => m.id !== message.id);
      this.emit('message:remove', { id: message.id });
    } else {
      this.emit('message:end', message);
      this.lastSpeakerId = agent.id;
      this.turnsTaken += 1;
      const idx = this.agents.findIndex((a) => a.id === agent.id);
      this.turnIndex = idx === -1 ? this.turnIndex + 1 : idx + 1;
      this._emitUpdate();
    }

    if (failed) {
      this._addSystemMessage(`${agent.name} could not respond (${agent.providerId}/${agent.model}). Check the server log and provider configuration.`);
    }
    return !failed;
  }

  _emitUpdate() {
    this.emit('update', this.toJSON());
  }
}

function findNameMention(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^\\w])@?${escaped}(?![\\w])`, 'i');
  const m = re.exec(text);
  if (!m) return -1;
  // Bare names count only when clearly addressed (start of text or followed by punctuation);
  // "@Name" counts anywhere.
  const at = text[m.index + m[1].length] === '@';
  if (at) return m.index;
  const after = text.slice(m.index + m[0].length).trimStart();
  const addressed = m.index === 0 || /^[,:!?—-]/.test(after);
  return addressed ? m.index : -1;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
