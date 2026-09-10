import { readSSE, readErrorBody } from './sse.js';

/**
 * Streams a reply from the Anthropic Messages API.
 * Expects `messages` to already alternate user/assistant and start with `user`
 * (see prompt.js); the system prompt is passed separately.
 *
 * @returns {AsyncGenerator<string>} text deltas
 */
export async function* streamAnthropic({
  baseUrl = 'https://api.anthropic.com',
  apiKey,
  model,
  system,
  messages,
  temperature = 0.9,
  maxTokens = 400,
  signal,
}) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/messages`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system,
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
    let event;
    try {
      event = JSON.parse(data);
    } catch {
      continue;
    }
    switch (event.type) {
      case 'content_block_delta':
        if (event.delta?.type === 'text_delta' && event.delta.text) yield event.delta.text;
        break;
      case 'error':
        throw new Error(event.error?.message || 'Anthropic stream error');
      case 'message_stop':
        return;
      default:
        break;
    }
  }
}
