'use client'

import { RefObject, useEffect, useState } from 'react'

export type D4Theme = 'light' | 'dark'

export interface ThemeSwitchState {
  theme: D4Theme
  /** `data-chapter` of the section currently owning the viewport's middle. */
  chapter: string | null
}

/**
 * Direction 4's signature move, ported from Shopify's Editions page: each
 * section declares `data-theme="light|dark"` (and optionally
 * `data-chapter`), and whichever one currently owns the middle of the
 * viewport becomes the page's theme.
 *
 * Returns that state rather than writing to the DOM, so the caller applies
 * it as ordinary JSX (`data-d4-theme={theme}`) and the chapter index can
 * take the active numeral as a plain prop. Everything chrome-level — page
 * background, nav, contents rail, the fixed construction geometry — reads
 * the one attribute, so the whole page inverts as you scroll. The
 * cross-fade itself is a CSS transition on `.d4-page` (see d4.css), which
 * the stylesheet's own reduced-motion block disables.
 */
export function useThemeSwitch(scope: RefObject<HTMLElement | null>): ThemeSwitchState {
  const [state, setState] = useState<ThemeSwitchState>({ theme: 'dark', chapter: null })

  useEffect(() => {
    const root = scope.current
    if (!root) return

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-theme]'))
    if (!sections.length) return

    const read = (el: HTMLElement): ThemeSwitchState => ({
      theme: el.dataset.theme === 'light' ? 'light' : 'dark',
      chapter: el.dataset.chapter ?? null,
    })

    const commit = (el: HTMLElement) => {
      const next = read(el)
      setState(prev => (prev.theme === next.theme && prev.chapter === next.chapter ? prev : next))
    }

    // A thin band across the middle of the viewport: the section crossing it
    // is the one the reader is actually looking at. rootMargin collapses the
    // observed area to that band, so `isIntersecting` means "owns the middle".
    const observer = new IntersectionObserver(
      entries => {
        // Several can cross in one tick during a fast scroll; the last one in
        // document order that's intersecting is the furthest down the page.
        const hit = entries.filter(e => e.isIntersecting).map(e => e.target as HTMLElement)
        if (hit.length) commit(hit[hit.length - 1])
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    )

    sections.forEach(s => observer.observe(s))

    // Seed from whatever is already under the band on mount, so a deep link
    // or a restored scroll position doesn't start on the wrong theme.
    const mid = window.innerHeight / 2
    const initial = sections.find(s => {
      const r = s.getBoundingClientRect()
      return r.top <= mid && r.bottom >= mid
    })
    if (initial) commit(initial)

    return () => observer.disconnect()
  }, [scope])

  return state
}
