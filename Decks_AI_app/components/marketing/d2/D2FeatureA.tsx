import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from '../SlideMock'
import { D2Section } from './D2Section'
import { D2SectionLabel } from './D2SectionLabel'
import { D2SplitHeadline } from './D2SplitHeadline'
import { D2SubCards } from './D2SubCards'

const noir = getTemplate('noir')

export function D2FeatureA() {
  return (
    <D2Section id="d2-features">
      <div className="d2-sec-head">
        <D2SectionLabel>intelligent outlines</D2SectionLabel>
        <D2SplitHeadline lines={['your ideas, structured instantly', 'AI that thinks in narrative arcs']} />
        <p className="d2-sec-desc" data-reveal>
          Deck AI doesn&apos;t fill a template — it reasons about your story first: what comes first, what
          builds the case, what closes it. The structure comes from the content, not the other way around.
        </p>
      </div>

      <div className="d2-chrome" data-reveal data-parallax="0.06">
        <div className="d2-chrome-bar">
          <i /> <i /> <i />
          <span className="d2-chrome-title">deck-ai.app/editor — outline</span>
        </div>
        <div className="d2-chrome-body">
          <SlideMock
            template={noir}
            kind="cards"
            title="Why now"
            cards={[
              { value: '01', label: 'The problem' },
              { value: '02', label: 'The market' },
              { value: '03', label: 'The ask' },
            ]}
          />
        </div>
      </div>

      <D2SubCards
        cards={[
          { title: 'story-first structure', body: 'Sections are ordered by narrative logic, not a fixed slide count.' },
          { title: 'drag to rearrange any section', body: 'Reorder, merge, or split sections before a single slide is designed.' },
        ]}
      />
    </D2Section>
  )
}
