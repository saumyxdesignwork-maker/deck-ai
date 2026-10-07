'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { studioHref } from '../studioLink'

export function D2Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`d2-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="d2-wrap">
        <nav className="d2-nav-links" aria-label="Sections">
          <a href="#d2-how">how it works</a>
          <a href="#d2-features">features</a>
          <a href="#d2-faq">faq</a>
        </nav>

        <Link href="#d2-top" className="d2-brand" aria-label="Deck AI home">
          Deck AI
        </Link>

        <div className="d2-nav-cta">
          <Link href={studioHref()}>get started</Link>
        </div>
      </div>
    </header>
  )
}
