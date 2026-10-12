'use client'

import { useRef } from 'react'
import './d4.css'
import { SmoothScroll } from './motion/SmoothScroll'
import { useScrollReveals } from './motion/useScrollReveals'
import { useThemeSwitch } from './motion/useThemeSwitch'
import { D4Burn } from './d4/D4Burn'
import { D4Geometry } from './d4/D4Geometry'
import { D4Nav } from './d4/D4Nav'
import { D4ChapterIndex } from './d4/D4ChapterIndex'
import { D4Hero } from './d4/D4Hero'
import { D4Chapters } from './d4/D4Chapters'
import { D4Closing } from './d4/D4Closing'
import { D4Footer } from './d4/D4Footer'

/** Direction 4 — "The Renaissance Edition", modeled on Shopify's Winter '26
 * Editions page: a parchment/near-black duotone that inverts per chapter, a
 * Roman-numeral contents rail, Fraunces display type with drop caps, and a
 * fixed construction-geometry backdrop drawn in SVG.
 *
 * Self-contained like Directions 2 and 3: its own token scope (d4.css /
 * .d4-page), its own section components (components/marketing/d4/*), and it
 * reuses only direction-agnostic utilities — SlideMock, studioHref,
 * SmoothScroll, useScrollReveals — from the shared marketing/ folder. */
export function Direction4() {
  const ref = useRef<HTMLDivElement>(null)
  const { theme, chapter, burnRef } = useThemeSwitch(ref)
  useScrollReveals(ref)

  return (
    <div className="d4-page" data-d4-theme={theme} ref={ref}>
      <D4Burn burnRef={burnRef} pageRef={ref} />
      <D4Geometry />
      <SmoothScroll>
        <D4Nav />
        <D4ChapterIndex active={chapter} />
        <main className="d4-main">
          <D4Hero />
          <D4Chapters />
          <D4Closing />
          <D4Footer />
        </main>
      </SmoothScroll>
    </div>
  )
}
