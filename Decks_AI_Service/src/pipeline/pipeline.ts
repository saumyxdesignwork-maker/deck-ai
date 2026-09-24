import { newId } from '../lib/ids.js'
import { config } from '../config/env.js'
import { analyzeBrief } from '../tiers/orchestrator.js'
import { draftStoryline, expandDeck } from '../tiers/copywriter.js'
import { applyTheme, generateAndAssignImages } from '../tiers/designer.js'
import { planEdit, COVER_TITLE_BLOCK_ID, COVER_SUBTITLE_BLOCK_ID, type Op } from '../tiers/planner.js'
import { rewriteText } from '../tiers/rewriter.js'
import { verifyDeck } from '../tiers/verifier.js'
import { applyAddBlock, applyDeleteBlock, applyReorderSection, applySetLayout, opTargetExists } from '../tiers/deckOps.js'
import type { SessionState } from '../session/store.js'
import type { StreamEvent } from './events.js'
import type { DeckData } from '../contract/deck.js'
import type { ChecklistTask } from '../contract/chat.js'

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
      text: "I'll build this deck for you. Let me lock the direction with a couple of quick questions, draft a storyline for you to review, then generate the slides.",
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

  await emit({ t: 'clarify', id: 'clarify-goal', questions: result.clarifyQuestions })
  // Stream ends here — the client resumes via POST /clarify.
}

/**
 * Phase 2 — POST /clarify. Drafts the storyline and streams up to the
 * outline gate.
 */
export async function runClarify(state: SessionState, answers: string[], emit: Emit): Promise<void> {
  state.clarifyAnswers = answers

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

function opLabel(op: Op): string {
  switch (op.kind) {
    case 'rewrite':
      return `Rewrite: ${op.instruction}`
    case 'add-block':
      return `Add a ${op.blockType.replace('-', ' ')} block`
    case 'delete-block':
      return 'Remove a block'
    case 'reorder-section':
      return `Move slide to position ${op.toIndex + 1}`
    case 'set-layout':
      return `Switch layout to ${op.layout.replace('-', ' ')}`
  }
}

/**
 * POST /edit (alias: /followup) — post-generation, canvas-first editing via
 * the client's *current* deck (fixes the staleness of state.deck, which is
 * otherwise only ever written once, inside runApprove). Coordinator (plan) →
 * Editor (execute) → Reviewer (verify) — each a real tier call; the client
 * renders their progress as the same chip/checklist chat items used during
 * first-draft generation. Ends with a single `deck` event so the whole edit
 * lands as one atomic, undoable mutation on the client.
 */
export async function runEdit(state: SessionState, instruction: string, deck: DeckData, activeSectionId: string | undefined, emit: Emit): Promise<void> {
  const groupId = newId('group')
  await emit({ t: 'chat', item: { id: groupId, type: 'group', label: 'Working on your deck', children: [] } })

  // 1. Coordinator — turn the instruction into a small plan of operations.
  const planToolId = newId('tool')
  await emit({ t: 'group-push', groupId, item: { id: planToolId, type: 'tool', label: 'Understanding your request', detail: instruction, status: 'running' } })

  const { plan, usedFallback: plannerFallback } = await planEdit(instruction, deck, activeSectionId)

  await emit({ t: 'update', id: planToolId, patch: { status: 'done' } })
  await emit({ t: 'group-push', groupId, item: { id: newId('reasoning'), type: 'reasoning', text: plan.summary } })
  if (plannerFallback) {
    await emit({ t: 'error', message: 'The planning model was unavailable — using a fallback response.', code: 'PLANNER_FALLBACK' })
  }

  const operations = plan.operations.filter(op => opTargetExists(deck, op))

  if (operations.length === 0) {
    await emit({
      t: 'chat',
      item: { id: newId('agent'), type: 'agent', text: plannerFallback ? plan.summary : "I couldn't find a change to make for that — try describing a specific edit, like a slide or piece of text to change." },
    })
    await emit({ t: 'done' })
    return
  }

  // 2. Editor — apply each operation to a working copy, one checklist task
  // per op so progress is visible as it lands.
  const checklistId = newId('checklist')
  let tasks: ChecklistTask[] = operations.map(op => ({ label: opLabel(op), done: false }))
  await emit({ t: 'group-push', groupId, item: { id: checklistId, type: 'checklist', title: 'Applying changes', tasks } })

  let workingDeck = deck
  let anyRewriteFallback = false

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    switch (op.kind) {
      case 'rewrite': {
        // The cover's title/subtitle live on the deck itself, not in
        // `sections` — addressed via fixed pseudo-ids (see planner.ts) since
        // they're otherwise invisible to the planner's block-based model.
        if (op.blockId === COVER_TITLE_BLOCK_ID || op.blockId === COVER_SUBTITLE_BLOCK_ID) {
          const current = op.blockId === COVER_TITLE_BLOCK_ID ? workingDeck.title : workingDeck.subtitle
          const { text, usedFallback } = await rewriteText(current, op.instruction)
          if (usedFallback) anyRewriteFallback = true
          workingDeck = op.blockId === COVER_TITLE_BLOCK_ID ? { ...workingDeck, title: text } : { ...workingDeck, subtitle: text }
          break
        }
        const block = workingDeck.sections.flatMap(s => s.blocks).find(b => b.id === op.blockId)
        const sectionTitle = workingDeck.sections.find(s => s.id === op.sectionId)?.title
        if (block) {
          const { text, usedFallback } = await rewriteText(block.content, op.instruction, sectionTitle)
          if (usedFallback) anyRewriteFallback = true
          workingDeck = {
            ...workingDeck,
            sections: workingDeck.sections.map(s => ({ ...s, blocks: s.blocks.map(b => (b.id === op.blockId ? { ...b, content: text } : b)) })),
          }
        }
        break
      }
      case 'add-block':
        workingDeck = applyAddBlock(workingDeck, op)
        break
      case 'delete-block':
        workingDeck = applyDeleteBlock(workingDeck, op)
        break
      case 'reorder-section':
        workingDeck = applyReorderSection(workingDeck, op)
        break
      case 'set-layout':
        workingDeck = applySetLayout(workingDeck, op)
        break
    }
    tasks = tasks.map((t, idx) => (idx === i ? { ...t, done: true } : t))
    await emit({ t: 'update', id: checklistId, patch: { tasks } })
  }

  if (anyRewriteFallback) {
    await emit({ t: 'error', message: 'One of the rewrite steps fell back to a degraded model response.', code: 'REWRITE_FALLBACK' })
  }

  // 3. Reviewer — re-run the same content-quality pass used post-generation.
  const verifyId = newId('verify')
  await emit({ t: 'group-push', groupId, item: { id: verifyId, type: 'verify', label: 'Reviewing the result', detail: 'Checking for inconsistencies introduced by the edit', status: 'running' } })
  const { flags, usedFallback: verifyFallback } = await verifyDeck(workingDeck)
  await emit({ t: 'update', id: verifyId, patch: { status: 'done' } })
  if (verifyFallback) {
    await emit({ t: 'error', message: 'The review model was unavailable — skipped content review.', code: 'VERIFIER_FALLBACK' })
  }
  if (flags.length > 0) {
    const withTitles = flags.map(f => ({ ...f, sectionTitle: workingDeck.sections.find(s => s.id === f.sectionId)?.title ?? 'Untitled section' }))
    await emit({ t: 'chat', item: { id: newId('verify-report'), type: 'verify-report', flags: withTitles } })
  }

  state.deck = workingDeck
  await emit({ t: 'deck', deck: workingDeck })
  await emit({
    t: 'chat',
    item: { id: newId('summary'), type: 'summary', text: plan.summary },
  })
  await emit({ t: 'done' })
}
