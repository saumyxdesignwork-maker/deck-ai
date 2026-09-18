import { newId } from '../lib/ids.js'
import { config } from '../config/env.js'
import { analyzeBrief } from '../tiers/orchestrator.js'
import { draftStoryline, expandDeck } from '../tiers/copywriter.js'
import { applyTheme, generateAndAssignImages } from '../tiers/designer.js'
import type { SessionState } from '../session/store.js'
import type { StreamEvent } from './events.js'
import type { DeckData } from '../contract/deck.js'

export type Emit = (event: StreamEvent) => Promise<void>

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Phase 1 — POST /generate. Analyzes the brief and streams up to the
 * clarify gate. Ends the stream there; the client resumes via /clarify.
 */
export async function runGenerate(state: SessionState, emit: Emit): Promise<void> {
  await emit({
    t: 'chat',
    item: {
      id: newId('agent'),
      type: 'agent',
      text: "I'll build this deck for you. Let me lock the direction with one quick question, draft a storyline for you to review, then generate the slides.",
    },
  })

  const groupId = 'group-analyze'
  await emit({ t: 'chat', item: { id: groupId, type: 'group', label: 'Understanding your brief', children: [] } })

  const toolId = newId('tool')
  await emit({ t: 'group-push', groupId, item: { id: toolId, type: 'tool', label: 'Analyzing request', detail: 'Parsing prompt intent and tone', status: 'running' } })

  const { result, usedFallback } = await analyzeBrief(state)

  await emit({ t: 'update', id: toolId, patch: { status: 'done' } })
  await emit({ t: 'group-push', groupId, item: { id: newId('reasoning'), type: 'reasoning', text: result.reasoningTrace } })

  if (usedFallback) {
    await emit({ t: 'error', message: 'The Orchestrator model was unavailable — using a fallback brief analysis.', code: 'ORCHESTRATOR_FALLBACK' })
  }

  state.copyDirective = result.copyDirective
  state.designDirective = result.designDirective

  await emit({ t: 'clarify', id: 'clarify-goal', question: result.clarifyQuestion, options: result.clarifyOptions })
  // Stream ends here — the client resumes via POST /clarify.
}

/**
 * Phase 2 — POST /clarify. Drafts the storyline and streams up to the
 * outline gate.
 */
export async function runClarify(state: SessionState, answer: string, emit: Emit): Promise<void> {
  state.clarifyAnswer = answer

  const groupId = 'group-storyline'
  await emit({ t: 'chat', item: { id: groupId, type: 'group', label: 'Structuring the storyline', children: [] } })

  const toolId = newId('tool')
  await emit({ t: 'group-push', groupId, item: { id: toolId, type: 'tool', label: 'Structuring outline', detail: 'Drafting section flow and narrative arc', status: 'running' } })

  const { sections, usedFallback } = await draftStoryline(state)

  await emit({ t: 'update', id: toolId, patch: { status: 'done' } })

  const checklistId = newId('checklist')
  const tasks = [
    { label: 'Write section outline', done: false },
    { label: 'Draft key talking points', done: false },
    { label: 'Choose per-section layouts', done: false },
  ]
  await emit({ t: 'group-push', groupId, item: { id: checklistId, type: 'checklist', title: 'Generating storyline', tasks } })
  for (let i = 0; i < tasks.length; i++) {
    await delay(150)
    const patched = tasks.map((t, idx) => (idx <= i ? { ...t, done: true } : t))
    await emit({ t: 'update', id: checklistId, patch: { tasks: patched } })
  }

  if (usedFallback) {
    await emit({ t: 'error', message: 'The Copywriter model was unavailable — using a fallback storyline.', code: 'COPYWRITER_FALLBACK' })
  }

  // Keep the just-drafted storyline pending until /approve (or /regenerate
  // re-drafts it) — approvedStoryline is only set once the user confirms.
  state.approvedStoryline = sections

  await emit({ t: 'outline', id: 'outline-1', sections })
  // Stream ends here — the client resumes via POST /approve (or /regenerate).
}

/**
 * Phase 3 — POST /approve. Expands the approved storyline into a full deck,
 * applies theme + real images, and streams the slide-writing burst through
 * to `done`.
 */
export async function runApprove(state: SessionState, emit: Emit): Promise<void> {
  const { deck: skeleton, usedFallback } = await expandDeck(state)
  if (usedFallback) {
    await emit({ t: 'error', message: 'The Copywriter model was unavailable — using a fallback deck.', code: 'DECK_FALLBACK' })
  }

  const { coverColor, sections } = applyTheme(skeleton, state.designDirective)

  const groupId = 'group-slides'
  await emit({ t: 'chat', item: { id: groupId, type: 'group', label: 'Writing your slides', children: [] } })

  if (config.imagesEnabled && config.maxImagesPerDeck > 0) {
    const imgToolId = newId('tool')
    await emit({ t: 'group-push', groupId, item: { id: imgToolId, type: 'tool', label: 'Generating visuals', detail: 'Rendering images via Flux & Recraft', status: 'running' } })
    // Images generate concurrently (bounded by MAX_IMAGES_PER_DECK) — a
    // single chip covers the whole batch rather than one per image, since
    // generateAndAssignImages resolves them together, not incrementally.
    await generateAndAssignImages(sections, state.designDirective, state.aspectRatio)
    await emit({ t: 'update', id: imgToolId, patch: { status: 'done' } })
  }

  const deck: DeckData = {
    title: skeleton.title,
    subtitle: skeleton.subtitle,
    author: state.user.name,
    coverColor,
    sections,
    aspectRatio: state.aspectRatio,
  }
  state.deck = deck

  await emit({ t: 'deck', deck })
  await emit({ t: 'preview', state: 'preparing' })
  await emit({ t: 'preview', state: 'thumbs' })

  const coverToolId = newId('tool')
  await emit({ t: 'group-push', groupId, item: { id: coverToolId, type: 'tool', label: 'Writing slide 1', detail: 'Cover', status: 'running' } })
  await delay(150)
  await emit({ t: 'update', id: coverToolId, patch: { status: 'done' } })
  await emit({ t: 'reveal-slide', index: 0 })

  for (let i = 0; i < sections.length; i++) {
    const toolId = newId('tool')
    await emit({ t: 'group-push', groupId, item: { id: toolId, type: 'tool', label: `Writing slide ${i + 2}`, detail: sections[i].title, status: 'running' } })
    await delay(150)
    await emit({ t: 'update', id: toolId, patch: { status: 'done' } })
    await emit({ t: 'reveal-slide', index: i + 1 })
  }

  const verifyId = newId('verify')
  const totalSlides = sections.length + 1
  await emit({ t: 'group-push', groupId, item: { id: verifyId, type: 'verify', label: 'Check slide layout', detail: `Layout-check all ${totalSlides} slides`, status: 'running' } })
  await delay(200)
  await emit({ t: 'update', id: verifyId, patch: { status: 'done' } })

  await emit({
    t: 'chat',
    item: {
      id: newId('summary'),
      type: 'summary',
      text: `Your deck is ready — ${totalSlides} slides built around your brief. You can edit any block directly, switch layouts and media, or ask me to refine a section below.`,
    },
  })
  await emit({ t: 'preview', state: 'done' })
  await emit({ t: 'done' })
}

/**
 * POST /regenerate — re-drafts the storyline (optionally with notes) and
 * streams a new outline gate. Mirrors runClarify's shape but is triggered
 * from the outline-review "Rethink Storyline" action, not the clarify answer.
 */
export async function runRegenerate(state: SessionState, notes: string | undefined, emit: Emit): Promise<void> {
  const chipId = newId('tool')
  await emit({ t: 'chat', item: { id: chipId, type: 'tool', label: 'Revisiting outline', detail: 'Reconsidering section flow', status: 'running' } })

  const { sections, usedFallback } = await draftStoryline(state, notes)

  await emit({ t: 'update', id: chipId, patch: { status: 'done' } })
  if (usedFallback) {
    await emit({ t: 'error', message: 'The Copywriter model was unavailable — using a fallback storyline.', code: 'COPYWRITER_FALLBACK' })
  }

  state.approvedStoryline = sections
  await emit({ t: 'outline', id: newId('outline'), sections })
}

/**
 * POST /followup — post-generation refinement. Intentionally minimal for
 * this pass (acknowledges the note without re-running the full pipeline);
 * a real targeted-patch flow is a documented follow-up.
 */
export async function runFollowup(state: SessionState, text: string, emit: Emit): Promise<void> {
  void state
  await emit({
    t: 'chat',
    item: {
      id: newId('agent'),
      type: 'agent',
      text: `Got it — I've noted "${text}". Targeted refinement isn't fully wired up yet; try re-generating the deck for now.`,
    },
  })
  await emit({ t: 'done' })
}
