import { beforeAll, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { LayoutGroup, MotionConfig } from 'motion/react'
import { FloatingChat, ChatSurfaceState } from './FloatingChat'
import { EditStageChips } from './EditStageChips'
import { deriveEditRun } from '@/lib/editStages'

// Separate file on purpose: Motion reads prefers-reduced-motion once per
// module graph and caches it, and Vitest isolates modules per file.
beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})

function Chat({ state }: { state: ChatSurfaceState }) {
  const noop = () => {}
  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id="ask-ai">
        <FloatingChat
          state={state}
          onExpand={noop}
          onClose={noop}
          onSubmit={noop}
          activeSection={null}
          runItems={[]}
          isEditing
          run={deriveEditRun([], true, false)}
          canUndo={false}
          onUndo={noop}
        />
      </LayoutGroup>
    </MotionConfig>
  )
}

describe('prefers-reduced-motion', () => {
  it('switches the chat surface to instant (no layout/transform) transitions', () => {
    const { rerender } = render(<Chat state="expanded" />)
    const surface = screen.getByRole('dialog', { name: 'Ask AI' })
    expect(surface).toHaveAttribute('data-motion', 'reduced')

    // expanded → compact happens immediately: no in-between frame to wait for.
    act(() => rerender(<Chat state="compact" />))
    expect(screen.getByRole('button', { name: /Reopen Ask AI/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Ask AI' })).toBeNull()
  })

  it('keeps status meaning in text + icon, so the paused spinner loses nothing', () => {
    render(
      <MotionConfig reducedMotion="user">
        <EditStageChips run={deriveEditRun([], true, false)} onDismiss={() => {}} />
      </MotionConfig>,
    )
    const plan = screen.getByRole('button', { name: /Plan: Running/ })
    expect(plan).toHaveTextContent('Running')
    // The spinner uses .studio-spin, which the reduced-motion media query stops.
    expect(plan.querySelector('.studio-spin')).not.toBeNull()
  })
})
