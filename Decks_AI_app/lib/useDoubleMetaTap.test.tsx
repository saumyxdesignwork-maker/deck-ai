import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { DOUBLE_META_ALLOW_ATTR, useDoubleMetaTap } from './useDoubleMetaTap'

let clock = 1000
const originalPlatform = navigator.platform

function setPlatform(value: string) {
  Object.defineProperty(navigator, 'platform', { value, configurable: true })
}

function fire(type: 'keydown' | 'keyup', key: string, init: KeyboardEventInit = {}) {
  const target = document.activeElement ?? document.body
  act(() => {
    target.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, ...init }))
  })
}

function advance(ms: number) {
  clock += ms
}

function tapMeta(holdMs = 40) {
  fire('keydown', 'Meta', { metaKey: true })
  advance(holdMs)
  fire('keyup', 'Meta')
}

function doubleTap() {
  tapMeta()
  advance(120)
  tapMeta()
}

beforeEach(() => {
  clock = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  setPlatform('MacIntel')
})

afterEach(() => {
  vi.restoreAllMocks()
  setPlatform(originalPlatform)
  document.body.innerHTML = ''
})

function setup(enabled = true) {
  const cb = vi.fn()
  const hook = renderHook(({ on }) => useDoubleMetaTap(cb, on), { initialProps: { on: enabled } })
  return { cb, hook }
}

describe('useDoubleMetaTap', () => {
  it('fires on two distinct clean Command taps', () => {
    const { cb } = setup()
    doubleTap()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('toggles on every pair (open, then close)', () => {
    const { cb } = setup()
    doubleTap()
    advance(500)
    doubleTap()
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('ignores a single tap and taps too far apart', () => {
    const { cb } = setup()
    tapMeta()
    advance(400)
    tapMeta()
    expect(cb).not.toHaveBeenCalled()
  })

  it('does not fire for regular Command shortcuts (⌘S ⌘S)', () => {
    const { cb } = setup()
    fire('keydown', 'Meta', { metaKey: true })
    fire('keydown', 's', { metaKey: true })
    fire('keyup', 's', { metaKey: true })
    fire('keyup', 'Meta')
    advance(100)
    fire('keydown', 'Meta', { metaKey: true })
    fire('keydown', 's', { metaKey: true })
    fire('keyup', 'Meta')
    expect(cb).not.toHaveBeenCalled()
  })

  it('does not pair a clean tap with a following chord', () => {
    const { cb } = setup()
    tapMeta()
    advance(100)
    fire('keydown', 'Meta', { metaKey: true })
    fire('keydown', 'k', { metaKey: true })
    fire('keyup', 'Meta')
    advance(100)
    tapMeta()
    expect(cb).not.toHaveBeenCalled()
  })

  it('ignores key-repeat and long holds', () => {
    const { cb } = setup()
    fire('keydown', 'Meta', { metaKey: true })
    advance(150)
    fire('keydown', 'Meta', { metaKey: true, repeat: true })
    advance(250)
    fire('keyup', 'Meta') // held 400ms → a hold, not a tap
    advance(100)
    tapMeta()
    expect(cb).not.toHaveBeenCalled()
  })

  it('ignores Command during IME composition', () => {
    const { cb } = setup()
    tapMeta()
    advance(60)
    fire('keydown', 'Process', { isComposing: true })
    advance(60)
    tapMeta()
    expect(cb).not.toHaveBeenCalled()
  })

  it('resets when the window loses focus mid-sequence', () => {
    const { cb } = setup()
    tapMeta()
    act(() => { window.dispatchEvent(new Event('blur')) })
    advance(100)
    tapMeta()
    expect(cb).not.toHaveBeenCalled()
  })

  it('treats ⌘-click as a chord, not a tap', () => {
    const { cb } = setup()
    tapMeta()
    advance(60)
    fire('keydown', 'Meta', { metaKey: true })
    act(() => { window.dispatchEvent(new Event('pointerdown')) })
    fire('keyup', 'Meta')
    expect(cb).not.toHaveBeenCalled()
  })

  it('stays out of the way while typing in a normal field', () => {
    const { cb } = setup()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    doubleTap()
    expect(cb).not.toHaveBeenCalled()
  })

  it('works from the Ask AI prompt itself so ⌘⌘ can close it', () => {
    const { cb } = setup()
    const ta = document.createElement('textarea')
    ta.setAttribute(DOUBLE_META_ALLOW_ATTR, '')
    document.body.appendChild(ta)
    ta.focus()
    doubleTap()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('is inert when disabled (no ready deck) and on non-Apple platforms', () => {
    const { cb, hook } = setup(false)
    doubleTap()
    expect(cb).not.toHaveBeenCalled()

    hook.unmount()
    setPlatform('Win32')
    const other = setup(true)
    doubleTap()
    expect(other.cb).not.toHaveBeenCalled()
  })
})
