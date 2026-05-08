/**
 * Server-Sent Events (SSE) parser for OpenAI-compatible Chat Completions
 * streaming. Works with the Fetch API stream — no EventSource required.
 *
 * Usage:
 *   for await (const event of sseIterator(response.body)) {
 *     if (event.data === "[DONE]") break;
 *     const json = JSON.parse(event.data);
 *     ...
 *   }
 */

export interface SseEvent {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * Convert a ReadableStream of bytes into an async iterator of SSE events.
 * Handles partial chunks, multi-line data payloads, and comment lines.
 */
export async function* sseIterator(
  body: ReadableStream<Uint8Array> | null,
): AsyncGenerator<SseEvent, void, unknown> {
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE event delimiter is a blank line.
      let delimiterIdx: number;
      // eslint-disable-next-line no-cond-assign
      while ((delimiterIdx = indexOfDelimiter(buffer)) !== -1) {
        const rawEvent = buffer.slice(0, delimiterIdx);
        // Advance past \n\n OR \r\n\r\n
        const delimLen = buffer.startsWith("\r\n\r\n", delimiterIdx)
          ? 4
          : buffer[delimiterIdx] === "\r" || buffer[delimiterIdx + 1] === "\r"
            ? 4
            : 2;
        buffer = buffer.slice(delimiterIdx + delimLen);

        const event = parseEvent(rawEvent);
        if (event) yield event;
      }
    }

    // Flush trailing event without delimiter (rare but allowed per spec).
    if (buffer.trim().length > 0) {
      const event = parseEvent(buffer);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

function indexOfDelimiter(s: string): number {
  const a = s.indexOf("\n\n");
  const b = s.indexOf("\r\n\r\n");
  if (a === -1) return b;
  if (b === -1) return a;
  return Math.min(a, b);
}

function parseEvent(raw: string): SseEvent | null {
  let data = "";
  let event: string | undefined;
  let id: string | undefined;
  let retry: number | undefined;

  for (const line of raw.split(/\r?\n/)) {
    if (line.length === 0) continue;
    if (line.startsWith(":")) continue; // comment
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    switch (field) {
      case "data":
        data = data.length === 0 ? value : `${data}\n${value}`;
        break;
      case "event":
        event = value;
        break;
      case "id":
        id = value;
        break;
      case "retry": {
        const n = Number(value);
        if (!Number.isNaN(n)) retry = n;
        break;
      }
      default:
        break;
    }
  }

  if (data.length === 0 && event === undefined) return null;
  return { data, event, id, retry };
}
