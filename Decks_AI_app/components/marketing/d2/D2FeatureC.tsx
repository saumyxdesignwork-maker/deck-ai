import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from '../SlideMock'
import { D2Section } from './D2Section'
import { D2SectionLabel } from './D2SectionLabel'
import { D2SplitHeadline } from './D2SplitHeadline'
import { D2SubCards } from './D2SubCards'

const bloom = getTemplate('bloom')

export function D2FeatureC() {
  return (
    <D2Section>
      <div className="d2-sec-head">
        <D2SectionLabel>your deck, your rules</D2SectionLabel>
        <D2SplitHeadline lines={['block-by-block editing', 'AI rewrites on demand']} />
        <p className="d2-sec-desc" data-reveal>
          Every block — a title, a stat, a chart — can be selected and handed back to the AI with a plain
          instruction. Nothing is locked behind a template.
        </p>
      </div>

      <div className="d2-chrome" data-reveal data-parallax="0.06">
        <div className="d2-chrome-bar">
          <i /> <i /> <i />
          <span className="d2-chrome-title">deck-ai.app/editor — ask ai</span>
        </div>
        <div className="d2-chrome-body">
          <SlideMock
            template={bloom}
            kind="statement"
            title="Make this punchier"
            body="Ask AI rewrites the selected block in place, in your deck's own voice."
          />
        </div>
      </div>

      <D2SubCards
        cards={[
          { title: '6 block types', body: 'Titles, stats, charts, images, quotes, and body copy — each independently editable.' },
          { title: 'AI rewrite any block', body: 'Select one block or several and describe the change in a sentence.' },
        ]}
      />
    </D2Section>
  )
}
