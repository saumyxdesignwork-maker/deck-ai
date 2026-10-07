'use client'

import { useEffect, useRef } from 'react'
import { getTemplate } from '@/lib/deckTemplates'
import { ChaosSlide } from './ChaosSlide'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'
import { useReducedMotion } from './motion/useReducedMotion'

const meridian = getTemplate('meridian')

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

export function ProblemScene() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()
  useScrollReveals(rootRef)

  // Clock ticks fast at first, slowing as the stage scrolls past — the
  // "blank-slide tax" made literal. Same rate curve as the reference: a
  // quadratic ease that bottoms out near zero once the stage has scrolled by.
  useEffect(() => {
    const fmt = (m: number) => `Time spent formatting: ${Math.floor(m / 60)}h ${String(Math.floor(m % 60)).padStart(2, '0')}m`
    let mins = 134
    if (clockRef.current) clockRef.current.textContent = fmt(mins)
    if (reducedMotion) return

    let rate = 1
    const updateRate = () => {
      const host = stageRef.current
      if (!host) return
      const r = host.getBoundingClientRect()
      const vh = window.innerHeight
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1)
      rate = Math.max(0.05, 3 * (1 - p) * (1 - p))
    }
    const interval = setInterval(() => {
      mins += rate
      if (clockRef.current) clockRef.current.textContent = fmt(mins)
    }, 250)
    window.addEventListener('scroll', updateRate, { passive: true })
    updateRate()
    return () => {
      clearInterval(interval)
      window.removeEventListener('scroll', updateRate)
    }
  }, [reducedMotion])

  return (
    <section ref={rootRef} className="m-block" id="problem" aria-labelledby="h-problem">
      <div className="m-wrap">
        <div className="m-problem-grid">
          <div data-reveal>
            <Eyebrow>The Problem</Eyebrow>
            <TypewriterHeading as="h2" id="h-problem">
              You spend more time formatting slides than thinking.
            </TypewriterHeading>
            <p className="m-lede">Your best ideas deserve better than a rushed template.</p>
          </div>
          <div data-reveal ref={stageRef}>
            <ChaosSlide template={meridian} withClock clockRef={clockRef} />
          </div>
        </div>

        <div className="m-pains">
          <div data-reveal className="m-pain">
            <h3>Hours on formatting</h3>
            <p>Nudging boxes one pixel at a time while the actual argument waits.</p>
          </div>
          <div data-reveal className="m-pain">
            <h3>Generic templates</h3>
            <p>Decks that look templated and feel rushed, even when the thinking wasn&rsquo;t.</p>
          </div>
          <div data-reveal className="m-pain">
            <h3>Rewrites for every audience</h3>
            <p>The same story, rebuilt from scratch for the board, the team, and the customer.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
