'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { studioHref } from './studioLink'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useReducedMotion } from './motion/useReducedMotion'

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

const STEPS = [
  { title: 'Describe it', body: "One sentence and an aspect ratio. That's the whole brief." },
  { title: 'Answer a question or two', body: 'Deck AI asks instead of guessing, so the first draft starts closer to what you meant.' },
  { title: 'Shape the outline', body: 'Reorder slides and pick layouts before anything is generated. You approve the outline first.' },
  { title: 'Get your deck', body: 'Generation shows honest, real-time progress, then drops you into a deck you can edit.' },
]

function PromptMock() {
  return (
    <div className="m-glass">
      <div className="m-m-label">Your idea</div>
      <div className="m-m-input">A pitch deck for a bakery subscription startup</div>
      <div className="m-m-row">
        <span className="m-chip on">16:9</span>
        <span className="m-chip">4:3</span>
        <span className="m-chip">1:1</span>
      </div>
      <span className="m-m-btn">Continue</span>
    </div>
  )
}
function ClarifyMock() {
  return (
    <div className="m-glass">
      <div className="m-m-label">Question 1 of 2</div>
      <h3 style={{ marginBottom: 6 }}>Who is this deck for?</h3>
      <div className="m-opt on">
        <i />
        Investors
      </div>
      <div className="m-opt">
        <i />
        Customers
      </div>
      <div className="m-opt">
        <i />
        My internal team
      </div>
      <span className="m-m-btn">Next</span>
    </div>
  )
}
function OutlineMock() {
  const rows: [string, string][] = [
    ['Rise & Subscribe', 'Cover'],
    ['The problem with store bread', 'Statement'],
    ['How a subscription works', 'Three cards'],
    ['Traction', 'Chart'],
    ['The ask', 'Closing'],
  ]
  return (
    <div className="m-glass">
      <div className="m-m-label">Outline: drag to reorder</div>
      {rows.map(([t, chip], i) => (
        <div className="m-ol" key={t}>
          <span className="m-grip">::</span>
          <span className="m-t">{t}</span>
          <span className={`m-chip${i === 2 ? ' on' : ''}`}>{chip}</span>
        </div>
      ))}
      <span className="m-m-btn">Generate deck</span>
    </div>
  )
}
function ProgressMock() {
  const done = ['Cover', 'The problem with store bread', 'How a subscription works']
  return (
    <div className="m-glass">
      <div className="m-m-label">Generating your deck</div>
      <h3>Designing slide 4 of 5</h3>
      <div className="m-prog">
        <i style={{ width: '62%' }} />
      </div>
      {done.map(d => (
        <div className="m-pl" key={d}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
          {d}
        </div>
      ))}
      <div className="m-pl">
        <span className="m-spin" />
        Traction
      </div>
    </div>
  )
}
const MOCKS = [PromptMock, ClarifyMock, OutlineMock, ProgressMock]

export function HowItWorks() {
  const stepsLeftRef = useRef<HTMLDivElement>(null)
  const railFillRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLElement | null)[]>([])
  const mockRefs = useRef<(HTMLElement | null)[]>([])
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    let ticking = false
    const update = () => {
      const lr = stepsLeftRef.current?.getBoundingClientRect()
      if (!lr) return
      const vh = window.innerHeight
      railFillRef.current?.style.setProperty('--rp', clamp((vh * 0.5 - lr.top) / lr.height, 0, 1).toFixed(3))

      let active = 0
      stepRefs.current.forEach((s, i) => {
        if (!s) return
        const b = s.getBoundingClientRect()
        if (b.top + b.height / 2 < vh * 0.62) active = i
      })
      stepRefs.current.forEach((s, i) => s?.classList.toggle('on', i === active))
      mockRefs.current.forEach((m, i) => m?.classList.toggle('on', i === active))
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
    <section className="m-block" id="how" aria-labelledby="h-how">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal>
          <Eyebrow>How It Works</Eyebrow>
          <TypewriterHeading as="h2" id="h-how">
            From one sentence to a finished deck, with you in control at every step.
          </TypewriterHeading>
          <p className="m-lede">You approve the outline before anything is generated. No surprises.</p>
        </div>

        <div className="m-steps">
          <div className="m-steps-left" ref={stepsLeftRef}>
            <div className="m-rail" aria-hidden="true">
              <div className="m-rail-fill" ref={railFillRef} />
            </div>
            {STEPS.map((step, i) => {
              const Mock = MOCKS[i]
              return (
                <article
                  key={step.title}
                  className={`m-step${i === 0 ? ' on' : ''}`}
                  ref={el => {
                    stepRefs.current[i] = el
                  }}
                >
                  <span className="m-step-n">{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <div className="m-step-mock">
                    <Mock />
                  </div>
                </article>
              )
            })}
          </div>
          <div className="m-steps-right" aria-hidden="true">
            {MOCKS.map((Mock, i) => (
              <div
                key={i}
                className={`m-mock${i === 0 ? ' on' : ''}`}
                ref={el => {
                  mockRefs.current[i] = el
                }}
              >
                <Mock />
              </div>
            ))}
          </div>
        </div>

        <div className="m-inline-cta">
          <Link href={studioHref()} className="m-btn m-btn-primary" data-primary>
            Try it with your own idea
          </Link>
        </div>
      </div>
    </section>
  )
}
