'use client'

import { useRef } from 'react'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from './SlideMock'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'

const ITEMS = [
  { template: 'meridian', caption: 'Seed pitch', cover: 'Rise & Subscribe' },
  { template: 'ledger', caption: 'Quarterly business review', cover: 'Q3 in review' },
  { template: 'slate', caption: 'Engineering roadmap', cover: 'Platform 2027' },
  { template: 'riso', caption: 'Campaign readout', cover: 'Spring launch' },
  { template: 'noir', caption: 'Brand launch', cover: 'After dark' },
  { template: 'bloom', caption: 'Customer story', cover: 'A year with Fernhill' },
]

/** A sample gallery, one template each — clearly example mockups, not
 * customer testimonials, logos, or usage numbers (none of which exist yet). */
export function Gallery() {
  const rootRef = useRef<HTMLElement>(null)
  useScrollReveals(rootRef)

  return (
    <section ref={rootRef} className="m-block" id="proof" aria-labelledby="h-proof">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal>
          <Eyebrow>Proof</Eyebrow>
          <TypewriterHeading as="h2" id="h-proof">
            Made with Deck AI.
          </TypewriterHeading>
          <p className="m-lede">Sample decks, one for each template.</p>
        </div>
        <div className="m-gallery">
          {ITEMS.map(item => {
            const template = getTemplate(item.template)
            return (
              <figure key={item.template} className="m-gitem" data-reveal>
                <SlideMock template={template} kind="cover" title={item.cover} subtitle={item.caption} />
                <figcaption>
                  {item.caption}
                  <small>{template.name} template</small>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}
