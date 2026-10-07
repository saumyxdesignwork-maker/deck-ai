'use client'

import Link from 'next/link'
import { studioHref } from './studioLink'

export function MarketingNav() {
  return (
    <header className="m-nav">
      <div className="m-wrap">
        <nav className="m-nav-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#templates">Templates</a>
          <a href="#trust">Trust</a>
          <a href="#faq">FAQ</a>
        </nav>

        <Link href="#top" className="m-brand" aria-label="Deck AI home">
          <svg viewBox="0 0 26 26" width="22" height="22" aria-hidden="true">
            <rect x="1" y="1" width="24" height="24" rx="7" fill="var(--accent)" />
            <rect x="6" y="7" width="14" height="3" rx="1.5" fill="#fff" />
            <rect x="6" y="12" width="9" height="3" rx="1.5" fill="#fff" opacity="0.8" />
            <rect x="6" y="17" width="12" height="3" rx="1.5" fill="#fff" opacity="0.6" />
          </svg>
          Deck AI
        </Link>

        <div className="m-nav-ctas">
          <a
            href="#how"
            className="m-btn m-btn-ghost m-btn-sm"
            onClick={e => {
              e.preventDefault()
              document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            See how it works
          </a>
          <Link href={studioHref()} className="m-btn m-btn-primary m-btn-sm" data-primary>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
