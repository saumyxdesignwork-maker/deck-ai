'use client'

import { useEffect, useRef } from 'react'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from './SlideMock'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'
import { useReducedMotion } from './motion/useReducedMotion'

const noir = getTemplate('noir')

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}
function ease(t: number) {
  return t * t * (3 - 2 * t)
}

const EXPORTS = [
  { label: 'PDF', body: 'A fixed copy that looks the same everywhere.' },
  { label: 'PPTX', body: "Opens in PowerPoint. Each slide exports as an image, so text isn't editable there." },
  { label: 'HTML', body: 'A standalone web page you can host or send as a link.' },
]

export function ShipIt() {
  const rootRef = useRef<HTMLElement>(null)
  const presentRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const reducedMotion = useReducedMotion()
  useScrollReveals(rootRef)

  useEffect(() => {
    if (reducedMotion) return
    let lastLabel = ''
    let ticking = false
    const update = () => {
      const fr = presentRef.current?.getBoundingClientRect()
      if (!fr) return
      const vh = window.innerHeight
      const e = ease(clamp(1 - (fr.top - vh * 0.12) / (vh * 0.55), 0, 1))
      const el = presentRef.current!
      el.style.setProperty('--pw', (44 + 56 * e).toFixed(1))
      el.style.setProperty('--pe', e.toFixed(3))
      el.style.setProperty('--pb', (8 - 6 * e).toFixed(1))
      el.style.setProperty('--pr', (16 - 14 * e).toFixed(1))
      const label = e > 0.6 ? 'Present mode, scaled up on a TV' : 'Present mode, on a laptop'
      if (label !== lastLabel && labelRef.current) {
        labelRef.current.textContent = label
        lastLabel = label
      }
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  }, [reducedMotion])

  return (
    <section ref={rootRef} className="m-block" id="ship" aria-labelledby="h-ship">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal>
          <Eyebrow>Ship It</Eyebrow>
          <TypewriterHeading as="h2" id="h-ship">
            Present from the browser. Export to PowerPoint, PDF, or a standalone web page.
          </TypewriterHeading>
          <p className="m-lede">The deck is usable the moment it&rsquo;s done, on a laptop or a conference-room TV.</p>
        </div>

        <div className="m-present" ref={presentRef} data-reveal>
          <div className="m-pframe">
            <SlideMock template={noir} kind="cover" title="Rise & Subscribe" subtitle="Seed pitch deck" />
          </div>
          <div className="m-pbase" />
          <div className="m-pstand" />
          <p className="m-plabel" ref={labelRef} aria-live="off">
            Present mode, on a laptop
          </p>
        </div>

        <div className="m-exports">
          {EXPORTS.map(exp => (
            <div key={exp.label} data-reveal className="m-export">
              <div className="m-fmt">
                {exp.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v11" />
                  <path d="M7 11l5 5 5-5" />
                  <path d="M5 20h14" />
                </svg>
              </div>
              <p>{exp.body}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <a
            className="m-btn m-btn-ghost"
            href="#proof"
            onClick={e => {
              e.preventDefault()
              document.getElementById('proof')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            See a sample export
          </a>
        </div>
      </div>
    </section>
  )
}
