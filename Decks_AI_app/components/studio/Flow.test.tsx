import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionGlobalConfig } from 'motion/react'
import { ClarifyCard } from './ClarifyCard'
import { DataConnectPanel } from './DataConnectPanel'
import { InsertPanel, REMIX_OPTIONS } from '@/components/editor/InsertPanel'
import { ContentSection } from '@/components/editor/blocks/ContentSection'
import type { DeckSection } from '@/lib/fixtures'

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true
})

describe('ClarifyCard', () => {
  afterEach(() => vi.useRealTimers())

  const questions = [
    { topic: 'Audience', options: ['Executives', 'Customers'] },
    { topic: 'Length', options: ['Short', 'Long'] },
  ]

  it('selecting an option only highlights it; Next is required to advance, then focus lands on the next question and it is announced', async () => {
    const user = userEvent.setup()
    render(<ClarifyCard questions={questions} onSubmit={() => {}} />)
    const option = screen.getByRole('button', { name: /Executives/ })
    await user.click(option)
    expect(option).toHaveAttribute('aria-pressed', 'true')
    // Selecting alone must not advance the question.
    expect(screen.queryByText('Length')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    const heading = await screen.findByText('Length', {}, { timeout: 2000 })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByRole('status')).toHaveTextContent('Question 2 of 2: Length')
    // The options are grouped under their question for screen readers.
    expect(screen.getByRole('group', { name: 'Length' })).toBeInTheDocument()
  })

  it('does not steal focus or announce on first render', () => {
    render(<ClarifyCard questions={questions} onSubmit={() => {}} />)
    expect(document.body).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})

describe('DataConnectPanel (custom modal)', () => {
  it('moves focus in on open, keeps Tab inside, closes on Escape and restores focus', async () => {
    const user = userEvent.setup()
    const opener = document.createElement('button')
    opener.textContent = 'open'
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const { unmount } = render(<DataConnectPanel sessionId="s1" onClose={onClose} onAttach={() => {}} />)

    const dialog = screen.getByRole('dialog', { name: 'Connect data' })
    expect(dialog.contains(document.activeElement)).toBe(true)

    for (let i = 0; i < 12; i++) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    await user.tab({ shift: true })
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
    unmount()
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('keeps focus in the dialog when switching steps', async () => {
    const user = userEvent.setup()
    render(<DataConnectPanel sessionId="s1" onClose={() => {}} onAttach={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Connect data' })
    await user.click(within(dialog).getByRole('button', { name: /Paste or upload/i }))
    await waitFor(() => expect(screen.getByText('Paste or upload a table')).toHaveFocus())
  })
})

const section = (over: Partial<DeckSection> = {}): DeckSection => ({
  id: 's1', title: 'Market', layout: 'key-points', thumbnailColor: '#fff',
  blocks: [
    { id: 'h', type: 'heading', content: 'Market' },
    { id: 'p', type: 'paragraph', content: 'Growing fast' },
    { id: 'img', type: 'image', content: 'A chart' },
  ],
  ...over,
})

describe('InsertPanel (inspector)', () => {
  it('is a proper tablist with arrow-key navigation and a fixed width', async () => {
    const user = userEvent.setup()
    const { container } = render(<InsertPanel width={300} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(t => t.textContent)).toEqual(['Insert', 'Layout', 'Remix', 'More'])
    tabs[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Layout' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Layout' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', screen.getByRole('tab', { name: 'Layout' }).id)
    expect((container.firstChild as HTMLElement).style.width).toBe('300px')
  })

  it('Layout applies a real deck layout to the active slide', async () => {
    const user = userEvent.setup()
    const onSetLayout = vi.fn()
    const { rerender } = render(<InsertPanel activeSection={null} onSetLayout={onSetLayout} onRemix={() => {}} />)
    await user.click(screen.getByRole('tab', { name: 'Layout' }))
    expect(screen.getByText('Select a slide on the canvas to change its layout')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Bento' })).toBeDisabled()

    rerender(<InsertPanel activeSection={section()} onSetLayout={onSetLayout} onRemix={() => {}} />)
    expect(screen.getByRole('radio', { name: 'Key Points' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('radio', { name: 'Bento' }))
    expect(onSetLayout).toHaveBeenCalledWith('bento')
  })

  it('Remix runs a real, deck-agnostic edit instruction and waits while one is running', async () => {
    const user = userEvent.setup()
    const onRemix = vi.fn()
    const { rerender } = render(<InsertPanel activeSection={section()} onSetLayout={() => {}} onRemix={onRemix} />)
    await user.click(screen.getByRole('tab', { name: 'Remix' }))
    await user.click(screen.getByRole('button', { name: /Add data/ }))
    const addData = REMIX_OPTIONS.find(o => o.label === 'Add data')!
    expect(onRemix).toHaveBeenCalledWith(addData.instruction)
    expect(addData.instruction).toMatch(/placeholder/)
    for (const o of REMIX_OPTIONS) expect(o.instruction).not.toMatch(/\b(WBR|MBR|QBR)\b/)

    rerender(<InsertPanel activeSection={section()} onSetLayout={() => {}} onRemix={onRemix} isEditing />)
    expect(screen.getByRole('button', { name: /Add data…/ })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: /Summarise/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Summarise/ }))
    expect(onRemix).toHaveBeenCalledTimes(1)
  })

  it('standalone editor (no wiring) keeps its previous local behavior', async () => {
    const user = userEvent.setup()
    render(<InsertPanel />)
    await user.click(screen.getByRole('tab', { name: 'Layout' }))
    await user.click(screen.getByRole('radio', { name: 'Data' }))
    expect(screen.getByRole('radio', { name: 'Data' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('ContentSection (canvas)', () => {
  const noop = () => {}

  it('renders the section in its layout', () => {
    const { rerender, container } = render(<ContentSection section={section({ layout: 'media-text' })} isActive={false} onClick={noop} />)
    expect(container.querySelector('[data-layout="media-text"]')).not.toBeNull()
    rerender(<ContentSection section={section({ layout: 'statement' })} isActive={false} onClick={noop} />)
    return waitFor(() => expect(container.querySelector('[data-layout="statement"]')).not.toBeNull())
  })

  it('animates only blocks inserted after first render', () => {
    const s = section()
    const { rerender, container } = render(<ContentSection section={s} isActive={false} onClick={noop} />)
    expect(container.querySelectorAll('[data-entering]').length).toBe(0)
    rerender(<ContentSection section={{ ...s, blocks: [...s.blocks, { id: 'new', type: 'callout', content: 'Hi' }] }} isActive={false} onClick={noop} />)
    const entering = container.querySelectorAll('[data-entering]')
    expect(entering.length).toBe(1)
    expect(entering[0]).toHaveAttribute('data-block-id', 'new')
  })

  it('shows the "changed" cue only on blocks the AI edit altered, replaying per edit', () => {
    const s = section()
    const { rerender, container } = render(<ContentSection section={s} isActive={false} onClick={noop} highlight={{ ids: new Set(['p']), key: 1 }} />)
    const cues = () => [...container.querySelectorAll('[data-changed]')].map(c => c.closest('[data-block-id]')?.getAttribute('data-block-id'))
    expect(cues()).toEqual(['p'])
    const first = container.querySelector('[data-changed]')
    rerender(<ContentSection section={s} isActive={false} onClick={noop} highlight={{ ids: new Set(['p']), key: 2 }} />)
    expect(container.querySelector('[data-changed]')).not.toBe(first) // remounted → animation replays
    act(() => rerender(<ContentSection section={s} isActive={false} onClick={noop} highlight={null} />))
    expect(cues()).toEqual([])
  })
})
