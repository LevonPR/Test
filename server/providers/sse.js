/**
 * Async generator over the `data:` payloads of a Server-Sent-Events response body.
 * Yields raw strings (one per event); callers decide how to parse them.
 */
export async function* readSSE(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data) yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function readErrorBody(res) {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.error?.message || json.message || text;
    } catch {
      return text;
    }
  } catch {
    return res.statusText;
  }
}
