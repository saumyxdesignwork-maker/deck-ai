'use client'

import { useRef, useState } from 'react'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'

const FAQS: { q: string; a: string | null }[] = [
  {
    q: 'Can I edit everything?',
    a: 'Yes. Every slide is editable in the deck editor. Change text directly, or select elements and ask AI to change them together. Undo and History let you step back to any earlier version.',
  },
  {
    q: 'Does it work with PowerPoint?',
    a: "You can export to PPTX and open it in PowerPoint. Slides in the exported file are images, not editable text boxes, so make your edits in Deck AI and export again. PDF and standalone HTML export are also available.",
  },
  { q: 'Which platforms support the shortcuts?', a: 'The ⌘⌘ shortcut for Ask AI is Mac-only today.' },
  { q: 'Is my data used to train models?', a: null },
  { q: 'What about images?', a: null },
  { q: 'What does it cost?', a: null },
]

export function Faq() {
  const rootRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(0)
  useScrollReveals(rootRef)

  return (
    <section ref={rootRef} className="m-block" id="faq" aria-labelledby="h-faq">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal>
          <Eyebrow>FAQ</Eyebrow>
          <TypewriterHeading as="h2" id="h-faq">
            Questions, answered plainly.
          </TypewriterHeading>
        </div>
        <div className="m-faq" data-reveal>
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="m-qa">
                <h3 style={{ fontSize: 'inherit', letterSpacing: 0 }}>
                  <button type="button" aria-expanded={isOpen} aria-controls={`ans${i}`} id={`q${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                    {item.q}
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M10 4v12M4 10h12" />
                    </svg>
                  </button>
                </h3>
                <div className={`m-ans${isOpen ? ' open' : ''}`} id={`ans${i}`} role="region" aria-labelledby={`q${i}`}>
                  <div>
                    {item.a ? (
                      <p>{item.a}</p>
                    ) : (
                      <p>
                        We&rsquo;ll publish a clear answer here before launch.
                        <br />
                        <span className="m-todo">Placeholder: confirm before launch</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
