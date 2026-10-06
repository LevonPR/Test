# Project Status — AI Chat Room

_Last reviewed: 2026-10-05_

**Priority:** P1 — Finish next  
**Scoped target:** stable public-ready multi-provider web v1 plus standardized Android wrapper  
**Realistic completion:** **85%**

## Already in place

- multiple rooms and multiple agents;
- OpenAI-compatible, Anthropic, OpenRouter, Ollama/local and mock providers;
- streaming over WebSockets;
- turn-taking, @mention routing, pause/step/reset;
- host participation and stop phrases;
- persona presets and per-agent settings;
- JSON persistence and transcript export;
- provider error handling;
- unit tests for room logic;
- separate Android wrapper branch exists.

## Remaining work

1. Merge or standardize the Android wrapper work.
2. Add authentication before public internet exposure.
3. Add rate limits, request/body limits and abuse controls.
4. Move durable production state from a local JSON file to an appropriate datastore.
5. Add provider timeout/retry/cancellation tests.
6. Add CI for tests and a repeatable deployment configuration.
7. Add structured logs/monitoring and safe secret configuration.
8. Add browser/mobile integration tests.
9. Define a permission and sandbox model before adding agent tools.

## Exit criteria

A user can sign in, create a room, configure real providers, run a long multi-agent conversation reliably, reconnect without losing state, export it, and use the Android client without exposing API keys or allowing unbounded anonymous abuse.
