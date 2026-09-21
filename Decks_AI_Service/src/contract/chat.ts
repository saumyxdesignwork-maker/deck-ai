// Mirrors Decks_AI_app/lib/studioScript.ts — keep these two files in sync by hand.

import type { LayoutType } from './deck.js'

export interface ChecklistTask {
  label: string
  done: boolean
}

export interface ClarifyQuestion {
  topic: string
  options: string[]
}

export interface OutlineSection {
  title: string
  bullets: string[]
  /** Set when the user explicitly picked a layout in the outline review UI
   * (mirrors Classic's storyline editor). When present, expandDeck honors
   * it instead of letting the model choose. */
  layout?: LayoutType
}

export type ChatItem =
  | { id: string; type: 'user'; text: string }
  | { id: string; type: 'agent'; text: string }
  | { id: string; type: 'tool'; label: string; detail: string; status: 'running' | 'done' }
  | { id: string; type: 'reasoning'; text: string }
  | { id: string; type: 'group'; label: string; children: ChatItem[] }
  | { id: string; type: 'clarify'; questions: ClarifyQuestion[]; answered?: string[] }
  | { id: string; type: 'checklist'; title: string; tasks: ChecklistTask[] }
  | { id: string; type: 'outline'; sections: OutlineSection[]; approved?: boolean }
  | { id: string; type: 'verify'; label: string; detail: string; status: 'running' | 'done' }
  | { id: string; type: 'summary'; text: string }

export type ChatItemPatch = Partial<Omit<ChatItem, 'id' | 'type'>>
