'use client'

import { useEffect, useRef } from 'react'

/** Max gap between the two clean Command taps (unchanged from the original handler). */
export const DOUBLE_TAP_WINDOW_MS = 350
/** A press held longer than this is a "hold", not a tap (e.g. Cmd held while deciding on a shortcut). */
export const MAX_TAP_HOLD_MS = 300

/** Inputs that opt back in to ⌘⌘ while focused (the Ask AI prompt itself — so ⌘⌘ can close it). */
export const DOUBLE_META_ALLOW_ATTR = 'data-double-meta-allow'

export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}

function isTypingTarget(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.hasAttribute(DOUBLE_META_ALLOW_ATTR)) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

/**
 * Double-tap Command (⌘⌘) detector. Extracted verbatim from PreviewPane so it
 * can be tested; the core rule is unchanged — a tap only counts if no other
 * key was pressed while Meta was held, so ⌘S ⌘S never fires this. Added
 * guards: long holds, IME composition, ⌘-click, and window blur/hide all
 * invalidate the in-progress tap sequence. macOS/iOS only: Meta is
 * OS-reserved on Windows/Linux, so there the visible button is the trigger.
 */
export function useDoubleMetaTap(onDoubleTap: () => void, enabled: boolean) {
  const callbackRef = useRef(onDoubleTap)
  useEffect(() => {
    callbackRef.current = onDoubleTap
  })

  useEffect(() => {
    if (!enabled || !isApplePlatform()) return

    let metaHeld = false
    let metaClean = true
    let metaDownAt = 0
    let lastCleanTap = 0

    const reset = () => {
      metaHeld = false
      metaClean = true
      lastCleanTap = 0
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // IME composition (keyCode 229 covers Safari, which reports
      // isComposing inconsistently) — never part of a gesture.
      if (e.isComposing || e.keyCode === 229) {
        if (metaHeld) metaClean = false
        lastCleanTap = 0
        return
      }
      if (e.key === 'Meta') {
        if (!e.repeat) {
          metaHeld = true
          metaClean = true
          metaDownAt = performance.now()
        }
        return
      }
      if (metaHeld) metaClean = false
      // Any other key between the two taps breaks the sequence.
      lastCleanTap = 0
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Meta') return
      const now = performance.now()
      const heldFor = now - metaDownAt
      const wasCleanTap = metaHeld && metaClean && heldFor <= MAX_TAP_HOLD_MS
      metaHeld = false
      if (!wasCleanTap) {
        lastCleanTap = 0
        return
      }
      if (isTypingTarget(document.activeElement)) return
      if (lastCleanTap && now - lastCleanTap < DOUBLE_TAP_WINDOW_MS) {
        lastCleanTap = 0
        callbackRef.current()
      } else {
        lastCleanTap = now
      }
    }

    // ⌘-click (open in new tab, multi-select) is a Command chord, not a tap.
    const handlePointerDown = () => {
      if (metaHeld) metaClean = false
      lastCleanTap = 0
    }

    // Losing focus mid-press means we never see the keyup — reset so a
    // stale "held" state can't turn the next single tap into a double.
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') reset()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled])
}
