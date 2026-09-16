// Declarative "agent transcript" script for the Studio conversational flow.
// This is a scripted mock — no real AI runs here. Each step advances the
// chat transcript and/or the deck preview after a fixed delay, exactly like
// the existing app/create/generating/page.tsx setTimeout theater.

import { MOCK_DECK, MOCK_STORYLINE } from './fixtures'

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

export type ScriptStep =
  | { kind: 'chat'; delay: number; item: ChatItem }
  | { kind: 'update'; delay: number; id: string; patch: ChatItemPatch }
  | { kind: 'group-push'; delay: number; groupId: string; item: ChatItem }
  | { kind: 'clarify'; delay: number; id: string; question: string; options: string[] }
  | { kind: 'outline'; delay: number; id: string; sections: OutlineSection[] }
  | { kind: 'preview'; delay: number; state: 'preparing' | 'thumbs' | 'done' }
  | { kind: 'reveal-slide'; delay: number; index: number }

const REASONING_INTENT = `Let me think through this brief before drafting a storyline:

1. Parsed the request for audience, tone, and primary goal signals
2. The goal isn't fully specified — it could be an investor pitch, an internal update, or something else entirely
3. Guessing wrong here would send the whole storyline in the wrong direction
4. I'll ask one quick clarifying question to lock the goal before drafting sections`

// The outline shown for review before slide generation begins —
// reuses the same section titles/bullets the Classic wizard's storyline uses.
export const OUTLINE_SECTIONS: OutlineSection[] = MOCK_STORYLINE.map(s => ({
  title: s.title,
  bullets: s.bullets.map(b => b.text),
}))

export const CLARIFY_QUESTION = "What's the primary goal for this deck?"
export const CLARIFY_OPTIONS = [
  'Pitch to investors',
  'Internal team update',
  'Customer-facing overview',
  'Conference talk',
]

// Total slides shown in the preview: 1 cover + N content sections
export const TOTAL_SLIDES = 1 + MOCK_DECK.sections.length

/**
 * Builds the full scripted timeline for a Studio generation session.
 * The clarify step blocks playback — the session hook stops scheduling
 * once it hits a 'clarify' step and resumes from the next index only
 * after answerClarify() is called.
 */
export function buildScript(): ScriptStep[] {
  const steps: ScriptStep[] = []

  // ── Intro ──────────────────────────────────────────────────────────────
  steps.push({
    kind: 'chat',
    delay: 350,
    item: {
      id: 'agent-intro',
      type: 'agent',
      text: "I'll build this deck for you. Let me lock the direction with one quick question, draft a storyline for you to review, then generate the slides.",
    },
  })

  // ── Understanding the brief — collapsible chain-of-thought group ────────
  steps.push({
    kind: 'chat', delay: 400,
    item: { id: 'group-analyze', type: 'group', label: 'Understanding your brief', children: [] },
  })
  steps.push({
    kind: 'group-push', delay: 400, groupId: 'group-analyze',
    item: { id: 'tool-analyze', type: 'tool', label: 'Analyzing request', detail: 'Parsing prompt intent and tone', status: 'running' },
  })
  steps.push({ kind: 'update', delay: 900, id: 'tool-analyze', patch: { status: 'done' } })
  steps.push({
    kind: 'group-push', delay: 400, groupId: 'group-analyze',
    item: { id: 'reasoning-1', type: 'reasoning', text: REASONING_INTENT },
  })

  // ── Clarifying question (blocks) ─────────────────────────────────────
  steps.push({
    kind: 'clarify',
    delay: 1400,
    id: 'clarify-goal',
    question: CLARIFY_QUESTION,
    options: CLARIFY_OPTIONS,
  })

  // ── Resumes here after answerClarify() ───────────────────────────────
  // ── Structuring the storyline — collapsible chain-of-thought group ──────
  steps.push({
    kind: 'chat', delay: 600,
    item: { id: 'group-storyline', type: 'group', label: 'Structuring the storyline', children: [] },
  })
  steps.push({
    kind: 'group-push', delay: 0, groupId: 'group-storyline',
    item: { id: 'tool-structure', type: 'tool', label: 'Structuring outline', detail: 'Drafting section flow and narrative arc', status: 'running' },
  })
  steps.push({ kind: 'update', delay: 1000, id: 'tool-structure', patch: { status: 'done' } })

  steps.push({
    kind: 'group-push', delay: 400, groupId: 'group-storyline',
    item: {
      id: 'checklist-1',
      type: 'checklist',
      title: 'Generating storyline',
      tasks: [
        { label: 'Write section outline', done: false },
        { label: 'Draft key talking points', done: false },
        { label: 'Choose per-section layouts', done: false },
      ],
    },
  })
  steps.push({
    kind: 'update', delay: 700, id: 'checklist-1',
    patch: { tasks: [
      { label: 'Write section outline', done: true },
      { label: 'Draft key talking points', done: false },
      { label: 'Choose per-section layouts', done: false },
    ] },
  })
  steps.push({
    kind: 'update', delay: 650, id: 'checklist-1',
    patch: { tasks: [
      { label: 'Write section outline', done: true },
      { label: 'Draft key talking points', done: true },
      { label: 'Choose per-section layouts', done: false },
    ] },
  })
  steps.push({
    kind: 'update', delay: 650, id: 'checklist-1',
    patch: { tasks: [
      { label: 'Write section outline', done: true },
      { label: 'Draft key talking points', done: true },
      { label: 'Choose per-section layouts', done: true },
    ] },
  })

  // ── Outline review (blocks) ──────────────────────────────────────────
  // Playback stops here until the user approves the outline via
  // approveOutline() — no slides are written before that happens.
  steps.push({
    kind: 'outline',
    delay: 500,
    id: 'outline-1',
    sections: OUTLINE_SECTIONS,
  })

  // ── Resumes here after approveOutline() ──────────────────────────────
  // ── Preview begins ────────────────────────────────────────────────────
  steps.push({ kind: 'preview', delay: 400, state: 'preparing' })
  steps.push({ kind: 'preview', delay: 600, state: 'thumbs' })

  // ── Writing the slides — collapsible chain-of-thought group ─────────────
  // Each "Writing slide N" chip stands in for a separate sub-agent/tool
  // call producing that slide — grouped under one trigger like a real
  // multi-agent trace instead of a flat list of chips.
  steps.push({
    kind: 'chat', delay: 0,
    item: { id: 'group-slides', type: 'group', label: 'Writing your slides', children: [] },
  })

  // Cover slide
  steps.push({
    kind: 'group-push', delay: 500, groupId: 'group-slides',
    item: { id: 'tool-slide-cover', type: 'tool', label: 'Writing slide 1', detail: 'Cover', status: 'running' },
  })
  steps.push({ kind: 'update', delay: 500, id: 'tool-slide-cover', patch: { status: 'done' } })
  steps.push({ kind: 'reveal-slide', delay: 200, index: 0 })

  // Content slides
  MOCK_DECK.sections.forEach((section, i) => {
    const toolId = `tool-slide-${i + 1}`
    steps.push({
      kind: 'group-push', delay: 500, groupId: 'group-slides',
      item: { id: toolId, type: 'tool', label: `Writing slide ${i + 2}`, detail: section.title, status: 'running' },
    })
    steps.push({ kind: 'update', delay: 500, id: toolId, patch: { status: 'done' } })
    steps.push({ kind: 'reveal-slide', delay: 200, index: i + 1 })
  })

  // ── Verify + wrap up ──────────────────────────────────────────────────
  steps.push({
    kind: 'group-push', delay: 500, groupId: 'group-slides',
    item: { id: 'verify-layout', type: 'verify', label: 'Check slide layout', detail: `Layout-check all ${TOTAL_SLIDES} slides`, status: 'running' },
  })
  steps.push({ kind: 'update', delay: 900, id: 'verify-layout', patch: { status: 'done' } })

  steps.push({
    kind: 'chat', delay: 500,
    item: {
      id: 'summary-1',
      type: 'summary',
      text: `Your deck is ready — ${TOTAL_SLIDES} slides built around your brief. You can edit any block directly, switch layouts and media, or ask me to refine a section below.`,
    },
  })
  steps.push({ kind: 'preview', delay: 300, state: 'done' })

  return steps
}
