import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { z } from 'zod'
import { newId } from '../lib/ids.js'
import { createSession } from '../session/store.js'
import { runGenerate } from '../pipeline/pipeline.js'
import { toLine } from '../pipeline/events.js'
import { logError } from '../lib/log.js'

const BodySchema = z.object({
  prompt: z.string().min(1),
  user: z.object({
    name: z.string().min(1),
    email: z.string().optional(),
    designation: z.string().optional(),
  }),
  preferences: z.record(z.string(), z.unknown()).optional(),
})

export const generateRoute = new Hono()

generateRoute.post('/generate', async c => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const sessionId = newId('session')
  const state = createSession(sessionId, body.data.prompt, body.data.user)

  c.header('Content-Type', 'application/x-ndjson; charset=utf-8')
  c.header('Cache-Control', 'no-cache, no-transform')
  c.header('X-Content-Type-Options', 'nosniff')

  return stream(c, async s => {
    const emit = async (event: Parameters<typeof toLine>[0]) => {
      await s.write(toLine(event))
    }
    try {
      await emit({ t: 'session', sessionId })
      await runGenerate(state, emit)
    } catch (err) {
      logError('route.generate', err)
      await emit({ t: 'error', message: 'Something went wrong generating your deck. Please try again.', code: 'PIPELINE_ERROR' })
    }
  })
})
