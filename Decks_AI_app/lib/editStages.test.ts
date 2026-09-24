import { describe, expect, it } from 'vitest'
import type { ChatItem } from './studioScript'
import { deriveEditRun, describeTransition } from './editStages'

// Event sequences mirror Decks_AI_Service/src/pipeline/pipeline.ts runEdit.
const user: ChatItem = { id: 'u1', type: 'user', text: 'Tighten slide 2' }

function group(children: ChatItem[]): ChatItem {
  return { id: 'g1', type: 'group', label: 'Working on your deck', children }
}
const planRunning: ChatItem = { id: 't1', type: 'tool', label: 'Understanding your request', detail: 'Tighten slide 2', status: 'running' }
const planDone: ChatItem = { ...planRunning, status: 'done' } as ChatItem
const reasoning: ChatItem = { id: 'r1', type: 'reasoning', text: 'Shorten the two bullets on Market Size.' }
const checklist = (done: boolean[]): ChatItem => ({
  id: 'c1', type: 'checklist', title: 'Applying changes',
  tasks: [
    { label: 'Rewrite a block', done: done[0] },
    { label: 'Remove a block', done: done[1] },
  ],
})
const verifyRunning: ChatItem = { id: 'v1', type: 'verify', label: 'Reviewing the result', detail: 'Checking for inconsistencies introduced by the edit', status: 'running' }
const verifyDone: ChatItem = { ...verifyRunning, status: 'done' } as ChatItem
const summary: ChatItem = { id: 's1', type: 'summary', text: 'Shortened the bullets.' }

describe('deriveEditRun', () => {
  it('shows Plan running immediately after submission, before any backend event', () => {
    const run = deriveEditRun([user], true, false)
    expect(run.phase).toBe('running')
    expect(run.stages.map(s => s.status)).toEqual(['running', 'waiting', 'waiting'])
    expect(run.currentStep).toBe(1)
  })

  it('tracks the real happy path Plan → Edit → Review', () => {
    let run = deriveEditRun([user, group([planRunning])], true, false)
    expect(run.stages[0]).toMatchObject({ status: 'running', step: 'Understanding your request' })

    run = deriveEditRun([user, group([planDone, reasoning, checklist([true, false])])], true, false)
    expect(run.stages[0]).toMatchObject({ status: 'done', latestChange: 'Shorten the two bullets on Market Size.' })
    expect(run.stages[1]).toMatchObject({ status: 'running', short: '1/2', step: 'Remove a block', latestChange: 'Rewrite a block' })
    expect(run.currentStep).toBe(2)

    run = deriveEditRun([user, group([planDone, reasoning, checklist([true, true]), verifyRunning])], true, false)
    expect(run.stages[1]).toMatchObject({ status: 'done', short: '2/2' })
    expect(run.stages[2]).toMatchObject({ status: 'running' })

    run = deriveEditRun([user, group([planDone, reasoning, checklist([true, true]), verifyDone]), summary], false, false)
    expect(run.phase).toBe('done')
    expect(run.stages.map(s => s.status)).toEqual(['done', 'done', 'done'])
    expect(run.stages[2].latestChange).toBe('No issues found')
  })

  it('reports reviewer flags as the latest change', () => {
    const report: ChatItem = {
      id: 'vr', type: 'verify-report',
      flags: [{ sectionId: 'x', sectionTitle: 'X', issue: 'Stat unsourced', severity: 'warning' }],
    }
    const run = deriveEditRun([user, group([planDone, checklist([true, true]), verifyDone]), report, summary], false, false)
    expect(run.stages[2].latestChange).toBe('1 issue flagged')
  })

  it('marks Edit and Review as skipped when the Coordinator finds nothing to change', () => {
    const agent: ChatItem = { id: 'a1', type: 'agent', text: "I couldn't find a change to make for that" }
    const run = deriveEditRun([user, group([planDone, reasoning]), agent], false, false)
    expect(run.phase).toBe('no-op')
    expect(run.stages.map(s => s.status)).toEqual(['done', 'skipped', 'skipped'])
    expect(run.stages[1].latestChange).toContain("couldn't find a change")
  })

  it('fails the stage that was in flight on a hard error, leaving later stages waiting', () => {
    const agent: ChatItem = { id: 'a1', type: 'agent', text: 'Something went wrong on my end.' }
    const run = deriveEditRun([user, group([planDone, checklist([true, false])]), agent], false, true)
    expect(run.phase).toBe('failed')
    expect(run.stages.map(s => s.status)).toEqual(['done', 'failed', 'waiting'])
  })

  it('fails Plan on a network failure before any backend event', () => {
    const agent: ChatItem = { id: 'a1', type: 'agent', text: "I couldn't reach the deck-generation service." }
    const run = deriveEditRun([user, agent], false, true)
    expect(run.phase).toBe('failed')
    expect(run.stages.map(s => s.status)).toEqual(['failed', 'waiting', 'waiting'])
  })

  it('never uses color-only status — every stage has a text status', () => {
    const run = deriveEditRun([user, group([planDone, checklist([false, false])])], true, false)
    for (const s of run.stages) expect(s.short.length).toBeGreaterThan(0)
  })
})

describe('describeTransition', () => {
  it('announces stage starts and completion, not individual checklist ticks', () => {
    const a = deriveEditRun([user, group([planDone, checklist([false, false])])], true, false)
    const b = deriveEditRun([user, group([planDone, checklist([true, false])])], true, false)
    expect(describeTransition(null, a)).toBe('Edit started.')
    expect(describeTransition(a, b)).toBeNull()

    const done = deriveEditRun([user, group([planDone, checklist([true, true]), verifyDone]), summary], false, false)
    expect(describeTransition(b, done)).toBe('Edit complete. No issues found.')
  })

  it('announces failure with the failing stage', () => {
    const prev = deriveEditRun([user], true, false)
    const failed = deriveEditRun([user, { id: 'a', type: 'agent', text: 'x' }], false, true)
    expect(describeTransition(prev, failed)).toBe('Edit failed during plan.')
  })
})
