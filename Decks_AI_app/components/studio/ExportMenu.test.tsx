import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportMenu } from './ExportMenu'
import * as deckExport from '@/lib/deckExport'

vi.mock('@/lib/deckExport', () => ({
  captureSlides: vi.fn(),
  exportToPdf: vi.fn(),
  exportToPptx: vi.fn(),
  exportToHtml: vi.fn(),
}))

const defaultProps = {
  getSlideNodes: () => [document.createElement('div')],
  title: 'Test Deck',
  aspectRatio: '16:9' as const,
}

beforeEach(() => {
  vi.mocked(deckExport.captureSlides).mockReset().mockResolvedValue(['data:image/png;base64,abc'])
  vi.mocked(deckExport.exportToPdf).mockReset().mockResolvedValue(undefined)
  vi.mocked(deckExport.exportToPptx).mockReset().mockResolvedValue(undefined)
  vi.mocked(deckExport.exportToHtml).mockReset()
})

async function openMenu(props: Partial<React.ComponentProps<typeof ExportMenu>> = {}) {
  const user = userEvent.setup()
  render(<ExportMenu {...defaultProps} {...props} />)
  await user.click(screen.getByRole('button', { name: 'Export' }))
  return user
}

describe('ExportMenu', () => {
  it('is closed by default and opens as an accessible menu on click', async () => {
    render(<ExportMenu {...defaultProps} />)
    expect(screen.queryByRole('menu')).toBeNull()
    const trigger = screen.getByRole('button', { name: 'Export' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    const user = userEvent.setup()
    await user.click(trigger)
    expect(screen.getByRole('menu', { name: 'Export deck' })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('lists all three formats ready to use by default — no "Soon" stub', async () => {
    await openMenu()
    const pdf = screen.getByRole('menuitem', { name: /Export as PDF/ })
    const pptx = screen.getByRole('menuitem', { name: /Export as PowerPoint/ })
    const html = screen.getByRole('menuitem', { name: /Export as HTML/ })
    for (const item of [pdf, pptx, html]) {
      expect(item).not.toHaveAttribute('aria-disabled')
    }
    expect(screen.queryByText('Soon')).toBeNull()
    expect(screen.getByText('Standalone interactive web page')).toBeInTheDocument()
  })

  it('does not fire onClick for an explicitly unavailable format', async () => {
    const user = await openMenu({ initialStatus: { pdf: 'unavailable' } })
    const pdf = screen.getByRole('menuitem', { name: /Export as PDF/ })
    expect(pdf).toHaveAttribute('aria-disabled', 'true')
    await user.click(pdf)
    expect(deckExport.captureSlides).not.toHaveBeenCalled()
    expect(pdf).toHaveAttribute('aria-disabled', 'true')
  })

  it('clicking a ready format captures the slides and hands them to the matching exporter, then shows success', async () => {
    const nodes = [document.createElement('div'), document.createElement('div')]
    const user = await openMenu({ getSlideNodes: () => nodes })
    await user.click(screen.getByRole('menuitem', { name: /Export as PowerPoint/ }))

    // Real work happens — not a fake success.
    await waitFor(() => expect(deckExport.captureSlides).toHaveBeenCalledWith(nodes))
    await waitFor(() => expect(deckExport.exportToPptx).toHaveBeenCalledWith(['data:image/png;base64,abc'], 'Test Deck', '16:9'))

    // Starting an export closes the menu immediately (a multi-second
    // rasterization shouldn't look like a frozen dropdown) — waitFor because
    // the close is state-driven but the menu div itself only leaves the DOM
    // once AnimatePresence's exit animation finishes.
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())

    // Reopen to see the success state land on the right item.
    await user.click(screen.getByRole('button', { name: 'Export' }))
    const pptx = screen.getByRole('menuitem', { name: /Export as PowerPoint/ })
    await waitFor(() => expect(pptx).not.toHaveAttribute('aria-disabled'))
  })

  it('a capture/export failure shows the failed state with a retry affordance, and retrying tries again', async () => {
    vi.mocked(deckExport.captureSlides).mockRejectedValueOnce(new Error('canvas tainted'))
    const user = await openMenu()
    await user.click(screen.getByRole('menuitem', { name: /Export as PDF/ }))

    await user.click(screen.getByRole('button', { name: 'Export' }))
    await waitFor(() => expect(screen.getByText(/Export failed — click to retry/)).toBeInTheDocument())

    // Retry calls it again — this time it succeeds.
    await user.click(screen.getByRole('menuitem', { name: /Export as PDF/ }))
    await waitFor(() => expect(deckExport.captureSlides).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(deckExport.exportToPdf).toHaveBeenCalled())
  })

  it('renders the exporting state', async () => {
    const user = userEvent.setup()
    render(<ExportMenu {...defaultProps} initialStatus={{ pdf: 'exporting' }} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    const pdf = screen.getByRole('menuitem', { name: /Export as PDF/ })
    expect(pdf).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders the success state with no "Soon" badge', async () => {
    const user = userEvent.setup()
    render(<ExportMenu {...defaultProps} initialStatus={{ pptx: 'success' }} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    const pptx = screen.getByRole('menuitem', { name: /Export as PowerPoint/ })
    expect(pptx).not.toHaveAttribute('aria-disabled')
  })

  it('renders the failed state with a retry affordance', async () => {
    const user = userEvent.setup()
    render(<ExportMenu {...defaultProps} initialStatus={{ html: 'failed' }} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByText(/Export failed — click to retry/)).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = await openMenu()
    await user.keyboard('{Escape}')
    // Immediate/state-driven, not tied to the exit-animation's own timing.
    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-expanded', 'false')
    // The menu div itself unmounts once AnimatePresence's exit finishes.
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(screen.getByRole('button', { name: 'Export' })).toHaveFocus()
  })
})
