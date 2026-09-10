import { readSSE, readErrorBody } from './sse.js';

/**
 * Streams a chat completion from any OpenAI-compatible `/chat/completions` endpoint
 * (OpenAI, OpenRouter, Ollama, LM Studio, vLLM, ...).
 *
 * @param {object} opts
 * @param {string} opts.baseUrl   e.g. https://api.openai.com/v1
 * @param {string} [opts.apiKey]
 * @param {string} opts.model
 * @param {Array<{role:string, content:string}>} opts.messages  (system message included)
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {AbortSignal} [opts.signal]
 * @param {Record<string,string>} [opts.extraHeaders]
 * @returns {AsyncGenerator<string>} text deltas
 */
export async function* streamOpenAI({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.9,
  maxTokens = 400,
  signal,
  extraHeaders = {},
}) {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${await readErrorBody(res)}`);
  }

  for await (const data of readSSE(res.body, signal)) {
    if (data === '[DONE]') return;
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      continue;
    }
    if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
    const delta = json.choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}
