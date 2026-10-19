// Mirrors Decks_AI_Service/src/pipeline/events.ts — keep these two files in
// sync by hand (the two repos aren't an npm workspace, so types can't be
// shared directly). This is the NDJSON wire protocol streamed back by every
// /generate, /clarify, /approve, /regenerate, /followup call.

import type { ChatItem, ChatItemPatch, ClarifyQuestion, OutlineSection } from './studioScript'
import type { DeckData } from './fixtures'

/** A generated deck already compiled into its engine template's HTML on the
 * server (mirrors RenderedDeckHtml in Decks_AI_Service/src/render/
 * renderDeckHtml.ts). `key` is the engineDeckKey() of the engine deck it was
 * compiled from — EngineDeck shows it only while the live deck still
 * produces the same key (see lib/template-engine-adapter.ts). */
export interface RenderedDeckHtml {
  vl: string
  key: string
  css: string
  scopeClass: string
  frame: { w: number; h: number }
  slideIds: string[]
  slides: string[]
}

export type StreamEvent =
  | { t: 'session'; sessionId: string }
  | { t: 'chat'; item: ChatItem }
  | { t: 'update'; id: string; patch: ChatItemPatch }
  | { t: 'group-push'; groupId: string; item: ChatItem }
  | { t: 'clarify'; id: string; questions: ClarifyQuestion[] }
  | { t: 'outline'; id: string; sections: OutlineSection[] }
  | { t: 'preview'; state: 'preparing' | 'thumbs' | 'done' }
  | { t: 'reveal-slide'; index: number }
  /** `rendered` is present for engine templates when the server compiled the deck. */
  | { t: 'deck'; deck: DeckData; rendered?: RenderedDeckHtml }
  | { t: 'error'; message: string; code: string }
  | { t: 'done' }
  /** Coarse, honest lifecycle progress for /approve's real phases —
   * see the backend's events.ts for the full reasoning. current/total are
   * only present for the two countable phases (images, slides). */
  | { t: 'progress'; phase: 'structure' | 'images' | 'rendering' | 'slides' | 'finalizing'; current?: number; total?: number }
