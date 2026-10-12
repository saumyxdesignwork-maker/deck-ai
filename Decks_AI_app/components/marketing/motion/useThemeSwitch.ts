'use client'

import { RefObject, useEffect, useRef, useState } from 'react'

export type D4Theme = 'light' | 'dark'

/** Live state of the burn dissolve between two chapter themes. Mutated in
 * place on scroll rather than pushed through React state — it changes every
 * frame, and only the canvas reads it. */
export interface BurnState {
  from: D4Theme
  to: D4Theme
  /** 0 = fully `from`, 1 = fully `to`. */
  progress: number
}

export interface ThemeSwitchState {
  theme: D4Theme
  /** `data-chapter` of the section currently holding the viewport's middle. */
  chapter: string | null
  burnRef: RefObject<BurnState>
}

const readTheme = (el: HTMLElement): D4Theme => (el.dataset.theme === 'light' ? 'light' : 'dark')

/**
 * Direction 4's signature move, ported from Shopify's Editions page: each
 * section declares `data-theme="light|dark"`, and the page inverts between
 * parchment and near-black as you move between them.
 *
 * Rather than snapping at a section boundary, this scrubs the crossing to
 * scroll position — exactly how the reference drives its own transition —
 * so the burn dissolve in D4Burn can sweep in step with the wheel. Progress
 * is measured against the *nearest boundary* rather than "which section
 * holds the middle", which keeps it continuous: were it keyed to the
 * containing section, the pair being blended would swap at the halfway
 * point and progress would jump.
 *
 * The committed theme still flips at the midpoint, so the colour tokens and
 * the dissolve agree on which side of the burn we're on.
 */
export function useThemeSwitch(scope: RefObject<HTMLElement | null>): ThemeSwitchState {
  const [theme, setTheme] = useState<D4Theme>('dark')
  const [chapter, setChapter] = useState<string | null>(null)
  const burnRef = useRef<BurnState>({ from: 'dark', to: 'dark', progress: 0 })

  useEffect(() => {
    const root = scope.current
    if (!root) return

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-theme]'))
    if (!sections.length) return

    // Document-space tops, cached: re-reading layout for every section on
    // every scroll frame would thrash. Re-measured whenever the page resizes
    // or reflows (fonts landing, images sizing, the grid collapsing).
    let tops: number[] = []
    const measure = () => {
      const y = window.scrollY
      tops = sections.map(s => s.getBoundingClientRect().top + y)
    }

    const update = () => {
      if (!tops.length) return
      const centerY = window.scrollY + window.innerHeight / 2

      // Chapter rail: the last section that has started above the middle.
      let activeIdx = 0
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= centerY) activeIdx = i
      }
      setChapter(sections[activeIdx].dataset.chapter ?? null)

      // Nearest boundary (every section top after the first).
      let nearest = 1
      let best = Infinity
      for (let i = 1; i < tops.length; i++) {
        const d = Math.abs(tops[i] - centerY)
        if (d < best) {
          best = d
          nearest = i
        }
      }
      if (tops.length < 2) return

      const from = readTheme(sections[nearest - 1])
      const to = readTheme(sections[nearest])
      // Band over which the crossing is scrubbed, centred on the boundary.
      const band = window.innerHeight * 0.3
      const d = tops[nearest] - centerY
      const progress = Math.min(1, Math.max(0, (band - d) / (band * 2)))

      const burn = burnRef.current
      burn.from = from
      burn.to = to
      burn.progress = from === to ? 0 : progress

      const committed = progress < 0.5 ? from : to
      setTheme(prev => (prev === committed ? prev : committed))
    }

    const onScroll = () => update()
    const onResize = () => {
      measure()
      update()
    }

    measure()
    update()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(root)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
    }
  }, [scope])

  return { theme, chapter, burnRef }
}
