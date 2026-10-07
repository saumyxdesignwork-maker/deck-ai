'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from './SlideMock'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'
import { studioHref } from './studioLink'

const PERSONAS = [
  { name: 'Product managers', prompt: 'Turn our Q4 PRD into a stakeholder update deck', desc: 'Take the PRD you already wrote and get the deck version, structured for the room.', template: 'meridian', title: 'Q4 roadmap update', sub: 'From PRD to stakeholder deck' },
  { name: 'Marketers', prompt: "A campaign results readout for the spring launch, with next quarter's plan", desc: 'Results, learnings and next steps in a deck that looks like your brand cares.', template: 'riso', title: 'Spring launch readout', sub: "What worked and what's next" },
  { name: 'Engineers', prompt: 'A tech talk on how we moved to event-driven architecture', desc: 'Explain the hard parts clearly without spending a weekend on slide layout.', template: 'slate', title: 'Going event-driven', sub: 'Lessons from the migration' },
  { name: 'Sales', prompt: 'A pitch deck for a demo call with a logistics software buyer', desc: 'A tailored pitch for each prospect, ready before the call starts.', template: 'noir', title: 'Faster freight, fewer surprises', sub: 'Prepared for Northway Logistics' },
  { name: 'Designers', prompt: 'A case study deck for our checkout redesign', desc: 'Show the problem, the process and the outcome without wrestling a blank canvas.', template: 'bloom', title: 'Redesigning checkout', sub: 'A case study' },
  { name: 'Leadership', prompt: 'A board deck for the quarterly business review', desc: 'Numbers, narrative and decisions needed, in a format the board can scan.', template: 'ledger', title: 'Quarterly business review', sub: 'Prepared for the board' },
]

export function BuiltFor() {
  const rootRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [active, setActive] = useState(0)
  useScrollReveals(rootRef)

  const persona = PERSONAS[active]
  const template = getTemplate(persona.template)

  const focusTab = (i: number) => {
    setActive(i)
    tabRefs.current[i]?.focus()
  }

  return (
    <section ref={rootRef} className="m-block" id="built" aria-labelledby="h-built">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal>
          <Eyebrow>Use Cases</Eyebrow>
          <TypewriterHeading as="h2" id="h-built">
            Built for the people who present the work.
          </TypewriterHeading>
        </div>

        <div className="m-persona-tabs" role="tablist" aria-label="Roles" data-reveal>
          {PERSONAS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              role="tab"
              id={`pt${i}`}
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              className="m-ptab"
              ref={el => {
                tabRefs.current[i] = el
              }}
              onClick={() => setActive(i)}
              onKeyDown={e => {
                if (e.key === 'ArrowRight') focusTab((active + 1) % PERSONAS.length)
                else if (e.key === 'ArrowLeft') focusTab((active + PERSONAS.length - 1) % PERSONAS.length)
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="m-ppanel" role="tabpanel" aria-labelledby={`pt${active}`} data-reveal>
          <div>
            <p className="m-pprompt">&ldquo;{persona.prompt}&rdquo;</p>
            <p className="m-pdesc">{persona.desc}</p>
            <Link href={studioHref({ prompt: persona.prompt, template: persona.template })} className="m-btn m-btn-primary" data-primary>
              Make a {persona.name.toLowerCase().replace(/s$/, '')} deck
            </Link>
          </div>
          <div>
            <SlideMock template={template} kind="cover" title={persona.title} subtitle={persona.sub} />
          </div>
        </div>
      </div>
    </section>
  )
}
