import Link from 'next/link'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from '../SlideMock'
import { studioHref } from '../studioLink'
import { D2Section } from './D2Section'
import { D2SplitHeadline } from './D2SplitHeadline'

const riso = getTemplate('riso')

const STEPS = [
  { n: '01', title: 'Describe your deck', body: 'One sentence is enough — Deck AI asks a clarifying question if it needs more.' },
  { n: '02', title: 'AI builds the whole deck', body: 'Structure, narrative, copy, and visual design — generated together, not stitched from templates.' },
  { n: '03', title: 'Edit and ship', body: 'Rewrite any block with AI, swap themes instantly, export to PowerPoint or PDF.' },
]

export function D2HowItWorks() {
  return (
    <D2Section id="d2-how">
      <div className="d2-sec-head center">
        <D2SplitHeadline center lines={['from prompt to polished deck', 'in three steps']} />
      </div>

      <div className="d2-chrome-body cols-3" style={{ display: 'grid' }}>
        {STEPS.map((s, i) => (
          <div key={s.n} data-reveal data-reveal-stagger={i}>
            <span className="d2-label">{s.n}</span>
            <h3>{s.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.95rem' }}>{s.body}</p>
          </div>
        ))}
      </div>

      <div className="d2-chrome" data-reveal data-parallax="0.08">
        <div className="d2-chrome-bar">
          <i /> <i /> <i />
          <span className="d2-chrome-title">deck-ai.app/editor</span>
        </div>
        <div className="d2-chrome-body">
          <SlideMock template={riso} kind="cover" title="Spring Launch" subtitle="Campaign readout · ready to present" />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'clamp(32px, 5vw, 48px)' }} data-reveal>
        <Link href={studioHref()} className="d2-btn d2-btn-primary">
          try it free
        </Link>
      </div>
    </D2Section>
  )
}
