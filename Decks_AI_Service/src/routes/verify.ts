import { Hono } from 'hono'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { verifyDeck } from '../tiers/verifier.js'
import { logError } from '../lib/log.js'

const BodySchema = z.object({ sessionId: z.string().min(1) })

export const verifyRoute = new Hono()

// Single request/response JSON endpoint — unlike the pipeline phases, a
// content check has no gates or intermediate progress worth streaming.
verifyRoute.post('/verify', async c => {
  const body = BodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  if (!state) return c.json({ error: 'Session expired or not found' }, 404)
  if (!state.deck) return c.json({ error: 'No deck to verify yet' }, 400)

  try {
    const { flags, usedFallback } = await verifyDeck(state.deck)
    return c.json({ flags, usedFallback })
  } catch (err) {
    logError('route.verify', err)
    return c.json({ error: 'Something went wrong verifying the deck' }, 500)
  }
})
