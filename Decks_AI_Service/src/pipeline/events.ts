import type { ChatItem, ChatItemPatch, ClarifyQuestion, OutlineSection } from '../contract/chat.js'
import type { DeckData } from '../contract/deck.js'
import type { RenderedDeckHtml } from '../render/renderDeckHtml.js'

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
  /** `rendered`: the deck already compiled into the selected engine template's
   * HTML on the server (see render/renderDeckHtml.ts) — present only for
   * engine templates, and only if compiling succeeded. */
  | { t: 'deck'; deck: DeckData; rendered?: RenderedDeckHtml }
  | { t: 'error'; message: string; code: string }
  | { t: 'done' }
  /** Coarse, honest lifecycle progress for the /approve slide-generation
   * pipeline specifically — four real phases in fixed order, never a
   * fabricated overall percentage. `current`/`total` are only present when
   * the phase has a genuinely countable unit of work (images rendered,
   * slides revealed); 'structure' and 'finalizing' are single atomic steps
   * with nothing to count, so they're indeterminate (no current/total). */
  | { t: 'progress'; phase: 'structure' | 'images' | 'rendering' | 'slides' | 'finalizing'; current?: number; total?: number }

/** Serializes one event as an NDJSON line (including the trailing newline). */
export function toLine(event: StreamEvent): string {
  return JSON.stringify(event) + '\n'
}
