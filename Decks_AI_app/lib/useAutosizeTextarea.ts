'use client'

import { RefObject, useLayoutEffect } from 'react'

/**
 * Grows a textarea with its content, smoothly. `field-sizing: content` would
 * be simpler but isn't reliable in Safari, and it can't transition anyway.
 *
 * Measuring requires `height: auto`, which would also become the transition's
 * start value (a visible jump), so the measure happens with the transition
 * disabled and the previous height restored before the real change is set.
 * Pair with the `.dk-autosize` class for the 120ms height transition.
 */
export function useAutosizeTextarea(ref: RefObject<HTMLTextAreaElement | null>, value: string, maxHeight: number) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const previous = el.style.height
    el.style.transition = 'none'
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = previous
    void el.offsetHeight // commit the restored height before re-enabling the transition
    el.style.transition = ''
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [ref, value, maxHeight])
}
