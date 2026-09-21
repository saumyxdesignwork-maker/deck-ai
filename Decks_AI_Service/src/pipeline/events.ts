import type { ChatItem, ChatItemPatch, ClarifyQuestion, OutlineSection } from '../contract/chat.js'
import type { DeckData } from '../contract/deck.js'

/**
 * NDJSON wire protocol emitted by every streaming route. Thin wrapper around
 * the frontend's existing ChatItem/ScriptStep shapes — Decks_AI_app's
 * useStudioSession.ts `applyStep` consumes these 1:1 (see t:'chat'/'update'/
 * 'group-push'/'preview'/'reveal-slide', which map to its existing branches).
 * Additions beyond the old mock's ScriptStep kinds: `session`, `deck`,
 * `error`, `done`. There is no `delay` field — pacing comes from real
 * network arrival, not scripted timers.
 */
export type StreamEvent =
  | { t: 'session'; sessionId: string }
  | { t: 'chat'; item: ChatItem }
  | { t: 'update'; id: string; patch: ChatItemPatch }
  | { t: 'group-push'; groupId: string; item: ChatItem }
  | { t: 'clarify'; id: string; questions: ClarifyQuestion[] }
  | { t: 'outline'; id: string; sections: OutlineSection[] }
  | { t: 'preview'; state: 'preparing' | 'thumbs' | 'done' }
  | { t: 'reveal-slide'; index: number }
  | { t: 'deck'; deck: DeckData }
  | { t: 'error'; message: string; code: string }
  | { t: 'done' }

/** Serializes one event as an NDJSON line (including the trailing newline). */
export function toLine(event: StreamEvent): string {
  return JSON.stringify(event) + '\n'
}
