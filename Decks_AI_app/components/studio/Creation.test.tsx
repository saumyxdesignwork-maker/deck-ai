import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionGlobalConfig } from 'motion/react'
import { StudioLanding, SERVICE_UNREACHABLE_MESSAGE } from './StudioLanding'
import { Composer } from './Composer'
import { SUGGESTED_PROMPTS } from '@/lib/fixtures'

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true
})

const prompt = () => screen.getByRole('textbox', { name: /presentation topic/i })

describe('creation screen', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('selection pills expose their state and switch', async () => {
    const user = userEvent.setup()
    render(<StudioLanding onSubmit={() => {}} />)
    const pro = screen.getByRole('button', { name: 'Professional' })
    const creative = screen.getByRole('button', { name: 'Creative' })
    expect(pro).toHaveAttribute('aria-pressed', 'true')
    await user.click(creative)
    expect(creative).toHaveAttribute('aria-pressed', 'true')
    expect(pro).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: '4:3 aspect ratio' }))
    expect(screen.getByRole('button', { name: '4:3 aspect ratio' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('a starter card fills the prompt and focuses it — without submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<StudioLanding onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: SUGGESTED_PROMPTS[0] }))
    await waitFor(() => expect(prompt()).toHaveFocus())
    expect(prompt()).toHaveValue(SUGGESTED_PROMPTS[0])
    const el = prompt() as HTMLTextAreaElement
    expect(el.selectionStart).toBe(SUGGESTED_PROMPTS[0].length)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Send shows inline progress, then hands off prompt + ratio + style', async () => {
    const user = userEvent.setup()
    let resolveHealth!: (r: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>(r => { resolveHealth = r }))
    const onSubmit = vi.fn()
    render(<StudioLanding onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Creative' }))
    await user.type(prompt(), 'A pitch for a bakery')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    // Pending: button busy + inline label, field kept read-only.
    expect(await screen.findByText('Starting your deck…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Starting your deck…' })).toHaveAttribute('aria-busy', 'true')
    expect(onSubmit).not.toHaveBeenCalled()

    await act(async () => resolveHealth(new Response('{}', { status: 200 })))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('A pitch for a bakery', '16:9', 'creative'))
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/health$/)
  })

  it('an unreachable service shows an inline error and keeps the prompt', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const onSubmit = vi.fn()
    render(<StudioLanding onSubmit={onSubmit} />)
    await user.type(prompt(), 'A pitch for a bakery')
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(SERVICE_UNREACHABLE_MESSAGE)
    expect(prompt()).toHaveValue('A pitch for a bakery')
    expect(prompt()).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()

    // Editing the prompt clears the error.
    await user.type(prompt(), '!')
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })
})

describe('composer', () => {
  it('attach menu: anchored, keyboard-operable, Escape returns focus', async () => {
    const user = userEvent.setup()
    render(<Composer onSubmit={() => {}} />)
    const trigger = screen.getByRole('button', { name: 'Attach' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('grows the field with its content (height set from scrollHeight, capped)', () => {
    const { rerender } = render(<Composer onSubmit={() => {}} value="" onChange={() => {}} variant="hero" />)
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 96 })
    rerender(<Composer onSubmit={() => {}} value={'one\ntwo\nthree\nfour'} onChange={() => {}} variant="hero" />)
    expect(ta.style.height).toBe('96px')
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 900 })
    rerender(<Composer onSubmit={() => {}} value={'x\n'.repeat(40)} onChange={() => {}} variant="hero" />)
    expect(ta.style.height).toBe('220px')
    expect(ta.style.overflowY).toBe('auto')
  })

  it('Send has a pressed state class and is disabled while empty', () => {
    render(<Composer onSubmit={() => {}} />)
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toBeDisabled()
    expect(send.className).toContain('dk-press')
  })
})

// ── Voice input (Web Speech API mock) ────────────────────────────────────
class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ''
  continuous = false
  interimResults = false
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  started = false
  constructor() { FakeRecognition.last = this }
  start() { this.started = true }
  stop() { this.started = false; this.onend?.() }
  abort() { this.started = false }
  emit(parts: { text: string; final: boolean }[]) {
    const results = parts.map(p => Object.assign([{ transcript: p.text }], { isFinal: p.final }))
    this.onresult?.({ resultIndex: 0, results })
  }
}

describe('voice input', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    FakeRecognition.last = null
  })

  it('is disabled with an explanation when the browser has no speech API', () => {
    render(<Composer onSubmit={() => {}} />)
    const mic = screen.getByRole('button', { name: 'Voice input is not supported in this browser' })
    expect(mic).toBeDisabled()
  })

  it('shows a clear listening state and streams words into the field', async () => {
    ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition
    const user = userEvent.setup()
    render(<Composer onSubmit={() => {}} />)
    const ta = screen.getByRole('textbox')
    await user.type(ta, 'Deck about')

    await user.click(screen.getByRole('button', { name: 'Start voice input' }))
    const mic = screen.getByRole('button', { name: 'Stop voice input' })
    expect(mic).toHaveAttribute('aria-pressed', 'true')
    expect(mic).toHaveTextContent('Listening')
    expect(FakeRecognition.last?.started).toBe(true)
    // Static state: no pulsing animation classes on the control.
    expect(mic.className).not.toMatch(/pulse|blink/)

    act(() => FakeRecognition.last!.emit([{ text: 'coffee', final: false }]))
    expect(ta).toHaveValue('Deck about coffee')
    act(() => FakeRecognition.last!.emit([{ text: 'coffee subscriptions', final: true }]))
    expect(ta).toHaveValue('Deck about coffee subscriptions')

    await user.click(mic)
    expect(screen.getByRole('button', { name: 'Start voice input' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('explains a blocked microphone inline', async () => {
    ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition
    const user = userEvent.setup()
    render(<Composer onSubmit={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Start voice input' }))
    act(() => {
      FakeRecognition.last!.onerror?.({ error: 'not-allowed' })
      FakeRecognition.last!.onend?.()
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(/Microphone access is blocked/)
  })
})
