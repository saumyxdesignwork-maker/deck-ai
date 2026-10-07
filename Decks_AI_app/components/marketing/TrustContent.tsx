'use client'

import { useEffect, useRef, useState } from 'react'
import { getTemplate } from '@/lib/deckTemplates'
import { SlideMock } from './SlideMock'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'

const meridian = getTemplate('meridian')

export function TrustContent() {
  const rootRef = useRef<HTMLElement>(null)
  const vslideRef = useRef<HTMLDivElement>(null)
  const [pulsing, setPulsing] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)
  useScrollReveals(rootRef)

  // No reduced-motion branch needed here: the global
  // `@media (prefers-reduced-motion: reduce)` rule in marketing.css already
  // disables the pulse/expand transitions, so this still opens the tip on
  // scroll-into-view, just without animating.
  useEffect(() => {
    let seen = false
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !seen) {
            seen = true
            setPulsing(true)
            setTimeout(() => setTipOpen(true), 900)
          }
        })
      },
      { threshold: 0.5 }
    )
    if (vslideRef.current) observer.observe(vslideRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={rootRef} className="m-block" id="trust" aria-labelledby="h-trust">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal>
          <Eyebrow>Trust</Eyebrow>
          <TypewriterHeading as="h2" id="h-trust">
            Grounded in your data, checked before you present.
          </TypewriterHeading>
        </div>

        <div className="m-trust3">
          <div data-reveal className="m-pillar">
            <h3>Verify content</h3>
            <p>Flags claims that need a second look, so you find the weak spot before your audience does.</p>
          </div>
          <div data-reveal className="m-pillar">
            <h3>Bring your own data</h3>
            <p>Connect Google Sheets, paste, or upload. Deck AI uses your real numbers instead of guessing.</p>
          </div>
          <div data-reveal className="m-pillar">
            <h3>History</h3>
            <p>Restore any version of your deck. Nothing you try is permanent.</p>
          </div>
        </div>

        <div className="m-verify">
          <div data-reveal>
            <div className="m-vslide" ref={vslideRef}>
              <SlideMock
                template={meridian}
                kind="cards"
                title="What the numbers say"
                cards={[
                  { value: '40%', label: 'faster onboarding' },
                  { value: '12.4k', label: 'active subscribers' },
                  { value: '2.1x', label: 'revenue growth' },
                ]}
              />
              <button
                type="button"
                className={`m-flag${pulsing ? ' pulse' : ''}`}
                aria-label="Verify content flag: needs a second look"
                aria-expanded={tipOpen}
                onClick={() => setTipOpen(o => !o)}
              >
                !
              </button>
            </div>
            <div className={`m-vtip${tipOpen ? ' open' : ''}`} role="status">
              <div>
                <b>Needs a second look.</b> &ldquo;40% faster onboarding&rdquo; isn&rsquo;t supported by the numbers in your connected sheet. Confirm
                the source or reword it.
              </div>
            </div>
          </div>

          <div data-reveal className="m-conn">
            <h3>Data connectors</h3>
            <div className="m-conn-row">
              <span className="m-ic" style={{ background: '#1e8e5a', color: '#fff' }}>
                S
              </span>
              <span className="m-nm">
                Google Sheets
                <small>Live numbers in your slides</small>
              </span>
              <span className="m-tag live">Available</span>
            </div>
            <div className="m-conn-row">
              <span className="m-ic" style={{ background: 'var(--accent)', color: '#fff' }}>
                ↑
              </span>
              <span className="m-nm">
                Paste or upload
                <small>Drop in a table or a file</small>
              </span>
              <span className="m-tag live">Available</span>
            </div>
            <div className="m-conn-row soon">
              <span className="m-ic" style={{ background: 'var(--surface-muted)' }}>
                D
              </span>
              <span className="m-nm">Docs</span>
              <span className="m-tag">Soon</span>
            </div>
            <div className="m-conn-row soon">
              <span className="m-ic" style={{ background: 'var(--surface-muted)' }}>
                #
              </span>
              <span className="m-nm">Slack</span>
              <span className="m-tag">Soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
