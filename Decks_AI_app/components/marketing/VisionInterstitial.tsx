import { TypewriterHeading } from './TypewriterHeading'

/** The beat Henry's hero-to-logo scroll mask lands on: a full-viewport,
 * centered moment that pivots from "here's the chaos" to "here's the
 * platform." We don't have photoreal assets to mask into, so this is a
 * plain centered composition — the glowing mark + one statement — rather
 * than a fabricated clip-path transition. */
export function VisionInterstitial() {
  return (
    <section className="m-vision" aria-label="Deck AI">
      <svg className="m-vision-wireframe" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <polyline points="400,80 460,260 620,260 500,360 540,520 400,420 260,520 300,360 180,260 340,260" fill="none" stroke="var(--border)" strokeWidth="1" />
      </svg>
      <svg className="m-vision-mark" viewBox="0 0 26 26" aria-hidden="true">
        <defs>
          <linearGradient id="vision-mark-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="24" height="24" rx="7" fill="url(#vision-mark-gradient)" />
        <rect x="6" y="7" width="14" height="3" rx="1.5" fill="#101010" />
        <rect x="6" y="12" width="9" height="3" rx="1.5" fill="#101010" opacity="0.8" />
        <rect x="6" y="17" width="12" height="3" rx="1.5" fill="#101010" opacity="0.6" />
      </svg>
      <TypewriterHeading as="h2">One sentence in. A finished deck out.</TypewriterHeading>
    </section>
  )
}
