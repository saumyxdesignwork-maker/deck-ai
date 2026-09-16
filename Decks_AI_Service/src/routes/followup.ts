import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { runFollowup } from '../pipeline/pipeline.js'
import { toLine } from '../pipeline/events.js'
import { log, logError } from '../lib/log.js'

const BodySchema = z.object({ sessionId: z.string().min(1), text: z.string().min(1) })

export const followupRoute = new Hono()

followupRoute.post('/followup', async c => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  c.header('Content-Type', 'application/x-ndjson; charset=utf-8')
  c.header('Cache-Control', 'no-cache, no-transform')

  if (!state) {
    log('route.followup', 'session not found', { sessionId: body.data.sessionId })
    return stream(c, async s => {
      await s.write(toLine({ t: 'error', message: 'Session expired or not found — please start a new deck.', code: 'SESSION_NOT_FOUND' }))
    })
  }

  return stream(c, async s => {
    const emit = async (event: Parameters<typeof toLine>[0]) => {
      await s.write(toLine(event))
    }
    try {
      await runFollowup(state, body.data.text, emit)
    } catch (err) {
      logError('route.followup', err)
      await emit({ t: 'error', message: 'Something went wrong processing that. Please try again.', code: 'PIPELINE_ERROR' })
    }
  })
})
