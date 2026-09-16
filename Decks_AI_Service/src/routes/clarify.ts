import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { runClarify } from '../pipeline/pipeline.js'
import { toLine } from '../pipeline/events.js'
import { log, logError } from '../lib/log.js'

const BodySchema = z.object({ sessionId: z.string().min(1), answer: z.string().min(1) })

export const clarifyRoute = new Hono()

clarifyRoute.post('/clarify', async c => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  if (!state) {
    log('route.clarify', 'session not found', { sessionId: body.data.sessionId })
    c.header('Content-Type', 'application/x-ndjson; charset=utf-8')
    return stream(c, async s => {
      await s.write(toLine({ t: 'error', message: 'Session expired or not found — please start a new deck.', code: 'SESSION_NOT_FOUND' }))
    })
  }

  c.header('Content-Type', 'application/x-ndjson; charset=utf-8')
  c.header('Cache-Control', 'no-cache, no-transform')

  return stream(c, async s => {
    const emit = async (event: Parameters<typeof toLine>[0]) => {
      await s.write(toLine(event))
    }
    try {
      await runClarify(state, body.data.answer, emit)
    } catch (err) {
      logError('route.clarify', err)
      await emit({ t: 'error', message: 'Something went wrong drafting your storyline. Please try again.', code: 'PIPELINE_ERROR' })
    }
  })
})
