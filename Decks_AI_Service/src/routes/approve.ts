import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { runApprove } from '../pipeline/pipeline.js'
import { toLine } from '../pipeline/events.js'
import { log, logError } from '../lib/log.js'

const BodySchema = z.object({
  sessionId: z.string().min(1),
  // The user's edited storyline from the outline review UI (titles,
  // bullets, and optionally a per-section layout choice) — when present,
  // this replaces the drafted approvedStoryline before expansion, so the
  // built deck matches what was actually approved, edits included.
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        bullets: z.array(z.string()).min(1),
        layout: z.enum(['statement', 'key-points', 'heading-media', 'media-text', 'bento', 'data']).optional(),
      }),
    )
    .min(1)
    .optional(),
})

export const approveRoute = new Hono()

approveRoute.post('/approve', async c => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  c.header('Content-Type', 'application/x-ndjson; charset=utf-8')
  c.header('Cache-Control', 'no-cache, no-transform')

  if (!state) {
    log('route.approve', 'session not found', { sessionId: body.data.sessionId })
    return stream(c, async s => {
      await s.write(toLine({ t: 'error', message: 'Session expired or not found — please start a new deck.', code: 'SESSION_NOT_FOUND' }))
    })
  }

  if (body.data.sections) {
    state.approvedStoryline = body.data.sections
  }

  if (!state.approvedStoryline) {
    log('route.approve', 'no storyline to approve', { sessionId: body.data.sessionId })
    return stream(c, async s => {
      await s.write(toLine({ t: 'error', message: 'No storyline to approve yet.', code: 'NO_STORYLINE' }))
    })
  }

  return stream(c, async s => {
    const emit = async (event: Parameters<typeof toLine>[0]) => {
      await s.write(toLine(event))
    }
    try {
      await runApprove(state, emit)
    } catch (err) {
      logError('route.approve', err)
      await emit({ t: 'error', message: 'Something went wrong building your slides. Please try again.', code: 'PIPELINE_ERROR' })
    }
  })
})
