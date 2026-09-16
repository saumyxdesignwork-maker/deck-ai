/** Structured console logging. Never pass secrets (API keys, raw auth headers) to this. */
export function log(scope: string, message: string, extra?: Record<string, unknown>) {
  const line = `[${new Date().toISOString()}] [${scope}] ${message}`
  if (extra) console.log(line, extra)
  else console.log(line)
}

export function logError(scope: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[${new Date().toISOString()}] [${scope}] ERROR: ${message}`)
}
