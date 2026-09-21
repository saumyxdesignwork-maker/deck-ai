// NDJSON stream reader for the Decks_AI_Service backend. Each streaming
// route (/generate, /clarify, /approve, /regenerate, /followup) responds
// with one JSON object per line; this reads the response body incrementally
// and calls `onEvent` for each complete line, buffering across chunk
// boundaries (a single JSON object can be split across multiple reads).

export const SERVICE_BASE_URL = process.env.NEXT_PUBLIC_DECKS_SERVICE_URL ?? 'http://localhost:8787'

export class DeckServiceError extends Error {}

export async function fetchStream<TEvent>(path: string, body: unknown, onEvent: (event: TEvent) => void): Promise<void> {
  const res = await fetch(`${SERVICE_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok || !res.body) {
    throw new DeckServiceError(`Decks AI Service request to ${path} failed with status ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    // The last element may be an incomplete line — keep it in the buffer
    // for the next chunk instead of parsing a partial JSON object.
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim()) continue
      onEvent(JSON.parse(line) as TEvent)
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as TEvent)
  }
}

/** Plain request/response JSON call — for routes with no gates or
 * intermediate progress worth streaming (e.g. /verify). */
export async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`${SERVICE_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new DeckServiceError(`Decks AI Service request to ${path} failed with status ${res.status}`)
  }
  return res.json() as Promise<TResponse>
}
