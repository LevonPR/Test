# Vibe Raid — Hugging Face game

Browser raid game powered by **Transformers.js** and a Hugging Face emotion model. Type lines that match the target vibe; the model scores you entirely in-browser.

## Quick start

```bash
cd game
npm install
npm run dev
```

Open the printed local URL. The first run downloads [`onnx-community/emotion-english-distilroberta-base-ONNX`](https://huggingface.co/onnx-community/emotion-english-distilroberta-base-ONNX).

## Hugging Face skills

This repo ships curated [Hugging Face agent skills](https://github.com/huggingface/skills) under `.agents/skills/` so coding agents can load Hub workflows (CLI, Gradio, Spaces, Transformers.js, and more).

Also included:

- `.mcp.json` / `.cursor/mcp.json` — Hugging Face MCP endpoint (`https://huggingface.co/mcp?login`)
- `AGENTS.md` — fallback skill bundle if your client does not auto-discover skills

### Connect MCP in Cursor

1. Open Cursor Settings → MCP
2. Ensure the Hugging Face server from `.cursor/mcp.json` is enabled
3. Sign in when prompted at [huggingface.co/mcp](https://huggingface.co/mcp)

### CLI

```bash
export PATH="$HOME/.local/bin:$PATH"
hf version
hf skills list
hf skills add transformers-js
```

## Stack

- Vite + vanilla JS
- `@huggingface/transformers` (Transformers.js)
- Emotion classification model from the Hub
