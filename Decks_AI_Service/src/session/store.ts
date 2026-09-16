import type { ChatMessage } from '../openrouter/types.js'
import type { OutlineSection } from '../contract/chat.js'
import type { DeckData } from '../contract/deck.js'
// Type-only import — erased at compile time, so this doesn't create a
// runtime circular dependency with tiers/orchestrator.ts (which imports
// SessionState from this file).
import type { OrchestratorResult } from '../tiers/orchestrator.js'

export interface UserVars {
  name: string
  email?: string
  designation?: string
}

export type CopyDirective = OrchestratorResult['copyDirective']
export type DesignDirective = OrchestratorResult['designDirective']

export interface SessionState {
  id: string
  createdAt: number
  lastActiveAt: number
  prompt: string
  user: UserVars
  /** Raw chat history handed to the Orchestrator across turns. */
  history: ChatMessage[]
  copyDirective?: CopyDirective
  designDirective?: DesignDirective
  clarifyAnswer?: string
  /** The approved storyline — authoritative input for the full-deck expansion,
   * so the built slides always match what the user approved. */
  approvedStoryline?: OutlineSection[]
  deck?: DeckData
}

// Generous on purpose — this is a single-user dev tool and a SessionState is
// a few small JS objects (no images: those live on disk, only URLs are held
// here), so there's no real memory pressure to trade off against. A user
// reading a generated storyline, stepping away, or just chatting slowly
// should not come back to "session expired". Was 30 minutes; that was too
// tight against normal pacing and produced a confusing dead end.
const SESSION_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours
const SWEEP_INTERVAL_MS = 15 * 60 * 1000

const sessions = new Map<string, SessionState>()

export function createSession(id: string, prompt: string, user: UserVars): SessionState {
  const now = Date.now()
  const state: SessionState = {
    id,
    createdAt: now,
    lastActiveAt: now,
    prompt,
    user,
    history: [],
  }
  sessions.set(id, state)
  return state
}

export function getSession(id: string): SessionState | undefined {
  const state = sessions.get(id)
  if (state) state.lastActiveAt = Date.now()
  return state
}

export function deleteSession(id: string): void {
  sessions.delete(id)
}

// Bound memory: sweep sessions that have been idle past the TTL. A backend
// restart also drops all sessions — routes handle SESSION_NOT_FOUND by
// telling the client to start over rather than hanging.
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS
  for (const [id, state] of sessions) {
    if (state.lastActiveAt < cutoff) sessions.delete(id)
  }
}, SWEEP_INTERVAL_MS).unref()
