import { TEMPLATES } from '@/lib/deckTemplates'
import { SlideMock } from '../SlideMock'
import { D2Section } from './D2Section'
import { D2SectionLabel } from './D2SectionLabel'
import { D2SplitHeadline } from './D2SplitHeadline'
import { D2SubCards } from './D2SubCards'

export function D2FeatureB() {
  return (
    <D2Section>
      <div className="d2-sec-head">
        <D2SectionLabel>no more ugly slides</D2SectionLabel>
        <D2SplitHeadline lines={['themes that actually look good', 'not another corporate template']} />
        <p className="d2-sec-desc" data-reveal>
          Six built-in themes, each a full design system — type, color, spacing, and chart style — not a
          single swapped accent color.
        </p>
      </div>

      <div className="d2-chrome" data-reveal data-parallax="0.06">
        <div className="d2-chrome-bar">
          <i /> <i /> <i />
          <span className="d2-chrome-title">deck-ai.app/editor — themes</span>
        </div>
        <div className="d2-chrome-body cols-3">
          {TEMPLATES.slice(0, 3).map(t => (
            <SlideMock key={t.id} template={t} kind="cover" title={t.name} />
          ))}
        </div>
      </div>

      <D2SubCards
        cards={[
          { title: '6 built-in themes', body: 'Corporate and creative styles, each with its own type and chart language.' },
          { title: 'full custom controls', body: 'Fine-tune color, typography, and layout once a theme is close enough.' },
        ]}
      />
    </D2Section>
  )
}
