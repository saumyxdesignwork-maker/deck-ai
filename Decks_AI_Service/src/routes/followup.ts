import { Hono, type Context } from 'hono'
import { stream } from 'hono/streaming'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { runEdit } from '../pipeline/pipeline.js'
import { toLine } from '../pipeline/events.js'
import { log, logError } from '../lib/log.js'
import type { DeckData } from '../contract/deck.js'

// /edit is the real canvas-first editing route: the client sends its
// *current* deck (fixing the staleness of state.deck, which pipeline.ts
// otherwise only ever writes once, inside runApprove) plus the instruction
// and, optionally, which slide is active so the Coordinator can scope
// ambiguous requests to it. /followup is kept as a body-compatible alias
// (its old `text` field maps to `instruction`) so nothing else has to change
// at once — the client is being repointed at /edit in this same pass.
const EditBodySchema = z.object({
  sessionId: z.string().min(1),
  instruction: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  deck: z.custom<DeckData>(v => !!v && typeof v === 'object').optional(),
  activeSectionId: z.string().optional(),
})

export const followupRoute = new Hono()

async function handleEdit(c: Context) {
  const body = EditBodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const instruction = body.data.instruction ?? body.data.text
  if (!instruction) return c.json({ error: 'Invalid request body', issues: 'instruction (or text) is required' }, 400)

  const state = getSession(body.data.sessionId)
  c.header('Content-Type', 'application/x-ndjson; charset=utf-8')
  c.header('Cache-Control', 'no-cache, no-transform')

  if (!state) {
    log('route.edit', 'session not found', { sessionId: body.data.sessionId })
    return stream(c, async s => {
      await s.write(toLine({ t: 'error', message: 'Session expired or not found — please start a new deck.', code: 'SESSION_NOT_FOUND' }))
    })
  }

  // The client's live deck is authoritative for an edit (it carries any
  // unsaved inline edits); fall back to the backend's last-known deck if the
  // caller didn't send one (e.g. an old /followup client).
  const deck = body.data.deck ?? state.deck
  if (!deck) {
    return stream(c, async s => {
      await s.write(toLine({ t: 'error', message: 'No deck to edit yet — generate a deck first.', code: 'NO_STORYLINE' }))
    })
  }

  return stream(c, async s => {
    const emit = async (event: Parameters<typeof toLine>[0]) => {
      await s.write(toLine(event))
    }
    try {
      await runEdit(state, instruction, deck, body.data.activeSectionId, emit)
    } catch (err) {
      logError('route.edit', err)
      await emit({ t: 'error', message: 'Something went wrong processing that. Please try again.', code: 'PIPELINE_ERROR' })
    }
  })
}

followupRoute.post('/edit', handleEdit)
followupRoute.post('/followup', handleEdit)
