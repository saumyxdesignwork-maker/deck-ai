import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { MotionGlobalConfig } from 'motion/react'
import { PreviewPane } from './PreviewPane'
import { MOCK_DECK } from '@/lib/fixtures'
import type { ChatItem } from '@/lib/studioScript'
import type { PreviewState } from '@/lib/useStudioSession'
import { ASK_AI_HINT_SEEN_KEY } from './PreviewToolbar'

// --- Harness: real PreviewPane, with a scriptable stand-in for the session
// hook's /edit stream (the same ChatItem shapes pipeline.ts emits). ---

interface Controls {
  setItems: (fn: (prev: ChatItem[]) => ChatItem[]) => void
  setIsEditing: (v: boolean) => void
  setEditFailed: (v: boolean) => void
}
// Filled from an effect (not during render) so the harness stays pure.
const controlsRef: { current: Controls } = { current: null as unknown as Controls }
const controls = {
  setItems: (fn: (prev: ChatItem[]) => ChatItem[]) => controlsRef.current.setItems(fn),
  setIsEditing: (v: boolean) => controlsRef.current.setIsEditing(v),
  setEditFailed: (v: boolean) => controlsRef.current.setEditFailed(v),
}
const onRunEdit = vi.fn()

function Harness({ previewState = 'done' as PreviewState }) {
  const [items, setItems] = useState<ChatItem[]>([{ id: 'u0', type: 'user', text: 'Make a deck' }])
  const [isEditing, setIsEditing] = useState(false)
  const [editFailed, setEditFailed] = useState(false)
  useEffect(() => {
    controlsRef.current = { setItems, setIsEditing, setEditFailed }
  }, [])
  const noop = () => {}
  return (
    <PreviewPane
      previewState={previewState}
      revealedSlides={[0, 1, 2]}
      deck={MOCK_DECK}
      isWorking={false}
      outlinePending={null}
      onApproveOutline={noop}
      onRegenerateOutline={noop}
      verifyFlags={[]}
      isVerifying={false}
      onVerify={noop}
      isRewriting={false}
      onRewriteBlock={async () => null}
      canUndo={false}
      canRedo={false}
      onUndo={noop}
      onRedo={noop}
      onInsertBlock={noop}
      onInsertSection={noop}
      onDeleteBlocks={noop}
      onDuplicateBlocks={noop}
      onApplyRewrite={noop}
      onBeginBlockEdit={noop}
      onUpdateBlockContent={noop}
      onCommitBlockEdit={noop}
      onSetSectionLayout={noop}
      items={items}
      isEditing={isEditing}
      editFailed={editFailed}
      editGroupId={null}
      onRunEdit={(text: string, sectionId?: string) => {
        onRunEdit(text, sectionId)
        // Mirrors useStudioSession.runEdit: append the user message, flag in-flight.
        setItems(prev => [...prev, { id: `u-${prev.length}`, type: 'user', text }])
        setIsEditing(true)
        setEditFailed(false)
      }}
    />
  )
}

let clock = 1000
function setPlatform(value: string) {
  Object.defineProperty(navigator, 'platform', { value, configurable: true })
}
function key(type: 'keydown' | 'keyup', k: string, init: KeyboardEventInit = {}) {
  act(() => {
    ;(document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, ...init }))
  })
}
function doubleCmd() {
  for (let i = 0; i < 2; i++) {
    key('keydown', 'Meta', { metaKey: true })
    clock += 40
    key('keyup', 'Meta')
    clock += 100
  }
  clock += 500
}
const dialog = () => screen.queryByRole('dialog', { name: 'Ask AI' })
const prompt = () => screen.getByRole('textbox', { name: 'Describe a change to the deck' })

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}

// jsdom has no layout, so Motion's shared-layout exits never settle there.
// Skip animations for behavior tests; motion itself is covered in
// PreviewPane.motion.test.tsx.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true
})

beforeEach(() => {
  clock = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  setPlatform('MacIntel')
  setReducedMotion(false)
  onRunEdit.mockClear()
})
afterEach(() => {
  vi.restoreAllMocks()
})

async function submit(text: string) {
  const user = userEvent.setup()
  doubleCmd()
  await user.type(prompt(), text)
  await user.keyboard('{Enter}')
}

describe('Ask AI surface', () => {
  it('⌘⌘ opens the chat, focuses the prompt, and ⌘⌘ from the prompt closes it restoring focus', async () => {
    render(<Harness />)
    const askButton = screen.getByRole('button', { name: /Ask AI/ })
    askButton.focus()
    expect(dialog()).toBeNull()

    doubleCmd()
    expect(dialog()).toBeInTheDocument()
    expect(prompt()).toHaveFocus()

    doubleCmd()
    await waitFor(() => expect(dialog()).toBeNull())
    expect(askButton).toHaveFocus()
  })

  it('does not respond to ⌘⌘ before the deck is ready (brief intake)', () => {
    render(<Harness previewState="thumbs" />)
    doubleCmd()
    expect(dialog()).toBeNull()
  })

  it('Escape closes without discarding an unsent draft', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    doubleCmd()
    await user.type(prompt(), 'Make slide 2 punchier')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(dialog()).toBeNull())

    doubleCmd()
    expect(prompt()).toHaveValue('Make slide 2 punchier')
  })

  it('Escape during IME composition does not close the chat', () => {
    render(<Harness />)
    doubleCmd()
    key('keydown', 'Escape', { isComposing: true })
    expect(dialog()).toBeInTheDocument()
  })

  it('sending collapses to a compact prompt that reopens the conversation', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await submit('Tighten slide 2')
    expect(onRunEdit.mock.calls[0][0]).toBe('Tighten slide 2')

    await waitFor(() => expect(dialog()).toBeNull())
    const compact = screen.getByRole('button', { name: /Reopen Ask AI/ })
    expect(compact).toHaveFocus()
    // Canvas still rendered underneath.
    expect(screen.getAllByText(MOCK_DECK.sections[0].title).length).toBeGreaterThan(0)

    await user.click(compact)
    expect(dialog()).toBeInTheDocument()
    expect(prompt()).toHaveFocus()
    expect(within(dialog()!).getByText('Tighten slide 2')).toBeInTheDocument()
  })

  it('⌘⌘ and Escape close the compact prompt; a draft typed during the run survives', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await submit('Tighten slide 2')
    const compact = () => screen.queryByRole('button', { name: /Reopen Ask AI/ })

    // ⌘⌘ from compact closes it (chips remain as the status surface).
    expect(compact()).toHaveFocus()
    doubleCmd()
    await waitFor(() => expect(compact()).toBeNull())
    expect(screen.getByTestId('edit-stage-chips')).toBeInTheDocument()

    // Reopen mid-run: the run is shown and a next draft can be typed, but
    // Send stays disabled so Enter keeps it.
    doubleCmd()
    await user.type(prompt(), 'next idea')
    await user.keyboard('{Enter}')
    expect(prompt()).toHaveValue('next idea')
    expect(screen.getByRole('button', { name: /Send \(available when/ })).toBeDisabled()

    doubleCmd()
    await waitFor(() => expect(dialog()).toBeNull())
    doubleCmd()
    expect(prompt()).toHaveValue('next idea')

    // Finish the run, send the draft → compact again; Escape closes compact.
    act(() => {
      controls.setItems(prev => [...prev, { id: 's-x', type: 'summary', text: 'Done.' }])
      controls.setIsEditing(false)
    })
    await user.keyboard('{Enter}')
    expect(onRunEdit).toHaveBeenLastCalledWith('next idea', expect.anything())
    await waitFor(() => expect(compact()).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(compact()).toBeNull())
  })

  it('drives the three stage chips from real /edit events and announces transitions once', async () => {
    render(<Harness />)
    await submit('Tighten slide 2')

    const chips = await screen.findByTestId('edit-stage-chips')
    const chip = (n: number) => within(chips).getAllByRole('button').filter(b => b.hasAttribute('data-status'))[n]
    expect(chip(0)).toHaveAttribute('data-status', 'running')
    expect(chip(0)).toHaveAccessibleName(/Step 1 of 3, Plan: Running/)
    const status = within(chips).getByRole('status')
    await waitFor(() => expect(status).toHaveTextContent('Plan started.'))

    const plan: ChatItem = { id: 't1', type: 'tool', label: 'Understanding your request', detail: 'Tighten slide 2', status: 'done' }
    act(() => controls.setItems(prev => [...prev, {
      id: 'g1', type: 'group', label: 'Working on your deck',
      children: [plan, { id: 'c1', type: 'checklist', title: 'Applying changes', tasks: [{ label: 'Rewrite a block', done: false }, { label: 'Remove a block', done: false }] }],
    }]))
    expect(chip(0)).toHaveAttribute('data-status', 'done')
    expect(chip(1)).toHaveAttribute('data-status', 'running')
    expect(chip(1)).toHaveTextContent('0/2')
    await waitFor(() => expect(status).toHaveTextContent('Edit started.'))

    // A checklist tick updates the chip but is not re-announced.
    act(() => controls.setItems(prev => prev.map(it => it.id === 'g1' && it.type === 'group'
      ? { ...it, children: it.children.map(c => c.type === 'checklist' ? { ...c, tasks: c.tasks.map((t, i) => ({ ...t, done: i === 0 })) } : c) }
      : it)))
    expect(chip(1)).toHaveTextContent('1/2')
    expect(status).toHaveTextContent('Edit started.')

    act(() => {
      controls.setItems(prev => [
        ...prev.map(it => it.id === 'g1' && it.type === 'group'
          ? { ...it, children: [...it.children.map(c => c.type === 'checklist' ? { ...c, tasks: c.tasks.map(t => ({ ...t, done: true })) } : c),
              { id: 'v1', type: 'verify', label: 'Reviewing the result', detail: '…', status: 'done' } as ChatItem] }
          : it),
        { id: 's1', type: 'summary', text: 'Done.' },
      ])
      controls.setIsEditing(false)
    })
    expect(chip(2)).toHaveAttribute('data-status', 'done')
    await waitFor(() => expect(status).toHaveTextContent('Edit complete. No issues found.'))
    expect(screen.getByRole('button', { name: /Reopen Ask AI — Edit complete/ })).toBeInTheDocument()
  })

  it('shows an honest Failed chip when the stream dies before any backend event', async () => {
    render(<Harness />)
    await submit('Tighten slide 2')
    act(() => {
      controls.setItems(prev => [...prev, { id: 'a1', type: 'agent', text: "I couldn't reach the deck-generation service." }])
      controls.setIsEditing(false)
      controls.setEditFailed(true)
    })
    const chips = screen.getByTestId('edit-stage-chips')
    const planChip = within(chips).getAllByRole('button').find(b => b.getAttribute('data-status'))!
    expect(planChip).toHaveAttribute('data-status', 'failed')
    expect(planChip).toHaveTextContent('Failed')
  })

  it('chip details open on keyboard focus and on tap; Escape closes the card before the chat', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await submit('Tighten slide 2')
    const chips = screen.getByTestId('edit-stage-chips')
    const planChip = within(chips).getAllByRole('button').find(b => b.getAttribute('data-status'))!

    // Keyboard: Tab onto the chip opens the detail card.
    screen.getByRole('button', { name: /Reopen Ask AI/ }).focus()
    for (let i = 0; i < 10 && document.activeElement !== planChip; i++) await user.tab()
    expect(planChip).toHaveFocus()
    expect(await screen.findByText('Current step')).toBeInTheDocument()
    expect(screen.getByText('Latest change')).toBeInTheDocument()

    // Escape closes the card; the compact prompt stays.
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('Current step')).toBeNull())
    expect(screen.getByRole('button', { name: /Reopen Ask AI/ })).toBeInTheDocument()

    // Touch: a tap (click without hover) toggles the card open.
    fireEvent.pointerDown(planChip, { pointerType: 'touch' })
    fireEvent.click(planChip)
    expect(await screen.findByText('Current step')).toBeInTheDocument()
  })
})

describe('shortcut signifier', () => {
  it('shows ⌘⌘ and a dismissible first-use tip on Apple platforms, once', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)
    const askButton = screen.getByRole('button', { name: /Ask AI/ })
    expect(askButton).toHaveTextContent('⌘⌘')
    expect(askButton).toHaveAccessibleDescription(/press Command twice/i)
    expect(screen.getByTestId('ask-ai-coachmark')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss tip' }))
    expect(screen.queryByTestId('ask-ai-coachmark')).toBeNull()
    expect(window.localStorage.getItem(ASK_AI_HINT_SEEN_KEY)).toBe('1')

    unmount()
    render(<Harness />)
    expect(screen.queryByTestId('ask-ai-coachmark')).toBeNull()
  })

  it('the tip hides while chat is open and does not come back after using ⌘⌘', async () => {
    render(<Harness />)
    expect(screen.getByTestId('ask-ai-coachmark')).toBeInTheDocument()
    doubleCmd()
    expect(screen.queryByTestId('ask-ai-coachmark')).toBeNull()
    doubleCmd()
    await waitFor(() => expect(dialog()).toBeNull())
    expect(screen.queryByTestId('ask-ai-coachmark')).toBeNull()
  })

  it('Escape dismisses the tip without blocking anything', () => {
    render(<Harness />)
    key('keydown', 'Escape')
    expect(screen.queryByTestId('ask-ai-coachmark')).toBeNull()
  })

  it('does not advertise ⌘⌘ on non-Apple platforms', () => {
    setPlatform('Win32')
    render(<Harness />)
    expect(screen.getByRole('button', { name: /Ask AI/ })).not.toHaveTextContent('⌘⌘')
    expect(screen.queryByTestId('ask-ai-coachmark')).toBeNull()
  })
})

