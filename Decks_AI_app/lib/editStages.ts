import type { ChatItem } from './studioScript'

// Projection of the real /edit event stream (Decks_AI_Service
// pipeline.ts → runEdit) onto three workflow stages. The backend runs these
// strictly in sequence — Plan (Coordinator tier) → Edit (Editor tier, one
// checklist task per operation) → Review (Reviewer tier) — so the labels are
// deliberately stage names, not "three agents working in parallel".

export type EditStageId = 'plan' | 'edit' | 'review'
export type EditStageStatus = 'waiting' | 'running' | 'done' | 'skipped' | 'failed'
export type EditRunPhase = 'running' | 'done' | 'no-op' | 'failed'

export interface EditStage {
  id: EditStageId
  label: string
  status: EditStageStatus
  /** Short live status shown on the chip itself, e.g. "Running", "2/3". */
  short: string
  /** Current step, for the detail card. */
  step: string
  /** Latest concrete change/result, for the detail card. */
  latestChange: string | null
}

export interface EditRun {
  phase: EditRunPhase
  stages: [EditStage, EditStage, EditStage]
  /** 1-based index of the stage currently in focus (for "step 2 of 3"). */
  currentStep: number
}

export const STATUS_TEXT: Record<EditStageStatus, string> = {
  waiting: 'Waiting',
  running: 'Running',
  done: 'Done',
  skipped: 'Skipped',
  failed: 'Failed',
}

type Child<T extends ChatItem['type']> = Extract<ChatItem, { type: T }>

function find<T extends ChatItem['type']>(list: ChatItem[], type: T): Child<T> | undefined {
  return list.find((i): i is Child<T> => i.type === type)
}

function findLast<T extends ChatItem['type']>(list: ChatItem[], type: T): Child<T> | undefined {
  for (let i = list.length - 1; i >= 0; i--) {
    const it = list[i]
    if (it.type === type) return it as Child<T>
  }
  return undefined
}

/**
 * @param runItems chat items appended since the user submitted this edit
 *   (the user's own message onward).
 * @param isEditing the session's live in-flight flag.
 * @param failed the session's editFailed flag (hard error / network / early close).
 */
export function deriveEditRun(runItems: ChatItem[], isEditing: boolean, failed: boolean): EditRun {
  const group = find(runItems, 'group')
  const children = group?.children ?? []
  const planTool = find(children, 'tool')
  const reasoning = find(children, 'reasoning')
  const checklist = find(children, 'checklist')
  const verify = find(children, 'verify')
  const summary = find(runItems, 'summary')
  const report = findLast(runItems, 'verify-report')
  const lastAgent = findLast(runItems, 'agent')

  const ended = !isEditing
  const isFailed = ended && (failed || (!summary && !lastAgent))
  // Coordinator found nothing to change: plan done, no checklist, a
  // plain agent reply, and a clean `done` — a legitimate outcome, not a failure.
  const isNoOp = ended && !isFailed && !summary && planTool?.status === 'done' && !checklist

  // --- Plan ---
  const plan: EditStage = {
    id: 'plan',
    label: 'Plan',
    status: !planTool ? (ended ? 'waiting' : 'running') : planTool.status === 'running' ? 'running' : 'done',
    short: '',
    step: !planTool || planTool.status === 'running' ? 'Understanding your request' : 'Plan ready',
    latestChange: reasoning?.text ?? (planTool ? `Request: ${planTool.detail}` : null),
  }

  // --- Edit ---
  let edit: EditStage
  if (checklist) {
    const total = checklist.tasks.length
    const doneTasks = checklist.tasks.filter(t => t.done)
    const next = checklist.tasks.find(t => !t.done)
    const allDone = doneTasks.length === total
    edit = {
      id: 'edit',
      label: 'Edit',
      status: allDone ? 'done' : 'running',
      short: `${doneTasks.length}/${total}`,
      step: next ? next.label : `Applied ${total} change${total === 1 ? '' : 's'}`,
      latestChange: doneTasks.length ? doneTasks[doneTasks.length - 1].label : null,
    }
  } else {
    edit = {
      id: 'edit',
      label: 'Edit',
      status: isNoOp ? 'skipped' : 'waiting',
      short: '',
      step: isNoOp ? 'No changes needed' : 'Waiting for the plan',
      latestChange: isNoOp ? lastAgent?.text ?? null : null,
    }
  }

  // --- Review ---
  let review: EditStage
  if (verify) {
    const flagCount = report?.flags.length ?? 0
    review = {
      id: 'review',
      label: 'Review',
      status: verify.status === 'running' ? 'running' : 'done',
      short: '',
      step: verify.status === 'running' ? verify.label : 'Review complete',
      latestChange:
        verify.status === 'running'
          ? verify.detail
          : flagCount
            ? `${flagCount} issue${flagCount === 1 ? '' : 's'} flagged`
            : 'No issues found',
    }
  } else {
    review = {
      id: 'review',
      label: 'Review',
      status: isNoOp ? 'skipped' : 'waiting',
      short: '',
      step: isNoOp ? 'Nothing to review' : 'Waiting for edits',
      latestChange: null,
    }
  }

  const stages: [EditStage, EditStage, EditStage] = [plan, edit, review]

  // A failed run marks the first unfinished stage as failed; later stages
  // stay "waiting" — they never started, and claiming otherwise would lie.
  if (isFailed) {
    const idx = stages.findIndex(s => s.status === 'running' || s.status === 'waiting')
    if (idx !== -1) {
      stages[idx] = { ...stages[idx], status: 'failed', step: `Stopped during ${stages[idx].label.toLowerCase()}` }
      for (let i = idx + 1; i < stages.length; i++) stages[i] = { ...stages[i], status: 'waiting' }
    }
  }

  for (const s of stages) if (!s.short) s.short = STATUS_TEXT[s.status]

  const phase: EditRunPhase = isFailed ? 'failed' : isNoOp ? 'no-op' : ended && summary ? 'done' : 'running'

  const activeIdx = stages.findIndex(s => s.status === 'running' || s.status === 'failed')
  const currentStep = activeIdx !== -1 ? activeIdx + 1 : stages.length

  return { phase, stages, currentStep }
}

/**
 * One human sentence for a meaningful change between two runs, or null when
 * nothing worth announcing changed (e.g. a single checklist tick). Drives the
 * polite live region — never called per animation frame.
 */
export function describeTransition(prev: EditRun | null, next: EditRun): string | null {
  if (prev?.phase !== next.phase) {
    if (next.phase === 'done') {
      const reviewNote = next.stages[2].latestChange
      return `Edit complete.${reviewNote ? ` ${reviewNote}.` : ''}`
    }
    if (next.phase === 'failed') {
      const failedStage = next.stages.find(s => s.status === 'failed')
      return `Edit failed${failedStage ? ` during ${failedStage.label.toLowerCase()}` : ''}.`
    }
    if (next.phase === 'no-op') return 'No changes were needed.'
  }
  const changed = next.stages.filter((s, i) => prev?.stages[i].status !== s.status)
  const started = changed.find(s => s.status === 'running')
  if (started) return `${started.label} started.`
  const finished = changed.find(s => s.status === 'done')
  if (finished && next.phase === 'running') return `${finished.label} done.`
  return null
}
