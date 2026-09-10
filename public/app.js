/* AI Chat Room — client */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  rooms: [],
  roomId: localStorage.getItem('roomId') || null,
  room: null,
  messages: [],
  providers: [],
  presets: { personas: [], topics: [] },
  editingAgentId: null,
  speakingAgentId: null,
  ws: null,
  wsRetry: 0,
};

const els = {
  connStatus: $('#conn-status'),
  roomList: $('#room-list'),
  providersLine: $('#providers-line'),
  roomName: $('#room-name'),
  roomTopic: $('#room-topic'),
  statusBadge: $('#status-badge'),
  turns: $('#turns'),
  btnStart: $('#btn-start'),
  btnPause: $('#btn-pause'),
  btnStep: $('#btn-step'),
  btnReset: $('#btn-reset'),
  btnMore: $('#btn-more'),
  moreMenu: $('#more-menu'),
  messages: $('#messages'),
  emptyState: $('#empty-state'),
  composer: $('#composer'),
  composerInput: $('#composer-input'),
  btnSend: $('#btn-send'),
  agentList: $('#agent-list'),
  agentCount: $('#agent-count'),
  agentForm: $('#agent-form'),
  agentFormTitle: $('#agent-form-title'),
  btnCancelEdit: $('#btn-cancel-edit'),
  presetChips: $('#preset-chips'),
  agentEmoji: $('#agent-emoji'),
  agentName: $('#agent-name'),
  agentPersona: $('#agent-persona'),
  agentProvider: $('#agent-provider'),
  agentModel: $('#agent-model'),
  agentTemperature: $('#agent-temperature'),
  agentMaxTokens: $('#agent-maxTokens'),
  modelList: $('#model-list'),
  providerHint: $('#provider-hint'),
  btnSaveAgent: $('#btn-save-agent'),
  dlgNewRoom: $('#dlg-new-room'),
  newRoomForm: $('#new-room-form'),
  nrName: $('#nr-name'),
  nrTopic: $('#nr-topic'),
  nrPresets: $('#nr-presets'),
  nrProvider: $('#nr-provider'),
  topicChips: $('#topic-chips'),
  dlgSettings: $('#dlg-settings'),
  settingsForm: $('#settings-form'),
  toasts: $('#toasts'),
  sidebar: $('#sidebar'),
  agentsPanel: $('#agents-panel'),
};

const messageEls = new Map();

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}

const roomPath = (suffix = '') => `/api/rooms/${state.roomId}${suffix}`;

async function guarded(fn) {
  try {
    return await fn();
  } catch (err) {
    toast(err.message);
    return undefined;
  }
}

function toast(message, kind = 'error') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  els.toasts.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

// ---------------------------------------------------------------------------
// WebSocket
// ---------------------------------------------------------------------------

function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  state.ws = ws;

  ws.addEventListener('open', () => {
    state.wsRetry = 0;
    setConn(true);
    if (state.roomId) ws.send(JSON.stringify({ type: 'subscribe', roomId: state.roomId }));
  });

  ws.addEventListener('message', (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    handleEvent(msg);
  });

  ws.addEventListener('close', () => {
    setConn(false);
    const delay = Math.min(10000, 500 * 2 ** state.wsRetry++);
    setTimeout(connect, delay);
  });
}

function setConn(ok) {
  els.connStatus.textContent = ok ? 'connected' : 'reconnecting…';
  els.connStatus.className = `brand-sub ${ok ? 'ok' : 'bad'}`;
}

function handleEvent(msg) {
  if (msg.type === 'rooms') {
    state.rooms = msg.rooms;
    renderRooms();
    if (state.roomId && !state.rooms.some((r) => r.id === state.roomId)) {
      selectRoom(state.rooms[0]?.id ?? null);
    } else if (!state.roomId && state.rooms.length) {
      selectRoom(state.rooms[0].id);
    }
    return;
  }

  if (msg.roomId && msg.roomId !== state.roomId) return;

  switch (msg.type) {
    case 'snapshot':
      state.room = msg.room;
      state.messages = msg.messages;
      state.speakingAgentId = msg.messages.find((m) => m.streaming)?.authorId ?? null;
      renderRoom();
      renderMessages();
      break;
    case 'room':
      state.room = msg.room;
      renderRoom();
      break;
    case 'message':
      state.messages.push(msg.message);
      appendMessage(msg.message);
      break;
    case 'message:start':
      state.messages.push(msg.message);
      state.speakingAgentId = msg.message.authorId;
      appendMessage(msg.message);
      renderAgents();
      break;
    case 'message:delta': {
      const m = state.messages.find((x) => x.id === msg.id);
      if (!m) break;
      m.content += msg.delta;
      const el = messageEls.get(msg.id);
      if (el) {
        const content = $('.msg-content', el);
        if (content.dataset.empty) {
          content.dataset.empty = '';
          content.textContent = '';
        }
        content.textContent += msg.delta;
        maybeScroll();
      }
      break;
    }
    case 'message:end': {
      const idx = state.messages.findIndex((x) => x.id === msg.message.id);
      if (idx !== -1) state.messages[idx] = msg.message;
      else state.messages.push(msg.message);
      state.speakingAgentId = null;
      finalizeMessage(msg.message);
      renderAgents();
      break;
    }
    case 'message:remove':
      state.messages = state.messages.filter((x) => x.id !== msg.id);
      messageEls.get(msg.id)?.remove();
      messageEls.delete(msg.id);
      state.speakingAgentId = null;
      renderAgents();
      toggleEmpty();
      break;
    case 'reset':
      state.messages = [];
      state.speakingAgentId = null;
      renderMessages();
      renderAgents();
      break;
    case 'room:deleted':
      toast('This room was deleted', 'info');
      break;
    case 'error':
      toast(msg.error);
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

function selectRoom(id) {
  state.roomId = id;
  if (id) localStorage.setItem('roomId', id);
  else localStorage.removeItem('roomId');
  state.room = null;
  state.messages = [];
  state.editingAgentId = null;
  resetAgentForm();
  renderRooms();
  renderRoom();
  renderMessages();
  if (id && state.ws?.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify({ type: 'subscribe', roomId: id }));
  }
  els.sidebar.classList.remove('open');
}

function renderRooms() {
  els.roomList.innerHTML = '';
  if (!state.rooms.length) {
    els.roomList.innerHTML = '<div class="agents-empty">No rooms yet. Create one!</div>';
    return;
  }
  for (const r of state.rooms) {
    const btn = document.createElement('button');
    btn.className = `room-item${r.id === state.roomId ? ' active' : ''}`;
    btn.innerHTML = `
      <span class="ri-name">${esc(r.name)}</span>
      <span class="ri-meta"><span class="dot" data-status="${r.status}"></span>${r.agentCount} 🤖 · ${r.messageCount}</span>
      <span class="ri-topic">${esc(r.topic || 'No topic')}</span>`;
    btn.addEventListener('click', () => selectRoom(r.id));
    els.roomList.appendChild(btn);
  }
}

function renderRoom() {
  const room = state.room;
  const has = Boolean(room);
  els.roomName.textContent = has ? room.name : state.roomId ? 'Loading…' : 'No room selected';
  els.roomTopic.textContent = has ? room.topic || 'No topic set — open the settings to add one.' : 'Create a room to get started.';
  const status = has ? room.status : 'idle';
  els.statusBadge.textContent = status;
  els.statusBadge.dataset.status = status;
  els.turns.textContent = has ? `${room.turnsTaken}${room.settings.maxTurns ? ` / ${room.settings.maxTurns}` : ''} turns` : '';

  const running = status === 'running';
  els.btnStart.hidden = running;
  els.btnPause.hidden = !running;
  els.btnStart.disabled = !has || !room.agents.length;
  els.btnStep.disabled = !has || running || !room.agents.length;
  els.btnReset.disabled = !has;
  els.btnMore.disabled = !has;
  els.composerInput.disabled = !has;
  els.btnSend.disabled = !has;
  els.agentForm.querySelectorAll('input, textarea, select, button').forEach((el) => (el.disabled = !has));

  renderAgents();
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function renderMessages() {
  messageEls.clear();
  els.messages.querySelectorAll('.msg').forEach((el) => el.remove());
  for (const m of state.messages) appendMessage(m, false);
  toggleEmpty();
  els.messages.scrollTop = els.messages.scrollHeight;
}

function toggleEmpty() {
  els.emptyState.hidden = state.messages.length > 0;
}

function buildMessageEl(m) {
  const el = document.createElement('article');
  el.className = `msg ${m.authorType}${m.streaming ? ' streaming' : ''}${m.interrupted ? ' interrupted' : ''}`;
  el.dataset.id = m.id;
  el.style.setProperty('--c', m.color || '#334155');

  if (m.authorType === 'system') {
    el.innerHTML = `<div class="msg-content">${esc(m.content)}</div>`;
    return el;
  }

  const agent = state.room?.agents.find((a) => a.id === m.authorId);
  const avatarText = m.authorType === 'human' ? '🧑' : agent?.emoji || m.authorName[0];
  el.innerHTML = `
    <div class="avatar ${avatarText.length > 2 ? 'text' : ''}">${esc(avatarText)}</div>
    <div class="msg-body">
      <div class="msg-head">
        <span class="msg-author">${esc(m.authorName)}</span>
        ${m.model ? `<span class="msg-model">${esc(m.model)}</span>` : ''}
        <span class="msg-time">${time(m.createdAt)}</span>
      </div>
      <div class="msg-content"></div>
    </div>`;
  const content = $('.msg-content', el);
  if (m.streaming) {
    if (m.content) content.textContent = m.content;
    else {
      content.dataset.empty = '1';
      content.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    }
  } else {
    content.innerHTML = format(m.content);
  }
  return el;
}

function appendMessage(m, scroll = true) {
  const el = buildMessageEl(m);
  messageEls.set(m.id, el);
  els.messages.appendChild(el);
  toggleEmpty();
  if (scroll) maybeScroll(true);
}

function finalizeMessage(m) {
  const el = messageEls.get(m.id);
  if (!el) return appendMessage(m);
  el.classList.remove('streaming');
  if (m.interrupted) el.classList.add('interrupted');
  const content = $('.msg-content', el);
  content.dataset.empty = '';
  content.innerHTML = format(m.content);
  maybeScroll();
}

let stickToBottom = true;
els.messages.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = els.messages;
  stickToBottom = scrollHeight - scrollTop - clientHeight < 80;
});
function maybeScroll(force = false) {
  if (force || stickToBottom) els.messages.scrollTop = els.messages.scrollHeight;
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

function renderAgents() {
  const agents = state.room?.agents ?? [];
  els.agentCount.textContent = agents.length;
  els.agentList.innerHTML = '';
  if (!agents.length) {
    els.agentList.innerHTML = '<div class="agents-empty">No agents yet. Add one below — pick a preset to go fast.</div>';
    return;
  }
  const provider = (id) => state.providers.find((p) => p.id === id);
  for (const a of agents) {
    const card = document.createElement('div');
    card.className = `agent-card${a.id === state.speakingAgentId ? ' speaking' : ''}`;
    card.style.setProperty('--c', a.color);
    const warn = provider(a.providerId) && !provider(a.providerId).configured ? ' ⚠️' : '';
    const overrides = [a.temperature != null && `t=${a.temperature}`, a.maxTokens != null && `${a.maxTokens} tok`].filter(Boolean);
    card.innerHTML = `
      <div class="avatar ${a.emoji.length > 2 ? 'text' : ''}">${esc(a.emoji)}</div>
      <div>
        <div class="ac-name">${esc(a.name)}</div>
        <div class="ac-model" title="${esc(a.persona)}">${esc(a.providerId)}/${esc(a.model)}${warn}${overrides.length ? ` · ${overrides.join(' · ')}` : ''}</div>
      </div>
      <div class="ac-actions">
        <button title="Edit" data-act="edit">✎</button>
        <button title="Remove" data-act="remove">✕</button>
      </div>`;
    $('[data-act="edit"]', card).addEventListener('click', () => startEditAgent(a));
    $('[data-act="remove"]', card).addEventListener('click', () =>
      guarded(() => api('DELETE', roomPath(`/agents/${a.id}`))),
    );
    els.agentList.appendChild(card);
  }
}

function startEditAgent(a) {
  state.editingAgentId = a.id;
  els.agentFormTitle.textContent = `Edit ${a.name}`;
  els.btnSaveAgent.textContent = 'Save changes';
  els.btnCancelEdit.hidden = false;
  els.agentEmoji.value = a.emoji;
  els.agentName.value = a.name;
  els.agentPersona.value = a.persona;
  els.agentProvider.value = a.providerId;
  onProviderChange();
  els.agentModel.value = a.model;
  els.agentTemperature.value = a.temperature ?? '';
  els.agentMaxTokens.value = a.maxTokens ?? '';
  els.agentsPanel.classList.add('open');
  els.agentName.focus();
}

function resetAgentForm() {
  state.editingAgentId = null;
  els.agentFormTitle.textContent = 'Add an agent';
  els.btnSaveAgent.textContent = 'Add agent';
  els.btnCancelEdit.hidden = true;
  els.agentEmoji.value = '';
  els.agentName.value = '';
  els.agentPersona.value = '';
  els.agentTemperature.value = '';
  els.agentMaxTokens.value = '';
  const preferred = state.providers.find((p) => p.configured && p.id !== 'mock' && p.id !== 'ollama') || state.providers[0];
  if (preferred) els.agentProvider.value = preferred.id;
  onProviderChange();
}

function onProviderChange() {
  const p = state.providers.find((x) => x.id === els.agentProvider.value);
  els.modelList.innerHTML = (p?.models ?? []).map((m) => `<option value="${esc(m)}"></option>`).join('');
  if (!p) return;
  if (!p.models.includes(els.agentModel.value)) els.agentModel.value = p.models[0] ?? '';
  els.providerHint.className = `provider-hint${p.configured ? '' : ' warn'}`;
  els.providerHint.textContent = p.configured
    ? p.id === 'mock'
      ? 'Offline: canned, persona-flavoured replies. Great for trying the app.'
      : p.baseUrl
        ? `Requests go to ${p.baseUrl}`
        : ''
    : `Not configured — set ${p.requires} on the server and restart.`;
}

els.agentProvider.addEventListener('change', onProviderChange);
els.btnCancelEdit.addEventListener('click', resetAgentForm);

els.agentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const spec = {
    name: els.agentName.value.trim(),
    emoji: els.agentEmoji.value.trim(),
    persona: els.agentPersona.value.trim(),
    providerId: els.agentProvider.value,
    model: els.agentModel.value.trim(),
    temperature: els.agentTemperature.value === '' ? null : +els.agentTemperature.value,
    maxTokens: els.agentMaxTokens.value === '' ? null : +els.agentMaxTokens.value,
  };
  guarded(async () => {
    if (state.editingAgentId) await api('PATCH', roomPath(`/agents/${state.editingAgentId}`), spec);
    else await api('POST', roomPath('/agents'), spec);
    resetAgentForm();
  });
});

function renderPresetChips() {
  els.presetChips.innerHTML = '';
  for (const p of state.presets.personas) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = `${p.emoji} ${p.name}`;
    chip.title = p.persona;
    chip.addEventListener('click', () => {
      els.agentEmoji.value = p.emoji;
      els.agentName.value = p.name;
      els.agentPersona.value = p.persona;
    });
    els.presetChips.appendChild(chip);
  }
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

els.btnStart.addEventListener('click', () => guarded(() => api('POST', roomPath('/start'))));
els.btnPause.addEventListener('click', () => guarded(() => api('POST', roomPath('/pause'))));
els.btnStep.addEventListener('click', () => guarded(() => api('POST', roomPath('/step'))));
els.btnReset.addEventListener('click', () => {
  if (!state.messages.length || confirm('Clear the whole transcript?')) guarded(() => api('POST', roomPath('/reset')));
});

els.btnMore.addEventListener('click', (e) => {
  e.stopPropagation();
  els.moreMenu.hidden = !els.moreMenu.hidden;
});
document.addEventListener('click', () => (els.moreMenu.hidden = true));
els.moreMenu.addEventListener('click', (e) => {
  const action = e.target.closest('button')?.dataset.action;
  if (!action) return;
  els.moreMenu.hidden = true;
  switch (action) {
    case 'settings':
      openSettings();
      break;
    case 'export-md':
      window.open(roomPath('/export'), '_blank');
      break;
    case 'export-json':
      window.open(roomPath('/export?format=json'), '_blank');
      break;
    case 'delete':
      if (confirm(`Delete room "${state.room?.name}"? This cannot be undone.`)) {
        guarded(() => api('DELETE', roomPath()));
      }
      break;
    default:
      break;
  }
});

// Composer
els.composer.addEventListener('submit', (e) => {
  e.preventDefault();
  const content = els.composerInput.value.trim();
  if (!content) return;
  els.composerInput.value = '';
  autosize();
  guarded(() => api('POST', roomPath('/messages'), { content }));
});
els.composerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    els.composer.requestSubmit();
  }
});
function autosize() {
  const ta = els.composerInput;
  ta.style.height = 'auto';
  ta.style.height = `${Math.min(160, ta.scrollHeight)}px`;
}
els.composerInput.addEventListener('input', autosize);

// Mobile drawers
$('#btn-toggle-sidebar').addEventListener('click', () => els.sidebar.classList.toggle('open'));
$('#btn-toggle-agents').addEventListener('click', () => els.agentsPanel.classList.toggle('open'));

// ---------------------------------------------------------------------------
// New room dialog
// ---------------------------------------------------------------------------

$('#btn-new-room').addEventListener('click', () => {
  els.nrName.value = '';
  els.nrTopic.value = '';
  els.nrPresets.innerHTML = state.presets.personas
    .map(
      (p, i) => `<label><input type="checkbox" value="${i}" ${i < 3 ? 'checked' : ''}/> ${p.emoji} ${esc(p.name)}</label>`,
    )
    .join('');
  els.topicChips.innerHTML = '';
  for (const t of state.presets.topics) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = t.length > 48 ? `${t.slice(0, 47)}…` : t;
    chip.addEventListener('click', () => (els.nrTopic.value = t));
    els.topicChips.appendChild(chip);
  }
  els.dlgNewRoom.showModal();
  els.nrName.focus();
});

els.newRoomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const providerId = els.nrProvider.value;
  const provider = state.providers.find((p) => p.id === providerId);
  const chosen = $$('input:checked', els.nrPresets).map((cb) => state.presets.personas[+cb.value]);
  const topic = els.nrTopic.value.trim();
  const body = {
    name: els.nrName.value.trim() || (topic ? topic.slice(0, 40) : 'New room'),
    topic,
    agents: chosen.map((p) => ({ ...p, providerId, model: provider?.models[0] })),
  };
  guarded(async () => {
    const room = await api('POST', '/api/rooms', body);
    els.dlgNewRoom.close();
    selectRoom(room.id);
  });
});

// ---------------------------------------------------------------------------
// Settings dialog
// ---------------------------------------------------------------------------

const SETTING_KEYS = ['mode', 'maxTurns', 'turnDelayMs', 'maxTokens', 'temperature', 'historyLimit', 'humanName', 'stopPhrase'];

function openSettings() {
  const r = state.room;
  if (!r) return;
  $('#st-name').value = r.name;
  $('#st-topic').value = r.topic;
  for (const key of SETTING_KEYS) $(`#st-${key}`).value = r.settings[key] ?? '';
  $('#st-autoReply').checked = r.settings.autoReply !== false;
  els.dlgSettings.showModal();
}

els.settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const settings = { autoReply: $('#st-autoReply').checked };
  for (const key of SETTING_KEYS) settings[key] = $(`#st-${key}`).value;
  guarded(async () => {
    await api('PATCH', roomPath(), { name: $('#st-name').value, topic: $('#st-topic').value, settings });
    els.dlgSettings.close();
  });
});

$$('dialog [data-close]').forEach((btn) => btn.addEventListener('click', () => btn.closest('dialog').close()));

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function format(text) {
  const names = (state.room?.agents ?? []).map((a) => a.name).sort((a, b) => b.length - a.length);
  let html = esc(text);
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  if (names.length) {
    const re = new RegExp(`(^|[^\\w])@?(${names.map(escRe).join('|')})(?![\\w])`, 'g');
    html = html.replace(re, (_, pre, name) => `${pre}<span class="mention">${name}</span>`);
  }
  return html;
}

function escRe(s) {
  return esc(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function time(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  const [providers, presets] = await Promise.all([api('GET', '/api/providers'), api('GET', '/api/presets')]);
  state.providers = providers;
  state.presets = presets;

  const options = providers
    .map((p) => `<option value="${p.id}" ${p.configured ? '' : 'disabled'}>${esc(p.label)}${p.configured ? '' : ' (not configured)'}</option>`)
    .join('');
  els.agentProvider.innerHTML = options;
  els.nrProvider.innerHTML = options;
  const preferred = providers.find((p) => p.configured && p.id !== 'mock' && p.id !== 'ollama') || providers[0];
  els.nrProvider.value = preferred.id;

  const ready = providers.filter((p) => p.configured).map((p) => p.label);
  els.providersLine.innerHTML = `<b>Providers:</b> ${ready.map(esc).join(', ')}`;

  renderPresetChips();
  resetAgentForm();
  renderRoom();
  connect();
}

boot().catch((err) => toast(`Failed to load: ${err.message}`));
