/**
 * Turns a room transcript into the {system, messages} pair a single agent sees.
 *
 * Every participant other than the agent itself is rendered as a `user` turn
 * prefixed with `[Name]:`; the agent's own past replies are `assistant` turns.
 * Consecutive turns with the same role are merged so the result strictly
 * alternates and starts with `user` (required by Anthropic, harmless elsewhere).
 */

const HOST = 'Host';

export function buildSystemPrompt({ agent, agents, topic, humanName }) {
  const others = agents.filter((a) => a.id !== agent.id);
  const roster = [
    ...others.map((a) => `- ${a.name}${a.persona ? ` — ${oneLine(a.persona)}` : ''}`),
    `- ${humanName} — the human host, who may drop in at any time`,
  ].join('\n');

  return [
    `You are ${agent.name}, one participant in a live group chat between several AI agents and a human host.`,
    agent.persona ? `\nYour persona:\n${agent.persona.trim()}` : '',
    `\nRoom topic: ${topic || '(open discussion)'}`,
    `\nOther participants:\n${roster}`,
    `\nHow the chat works:`,
    `- Messages from others arrive as "[Name]: text". Reply with ONLY your own message — never prefix it with your name or brackets, and never write lines for other participants.`,
    `- Stay in character as ${agent.name}. Speak in the first person.`,
    `- This is a chat, not an essay: keep it to a few sentences (roughly under 120 words) unless someone explicitly asks for detail.`,
    `- Engage with what was actually said. Agree, disagree, ask questions, build on ideas. Address people by name when it helps.`,
    `- You may hand the floor to someone by @mentioning them (e.g. "@${others[0]?.name ?? humanName}, what do you think?").`,
    `- Do not repeat yourself or restate the topic. Move the conversation forward.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildMessages({ agent, topic, transcript, historyLimit = 40 }) {
  const recent = transcript
    .filter((m) => !m.streaming && m.content?.trim())
    .slice(-historyLimit);

  const turns = [];
  for (const m of recent) {
    const isSelf = m.authorType === 'agent' && m.authorId === agent.id;
    const role = isSelf ? 'assistant' : 'user';
    const content = isSelf ? m.content.trim() : `[${m.authorName}]: ${m.content.trim()}`;
    const prev = turns[turns.length - 1];
    if (prev && prev.role === role) {
      prev.content += `\n\n${content}`;
    } else {
      turns.push({ role, content });
    }
  }

  if (turns.length === 0 || turns[0].role !== 'user') {
    turns.unshift({
      role: 'user',
      content: `[${HOST}]: Welcome, everyone. Topic for today: ${topic || 'anything you like'}. ${agent.name}, would you open?`,
    });
  }

  if (turns[turns.length - 1].role !== 'user') {
    turns.push({ role: 'user', content: `[${HOST}]: Go on, ${agent.name}.` });
  }

  return turns;
}

export function buildPrompt({ agent, agents, topic, transcript, historyLimit, humanName = 'You' }) {
  return {
    system: buildSystemPrompt({ agent, agents, topic, humanName }),
    messages: buildMessages({ agent, topic, transcript, historyLimit }),
  };
}

/** Strips a leaked "[Name]:" / "Name:" prefix that some models still emit. */
export function stripSelfPrefix(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`^\\s*(\\[${escaped}\\]|${escaped})\\s*:\\s*`, 'i'), '');
}

function oneLine(s, max = 90) {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
