// Mirrors Decks_AI_Service/src/pipeline/events.ts — keep these two files in
// sync by hand (the two repos aren't an npm workspace, so types can't be
// shared directly). This is the NDJSON wire protocol streamed back by every
// /generate, /clarify, /approve, /regenerate, /followup call.

import type { ChatItem, ChatItemPatch, ClarifyQuestion, OutlineSection } from './studioScript'
import type { DeckData } from './fixtures'

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
