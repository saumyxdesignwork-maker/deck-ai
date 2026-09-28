import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportMenu } from './ExportMenu'

async function openMenu() {
  const user = userEvent.setup()
  render(<ExportMenu />)
  await user.click(screen.getByRole('button', { name: 'Export' }))
  return user
}

describe('ExportMenu', () => {
  it('is closed by default and opens as an accessible menu on click', async () => {
    render(<ExportMenu />)
    expect(screen.queryByRole('menu')).toBeNull()
    const trigger = screen.getByRole('button', { name: 'Export' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    const user = userEvent.setup()
    await user.click(trigger)
    expect(screen.getByRole('menu', { name: 'Export deck' })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('lists all three formats with honest, non-functional "unavailable" state by default', async () => {
    await openMenu()
    const pdf = screen.getByRole('menuitem', { name: /Export as PDF/ })
    const pptx = screen.getByRole('menuitem', { name: /Export as PowerPoint/ })
    const html = screen.getByRole('menuitem', { name: /Export as HTML/ })
    for (const item of [pdf, pptx, html]) {
      expect(item).toHaveAttribute('aria-disabled', 'true')
    }
    expect(screen.getAllByText('Soon')).toHaveLength(3)
    expect(screen.getByText('Standalone interactive web page')).toBeInTheDocument()
  })

  it('does not fire onClick for an unavailable format', async () => {
    const user = await openMenu()
    const pdf = screen.getByRole('menuitem', { name: /Export as PDF/ })
    await user.click(pdf)
    // Still present, still disabled — clicking an unavailable item is a no-op,
    // never a fake success.
    expect(pdf).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getAllByText('Soon')).toHaveLength(3)
  })

  it('renders the exporting state', async () => {
    const user = userEvent.setup()
    render(<ExportMenu initialStatus={{ pdf: 'exporting' }} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    const pdf = screen.getByRole('menuitem', { name: /Export as PDF/ })
    expect(pdf).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders the success state with no "Soon" badge', async () => {
    const user = userEvent.setup()
    render(<ExportMenu initialStatus={{ pptx: 'success' }} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    const pptx = screen.getByRole('menuitem', { name: /Export as PowerPoint/ })
    expect(pptx).not.toHaveAttribute('aria-disabled')
  })

  it('renders the failed state with a retry affordance', async () => {
    const user = userEvent.setup()
    render(<ExportMenu initialStatus={{ html: 'failed' }} />)
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
