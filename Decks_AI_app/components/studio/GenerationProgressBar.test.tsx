import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationProgressBar } from './GenerationProgressBar'

describe('GenerationProgressBar', () => {
  it('renders nothing when there is no progress and nothing has failed', () => {
    const { container } = render(<GenerationProgressBar progress={null} failed={false} onRetry={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a determinate fraction for a countable phase (slides)', () => {
    render(<GenerationProgressBar progress={{ phase: 'slides', current: 2, total: 6 }} failed={false} onRetry={() => {}} />)
    expect(screen.getByText('Creating slide layouts')).toBeInTheDocument()
    expect(screen.getByText('2 of 6')).toBeInTheDocument()
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '6')
  })

  it('shows an indeterminate state (no fraction) for a phase with nothing to count', () => {
    render(<GenerationProgressBar progress={{ phase: 'structure' }} failed={false} onRetry={() => {}} />)
    expect(screen.getByText('Building your slides')).toBeInTheDocument()
    expect(screen.queryByText(/ of /)).toBeNull()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'In progress')
  })

  it('shows the failed state with a working Retry action', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<GenerationProgressBar progress={{ phase: 'images', current: 1, total: 2 }} failed onRetry={onRetry} />)
    expect(screen.getByText('Generation stopped')).toBeInTheDocument()
    expect(screen.queryByText('1 of 2')).toBeNull()
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
