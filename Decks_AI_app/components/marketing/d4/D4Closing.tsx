import Link from 'next/link'
import { studioHref } from '../studioLink'

export function D4Closing() {
  return (
    <section className="d4-closing d4-wrap" data-theme="light" aria-labelledby="d4-close-h">
      <p className="d4-kicker" style={{ justifyContent: 'center' }}>
        <i>—</i>
        <span aria-hidden="true" />
        Colophon
      </p>
      <h2 id="d4-close-h" className="d4-display" data-reveal>
        Your next deck is one <em>sentence</em> away.
      </h2>
      <p className="d4-lede" data-reveal>
        Deck AI handles the structure, the styling, and the polish. You handle the story.
      </p>
      <div data-reveal>
        <Link href={studioHref()} className="d4-btn d4-btn-primary">
          Start your edition
        </Link>
      </div>
    </section>
  )
}
