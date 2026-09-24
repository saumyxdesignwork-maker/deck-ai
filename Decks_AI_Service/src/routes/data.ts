import { Hono } from 'hono'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { logError, log } from '../lib/log.js'

const MAX_ROWS = 50

const DatasetSchema = z.object({
  source: z.string().min(1),
  capturedAt: z.string().min(1),
  columns: z.array(z.object({ name: z.string().min(1), role: z.enum(['label', 'value', 'ignore']) })).min(1),
  rows: z.array(z.record(z.string(), z.string())).min(1).max(MAX_ROWS),
})

const BodySchema = z.object({ sessionId: z.string().min(1), dataset: DatasetSchema })

export const dataRoute = new Hono()

// Attaches a dataset to the session so the next storyline draft / deck
// expansion can ground its content in it. Non-streaming JSON, like /verify
// and /rewrite — a single request/response, no gates.
dataRoute.post('/data', async c => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  if (!state) return c.json({ error: 'Session expired or not found' }, 404)

  try {
    state.dataset = body.data.dataset
    log('route.data', 'dataset attached', { sessionId: state.id, source: body.data.dataset.source, rows: body.data.dataset.rows.length })
    return c.json({ ok: true })
  } catch (err) {
    logError('route.data', err)
    return c.json({ error: 'Something went wrong attaching this data' }, 500)
  }
})
