'use client'

import { useEffect, useRef } from 'react'
import { getTemplate } from '@/lib/deckTemplates'
import { resolveSlideVars } from '@/lib/deckTemplates/toCssVars'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'
import { prefersReducedMotion } from './motion/useReducedMotion'

const meridian = getTemplate('meridian')

const BEFORE = {
  title: 'Our subscriber base has grown steadily over the last six months',
  stat: '12,400 active subscribers',
  statLabel: 'as of this quarter',
  body: 'Subscription revenue has been increasing at a consistent rate month over month across all of our regions.',
}
const AFTER = {
  title: 'Subscribers doubled in six months',
  stat: '12.4k and climbing',
  body: 'Revenue grew every single month.',
}
const PROMPT = 'make these punchier'

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export function EditLikeYouTalk() {
  const rootRef = useRef<HTMLElement>(null)
  const demoRef = useRef<HTMLDivElement>(null)
  const keysRef = useRef<HTMLDivElement>(null)
  const titleBlockRef = useRef<HTMLDivElement>(null)
  const statBlockRef = useRef<HTMLDivElement>(null)
  const bodyBlockRef = useRef<HTMLDivElement>(null)
  const titleTextRef = useRef<HTMLDivElement>(null)
  const statTextRef = useRef<HTMLElement>(null)
  const bodyTextRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const apTextRef = useRef<HTMLSpanElement>(null)
  const apHintRef = useRef<HTMLSpanElement>(null)
  useScrollReveals(rootRef)

  useEffect(() => {
    const blocks = [titleBlockRef.current, statBlockRef.current, bodyBlockRef.current]
    const texts = [titleTextRef.current, statTextRef.current, bodyTextRef.current]
    if (blocks.some(b => !b) || texts.some(t => !t)) return
    const b = blocks as HTMLElement[]
    const t = texts as HTMLElement[]
    const before = [BEFORE.title, BEFORE.stat, BEFORE.body]
    const after = [AFTER.title, AFTER.stat, AFTER.body]

    function reset() {
      b.forEach((x, i) => {
        x.classList.remove('sel', 'flash')
        t[i].textContent = before[i]
      })
      popRef.current?.classList.remove('show')
      if (apTextRef.current) apTextRef.current.textContent = ''
      if (apHintRef.current) apHintRef.current.textContent = 'Ask AI'
    }

    if (prefersReducedMotion()) {
      b.forEach((x, i) => {
        x.classList.add('sel')
        t[i].textContent = after[i]
      })
      popRef.current?.classList.add('show')
      if (apTextRef.current) apTextRef.current.textContent = PROMPT
      if (apHintRef.current) apHintRef.current.textContent = 'Updated 3 elements'
      keysRef.current?.classList.add('pressed')
      return
    }

    let token = 0
    let running = false

    async function loop(my: number) {
      while (my === token) {
        reset()
        await sleep(1200)
        if (my !== token) return
        for (let i = 0; i < 3; i++) {
          b[i].classList.add('sel')
          await sleep(450)
        }
        if (my !== token) return
        popRef.current?.classList.add('show')
        await sleep(700)
        for (let c = 1; c <= PROMPT.length; c++) {
          if (my !== token) return
          if (apTextRef.current) apTextRef.current.textContent = PROMPT.slice(0, c)
          await sleep(55)
        }
        await sleep(500)
        if (my !== token) return
        if (apHintRef.current) apHintRef.current.textContent = 'Updating'
        await sleep(500)
        b.forEach((x, i) => {
          t[i].textContent = after[i]
          x.classList.remove('flash')
          void x.offsetWidth
          x.classList.add('flash')
        })
        if (apHintRef.current) apHintRef.current.textContent = 'Updated 3 elements'
        await sleep(3200)
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !running) {
            running = true
            token++
            loop(token)
            keysRef.current?.classList.add('pressed')
          } else if (!entry.isIntersecting && running) {
            running = false
            token++
          }
        })
      },
      { threshold: 0.35 }
    )
    if (demoRef.current) observer.observe(demoRef.current)
    return () => {
      token++
      observer.disconnect()
    }
  }, [])

  const slideVars = resolveSlideVars(meridian)

  return (
    <section ref={rootRef} className="m-block" id="edit" aria-labelledby="h-edit">
      <div className="m-wrap">
        <div className="m-edit">
          <div data-reveal>
            <Eyebrow>Edit Like You Talk</Eyebrow>
            <TypewriterHeading as="h2" id="h-edit">
              Change anything by asking.
            </TypewriterHeading>
            <p className="m-lede">Select three things. Fix them in one sentence.</p>

            <div className="m-keys" ref={keysRef}>
              <div className="m-keyset">
                <div className="m-keyrow">
                  <span className="m-key">⌘</span>
                  <span className="m-key">⌘</span>
                </div>
                <span>Ask AI</span>
              </div>
              <div className="m-keyset">
                <div className="m-keyrow">
                  <span className="m-key">⌘</span>
                  <span className="m-key">/</span>
                </div>
                <span>Insert panel</span>
              </div>
            </div>
            <p className="m-mac-note">The ⌘⌘ shortcut is Mac-only today.</p>

            <div className="m-callout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 8v4l3 2" />
              </svg>
              <p>
                <b>Every change is a checkpoint.</b> Undo a step, or open History and go back to any earlier version.
              </p>
            </div>
          </div>

          <div
            data-reveal
            className="m-ed-slide m-slide"
            ref={demoRef}
            style={{ ...slideVars, background: meridian.colors.bg, color: meridian.colors.text, borderRadius: meridian.surfaces.slideRadius }}
            aria-label="Demo of selecting three blocks and asking AI to make them punchier"
          >
            <div className="m-slide-in">
              <div className="m-ed-b" data-tag="Title" ref={titleBlockRef}>
                <div className="m-slide-h" ref={titleTextRef}>
                  {BEFORE.title}
                </div>
              </div>
              <div className="m-ed-row">
                <div className="m-ed-b m-slide-card" data-tag="Stat card" ref={statBlockRef}>
                  <b ref={statTextRef as React.Ref<HTMLElement>}>{BEFORE.stat}</b>
                  <span>{BEFORE.statLabel}</span>
                </div>
                <div className="m-ed-b" data-tag="Body" ref={bodyBlockRef}>
                  <div className="m-slide-p" ref={bodyTextRef} style={{ marginTop: 0, maxWidth: '100%' }}>
                    {BEFORE.body}
                  </div>
                </div>
              </div>
            </div>
            <div className="m-askpop" ref={popRef}>
              <div className="m-ap-chips">
                <span className="m-chip">Title</span>
                <span className="m-chip">Stat card</span>
                <span className="m-chip">Body</span>
              </div>
              <div className="m-ap-in">
                <span>
                  <span ref={apTextRef} />
                  <span className="m-caret" />
                </span>
                <span className="m-ap-hint" ref={apHintRef}>
                  Ask AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
