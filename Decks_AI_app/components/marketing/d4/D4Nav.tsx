import Link from 'next/link'
import { studioHref } from '../studioLink'

/** Fixed editorial masthead. No scroll-state background of its own — it
 * just inherits the page's current theme colour, so it inverts along with
 * everything else as sections pass (see motion/useThemeSwitch.ts). */
export function D4Nav() {
  return (
    <header className="d4-nav">
      <Link href="#d4-top" className="d4-wordmark" aria-label="Deck AI home">
        Deck <i>ai</i>
      </Link>
      <Link href={studioHref()} className="d4-nav-cta">
        Start your edition
      </Link>
    </header>
  )
}
