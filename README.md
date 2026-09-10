# AI Chat Room

A chat room where several AI agents talk to each other — and to you.

Give each agent a name and a persona, pick a model for it (mix providers freely: an
OpenAI agent can argue with a Claude agent and a local Llama), set a topic, press
**Start**, and watch the conversation stream in. Jump in any time with your own
message; `@mention` an agent to hand them the floor.

Works out of the box with **no API keys** thanks to an offline mock provider, so
you can try the whole thing before wiring up real models.

## Features

- **Multiple agents, multiple providers** — OpenAI, Anthropic, OpenRouter, Ollama /
  LM Studio / any OpenAI-compatible endpoint, plus a built-in offline mock.
- **Live streaming** — tokens are pushed to every connected browser over WebSockets.
- **Turn-taking modes** — round-robin, random, or round-robin with `@mention` override.
  Human messages that `@mention` an agent always route to that agent next.
- **Controls** — Start / Pause / Step (one message at a time) / Reset, a turn limit,
  delay between turns, max tokens, temperature and context-window size.
- **Human in the loop** — post messages as the host; agents see and respond to them.
  Posting to a paused room gets you one reply automatically (configurable).
- **Stop phrase** — optionally let agents end the conversation themselves by saying
  e.g. `[END]` once they've reached a conclusion.
- **Personas & presets** — eight ready-made characters, or write your own system prompt.
  Each agent can override the room's temperature and max tokens.
- **Multiple rooms**, each with its own participants, topic and settings.
- **Persistence** — rooms and transcripts are saved to `data/rooms.json` and restored
  on restart (disable with `PERSIST=0`, relocate with `DATA_DIR`).
- **Export** the transcript as Markdown or JSON.

## Quick start

```bash
npm install
npm start
# open http://localhost:3000
```

A demo room with four mock agents is created on boot. Press **▶ Start**.

## Connecting real models

Copy `.env.example` to `.env` (or export the variables) and restart the server:

| Provider | Variable(s) | Notes |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY`, optional `OPENAI_BASE_URL` | Any chat-completions model |
| Anthropic | `ANTHROPIC_API_KEY` | Messages API, streaming |
| OpenRouter | `OPENROUTER_API_KEY` | Hundreds of models behind one key |
| Ollama / local | `OLLAMA_BASE_URL` (default `http://localhost:11434/v1`) | No key needed; works with LM Studio, vLLM, etc. |

The UI only offers providers that are configured; the "Add agent" panel shows a
hint for the ones that are not. The model field is free text, so any model id your
provider accepts will work.

Keys never leave the server — the browser only ever sees provider ids and model names.

## How a turn works

1. The room picks the next speaker (see *Turn order* in room settings).
2. It builds that agent's view of the conversation: its persona and the room rules
   as the system prompt; its own past messages as `assistant` turns; everyone else's
   messages as `user` turns of the form `[Name]: text`. Adjacent same-role turns are
   merged so the sequence strictly alternates (Anthropic requires this).
3. The reply streams to all subscribers as `message:start` → `message:delta`* →
   `message:end`.
4. If the provider errors, a system note is posted and the room pauses instead of
   spinning on a broken configuration.

## API

State is held in memory and mirrored to `data/rooms.json` (debounced, atomic writes;
flushed on `SIGINT`/`SIGTERM`). Endpoints:

```
GET    /api/providers                       configured providers & suggested models
GET    /api/presets                         persona presets & topic ideas
GET    /api/rooms                           list rooms
POST   /api/rooms                           { name, topic, settings, agents[] }
GET    /api/rooms/:id                       room + full transcript
PATCH  /api/rooms/:id                       { name, topic, settings }
DELETE /api/rooms/:id
POST   /api/rooms/:id/agents                { name, persona, providerId, model, emoji, color, temperature?, maxTokens? }
PATCH  /api/rooms/:id/agents/:agentId
DELETE /api/rooms/:id/agents/:agentId
POST   /api/rooms/:id/messages              { content }  — speak as the human host
POST   /api/rooms/:id/start | pause | step | reset
GET    /api/rooms/:id/export?format=md|json
WS     /ws                                  send {type:"subscribe", roomId}
```

WebSocket events: `rooms`, `snapshot`, `room`, `message`, `message:start`,
`message:delta`, `message:end`, `message:remove`, `reset`, `room:deleted`, `error`.

## Project layout

```
server/
  index.js          HTTP + WebSocket server, routes, demo room
  room.js           Room: agents, transcript, turn-taking loop
  prompt.js         builds each agent's system prompt + message history
  presets.js        persona presets and topic suggestions
  export.js         Markdown export
  store.js          debounced, atomic JSON persistence
  providers/
    index.js        provider catalogue + unified streamCompletion()
    openai.js       OpenAI-compatible streaming (OpenAI, OpenRouter, Ollama, ...)
    anthropic.js    Anthropic Messages API streaming
    mock.js         offline provider
    sse.js          server-sent-events parser
public/
  index.html, styles.css, app.js   the client (no build step)
```

## Ideas for next steps

- Let agents call tools (web search, code execution) and share results.
- A "judge" agent that scores the debate and declares a winner.
- Voice: text-to-speech per agent so you can listen to the room.
- Authentication if you expose the server beyond localhost.
