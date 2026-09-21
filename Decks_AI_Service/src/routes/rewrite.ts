import { Hono } from 'hono'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { rewriteText } from '../tiers/rewriter.js'
import { logError } from '../lib/log.js'

const BodySchema = z.object({
  sessionId: z.string().min(1),
  text: z.string(),
  instruction: z.string().min(1),
  sectionTitle: z.string().optional(),
})

export const rewriteRoute = new Hono()

// Single request/response JSON endpoint, like /verify — a one-block rewrite
// has no gates or intermediate progress worth streaming.
rewriteRoute.post('/rewrite', async c => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  if (!state) return c.json({ error: 'Session expired or not found' }, 404)

  try {
    const { text, usedFallback } = await rewriteText(body.data.text, body.data.instruction, body.data.sectionTitle)
    return c.json({ text, usedFallback })
  } catch (err) {
    logError('route.rewrite', err)
    return c.json({ error: 'Something went wrong rewriting this text' }, 500)
  }
})
