import Link from 'next/link'
import { D2CornerMarkers } from './D2CornerMarkers'

export function D2BottomCards() {
  return (
    <section className="d2-wrap d2-block">
      <div className="d2-bottom-cards">
        <div className="d2-bottom-card" data-reveal>
          <D2CornerMarkers />
          <h3>what&apos;s new</h3>
          <p>Multi-select Ask AI — edit several slides in one sentence, and a reworked present mode that scales uniformly to any screen.</p>
          <Link href="#d2-top" className="d2-btn d2-btn-ghost">
            see the changes <span className="d2-arrow">→</span>
          </Link>
        </div>
        <div className="d2-bottom-card" data-reveal>
          <D2CornerMarkers />
          <h3>the deck ai story</h3>
          <p>Built because the gap between a rough idea and a deck worth sending was always busywork, not creativity.</p>
          <Link href="#d2-top" className="d2-btn d2-btn-ghost">
            read more <span className="d2-arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
