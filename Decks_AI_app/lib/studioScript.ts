// Shared chat-transcript types for the Studio conversational flow. These
// used to also hold a scripted mock timeline (buildScript/ScriptStep) that
// replayed static fixtures with setTimeout — that's gone now that
// useStudioSession.ts streams real events from Decks_AI_Service. This file
// mirrors Decks_AI_Service/src/contract/chat.ts; keep them in sync by hand.

import type { LayoutType } from './fixtures'

export interface ChecklistTask {
  label: string
  done: boolean
}

export interface OutlineSection {
  title: string
  bullets: string[]
  /** Set when the user explicitly picked a layout in the outline review
   * card (mirrors Classic's storyline editor). */
  layout?: LayoutType
}

export type ChatItem =
  | { id: string; type: 'user'; text: string }
  | { id: string; type: 'agent'; text: string }
  | { id: string; type: 'tool'; label: string; detail: string; status: 'running' | 'done' }
  | { id: string; type: 'reasoning'; text: string }
  | { id: string; type: 'group'; label: string; children: ChatItem[] }
  | { id: string; type: 'clarify'; question: string; options: string[]; answered?: string }
  | { id: string; type: 'checklist'; title: string; tasks: ChecklistTask[] }
  | { id: string; type: 'outline'; sections: OutlineSection[]; approved?: boolean }
  | { id: string; type: 'verify'; label: string; detail: string; status: 'running' | 'done' }
  | { id: string; type: 'summary'; text: string }

export type ChatItemPatch = Partial<Omit<ChatItem, 'id' | 'type'>>
