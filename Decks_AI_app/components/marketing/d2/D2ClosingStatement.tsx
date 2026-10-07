import Link from 'next/link'
import { studioHref } from '../studioLink'
import { D2SectionLabel } from './D2SectionLabel'
import { D2SplitHeadline } from './D2SplitHeadline'

export function D2ClosingStatement() {
  return (
    <section className="d2-closing d2-wrap">
      <D2SectionLabel>stop fiddling with slides</D2SectionLabel>
      <D2SplitHeadline center lines={['from rough idea to ready deck', 'in minutes, not hours']} />
      <p className="d2-sec-desc" data-reveal>
        Deck AI handles the structure, styling, and polish — you handle the story.
      </p>
      <div data-reveal>
        <Link href={studioHref()} className="d2-btn d2-btn-primary">
          try deck ai free
        </Link>
      </div>
    </section>
  )
}
