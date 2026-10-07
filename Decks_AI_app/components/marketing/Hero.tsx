'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Download, Presentation, Sparkles } from 'lucide-react'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from './SlideMock'
import { useReducedMotion } from './motion/useReducedMotion'
import { studioHref } from './studioLink'

const EXAMPLE_PROMPT = 'A pitch deck for a bakery subscription startup'
const meridian = getTemplate('meridian')
const riso = getTemplate('riso')

export function Hero() {
  const typedRef = useRef<HTMLSpanElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const done = () => {
      if (statusRef.current) statusRef.current.innerHTML = '<b>Deck ready</b>'
    }
    if (reducedMotion) {
      if (typedRef.current) typedRef.current.textContent = EXAMPLE_PROMPT
      if (caretRef.current) caretRef.current.style.display = 'none'
      done()
      return
    }
    let i = 0
    let cancelled = false
    const tick = () => {
      if (cancelled || !typedRef.current) return
      i++
      typedRef.current.textContent = EXAMPLE_PROMPT.slice(0, i)
      if (i < EXAMPLE_PROMPT.length) {
        setTimeout(tick, 38 + Math.random() * 40)
      } else {
        if (statusRef.current) statusRef.current.textContent = 'Building your deck'
        setTimeout(() => {
          if (cancelled) return
          if (caretRef.current) caretRef.current.style.display = 'none'
          done()
        }, 700)
      }
    }
    const start = setTimeout(tick, 700)
    return () => {
      cancelled = true
      clearTimeout(start)
    }
  }, [reducedMotion])

  // Background art drifts slowly with scroll — a plain listener is enough
  // for a single global parallax value (no per-section trigger needed).
  useEffect(() => {
    if (reducedMotion) return
    const onScroll = () => {
      bgRef.current?.style.setProperty('--py', (Math.min(window.scrollY, 900) * 0.12).toFixed(1))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [reducedMotion])

  return (
    <section className="m-hero" id="top" aria-labelledby="h1">
      <div className="m-hero-bg" ref={bgRef} aria-hidden="true" />
      <div className="m-hero-frame">
        <div className="m-hero-cols">
          <div className="m-hero-copy">
            <span className="m-hero-pill">
              <b>NEW</b> Multi-select Ask AI — edit three slides in one sentence
            </span>
            <h1 id="h1">From idea to deck in 3 minutes.</h1>
            <p className="m-hero-note">
              Describe it in a sentence. Deck AI asks a clarifying question, builds the whole deck — structure, copy, design — and you make
              the calls from there.
            </p>

            <div className="m-promptbar" aria-label="Example prompt">
              <div className="m-pb-text">
                <span ref={typedRef} />
                <span className="m-caret" ref={caretRef} />
              </div>
              <span className="m-pb-status" ref={statusRef} aria-live="polite">
                Describing your deck
              </span>
            </div>

            <div className="m-hero-ctas">
              <Link href={studioHref({ prompt: EXAMPLE_PROMPT })} className="m-btn m-btn-primary" data-primary>
                Get Started
              </Link>
              <a
                href="#how"
                className="m-btn m-btn-ghost"
                onClick={e => {
                  e.preventDefault()
                  document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                See how it works
              </a>
            </div>

            <p className="m-hero-trust">No design skills needed · Export to PowerPoint &amp; PDF</p>
          </div>

          <div className="m-hero-grid" aria-label="Example generated deck templates">
            <div className="m-hero-cell">
              <SlideMock template={meridian} kind="cover" title="Rise & Subscribe" subtitle="Seed pitch deck." />
            </div>
            <div className="m-hero-cell">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <div className="m-hero-cell">
              <Presentation size={22} aria-hidden="true" />
            </div>
            <div className="m-hero-cell">
              <SlideMock template={riso} kind="cover" title="Spring Launch" subtitle="Campaign readout." />
            </div>
            <div className="m-hero-cell" />
            <div className="m-hero-cell">
              <Download size={22} aria-hidden="true" />
            </div>
            <div className="m-hero-cell" />
            <div className="m-hero-cell" />
          </div>
        </div>
      </div>
    </section>
  )
}
