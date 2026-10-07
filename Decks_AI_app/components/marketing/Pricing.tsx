'use client'

import { useRef } from 'react'
import { Check } from 'lucide-react'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'

/** Tier copy/features are placeholders — PRICING NOT YET PROVIDED. Replace
 * `price` and `features` with real figures before shipping; nothing here is
 * a real commitment yet, shown as "—" rather than an invented number. */
const TIERS = [
  { name: 'Free', price: '—', cadence: '', features: ['A few decks to try it', 'All 6 templates', 'Export to PDF'] },
  { name: 'Pro', price: '—', cadence: '/mo', features: ['Unlimited decks', 'PowerPoint & HTML export', 'Data connectors'], highlighted: true },
  { name: 'Team', price: '—', cadence: '/mo', features: ['Everything in Pro', 'Shared workspace', 'Priority support'] },
]

export function Pricing() {
  const rootRef = useRef<HTMLElement>(null)
  useScrollReveals(rootRef)

  return (
    <section ref={rootRef} className="m-block" id="pricing" aria-labelledby="h-pricing">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal style={{ textAlign: 'center', marginInline: 'auto' }}>
          <Eyebrow>Pricing</Eyebrow>
          <TypewriterHeading as="h2" id="h-pricing">
            Simple pricing
          </TypewriterHeading>
          <p className="m-lede" style={{ textAlign: 'center', marginInline: 'auto' }}>
            Pricing is being finalized — figures below are placeholders.
          </p>
        </div>

        <div className="m-pricing-grid">
          {TIERS.map(tier => (
            <div key={tier.name} data-reveal className="m-glass m-price-tier" style={tier.highlighted ? { borderColor: 'var(--accent)' } : undefined}>
              <h3>{tier.name}</h3>
              <div className="m-price-row">
                <b>{tier.price}</b>
                <span>{tier.cadence}</span>
              </div>
              <ul className="m-price-feats">
                {tier.features.map(f => (
                  <li key={f}>
                    <Check size={14} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
