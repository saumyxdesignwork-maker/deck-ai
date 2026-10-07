import Link from 'next/link'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from '../SlideMock'
import { studioHref } from '../studioLink'
import { D2SectionLabel } from './D2SectionLabel'
import { D2SplitHeadline } from './D2SplitHeadline'

const meridian = getTemplate('meridian')

export function D2Hero() {
  return (
    <section className="d2-hero d2-wrap" id="d2-top">
      <div className="d2-hero-glow" aria-hidden="true" />
      <div className="d2-hero-copy">
        <D2SectionLabel>ai presentation builder</D2SectionLabel>
        <D2SplitHeadline
          as="h1"
          id="d2-h1"
          lines={['decks that think.', 'AI-generated presentations from prompt to pitch in minutes.']}
        />
        <p className="d2-hero-desc" data-reveal data-reveal-stagger="1">
          Describe your deck in a sentence. Deck AI builds the structure, copy, and design — you make the calls
          from there.
        </p>
        <div className="d2-hero-ctas" data-reveal data-reveal-stagger="2">
          <Link href={studioHref()} className="d2-btn d2-btn-primary">
            try deck ai free
          </Link>
          <a
            href="#d2-how"
            className="d2-btn d2-btn-ghost"
            onClick={e => {
              e.preventDefault()
              document.getElementById('d2-how')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            see how it works <span className="d2-arrow">→</span>
          </a>
        </div>
      </div>

      <div className="d2-chrome" data-reveal data-reveal-stagger="3">
        <div className="d2-chrome-bar">
          <i /> <i /> <i />
          <span className="d2-chrome-title">deck-ai.app/editor</span>
        </div>
        <div className="d2-chrome-body">
          <SlideMock template={meridian} kind="cover" title="Rise & Subscribe" subtitle="Seed pitch deck · generated from one prompt" />
        </div>
      </div>
    </section>
  )
}
