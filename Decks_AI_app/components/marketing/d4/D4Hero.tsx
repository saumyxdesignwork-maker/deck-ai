import Link from 'next/link'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from '../SlideMock'
import { studioHref } from '../studioLink'
import { D4FeatureRow } from './D4FeatureRow'
import { D4Plate } from './D4Plate'

const meridian = getTemplate('meridian')

export function D4Hero() {
  return (
    <section className="d4-hero d4-wrap" id="d4-top" data-theme="dark" aria-labelledby="d4-h1">
      <p className="d4-kicker">
        <i>—</i>
        <span aria-hidden="true" />
        The Deck AI Edition
      </p>
      <h1 id="d4-h1" className="d4-display" data-reveal>
        From one sentence to a <em>finished</em> deck.
      </h1>
      <p className="d4-lede" data-reveal data-reveal-stagger="1">
        Describe the deck you need. Deck AI reasons out the structure, writes the copy, and designs every
        slide — then hands you the controls.
      </p>
      <div className="d4-hero-ctas" data-reveal data-reveal-stagger="2">
        <Link href={studioHref()} className="d4-btn d4-btn-primary">
          Start your edition
        </Link>
        <Link href="#d4-prompt" className="d4-btn d4-btn-ghost">
          Read the chapters <span className="d4-arrow">→</span>
        </Link>
      </div>

      <D4FeatureRow cols={1}>
        <D4Plate stagger={3}>
          <SlideMock
            template={meridian}
            kind="cover"
            title="Rise & Subscribe"
            subtitle="Seed pitch deck · generated from one prompt"
          />
        </D4Plate>
      </D4FeatureRow>
    </section>
  )
}
