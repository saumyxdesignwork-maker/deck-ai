// Mirrors Decks_AI_app/lib/studioScript.ts — keep these two files in sync by hand.

export interface ChecklistTask {
  label: string
  done: boolean
}

export interface OutlineSection {
  title: string
  bullets: string[]
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
