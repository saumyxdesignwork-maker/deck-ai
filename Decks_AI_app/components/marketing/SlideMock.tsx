import type { CSSProperties } from 'react'
import type { DeckTemplate } from '@/lib/deckTemplates'
import { resolveSlideVars, resolveCoverVars } from '@/lib/deckTemplates/toCssVars'
import './slideMock.css'

interface SlideMockBaseProps {
  template: DeckTemplate
  style?: CSSProperties
  className?: string
}

interface CoverSlideProps extends SlideMockBaseProps {
  kind: 'cover'
  title: string
  subtitle?: string
}

interface StatementSlideProps extends SlideMockBaseProps {
  kind: 'statement' | 'closing'
  title: string
  body?: string
}

interface CardsSlideProps extends SlideMockBaseProps {
  kind: 'cards'
  title: string
  cards: { value: string; label: string }[]
}

interface BarsSlideProps extends SlideMockBaseProps {
  kind: 'bars'
  title: string
  bars: number[]
}

type SlideMockProps = CoverSlideProps | StatementSlideProps | CardsSlideProps | BarsSlideProps

/**
 * A faithful miniature of a real generated slide — every color/font/radius
 * comes from the same `resolveSlideVars`/`resolveCoverVars` the actual deck
 * editor uses (lib/deckTemplates/toCssVars), so these marketing mockups are
 * never a separate invented palette. `cqw` units throughout (container
 * queries on `.m-slide`) keep type/spacing proportional at any mock size.
 */
export function SlideMock(props: SlideMockProps) {
  const { template, style, className } = props

  if (props.kind === 'cover') {
    const cover = template.surfaces.cover
    const bg =
      cover.kind === 'pattern'
        ? { backgroundColor: cover.background, backgroundImage: cover.pattern, backgroundSize: cover.patternSize }
        : { background: cover.background }
    return (
      <div
        className={`m-slide ${className ?? ''}`}
        style={{ ...resolveCoverVars(template), ...bg, color: cover.fg, borderRadius: template.surfaces.slideRadius, ...style }}
      >
        <div className="m-slide-in m-slide-cover">
          <span className="m-slide-title">{props.title}</span>
          {props.subtitle && <span className="m-slide-sub">{props.subtitle}</span>}
        </div>
      </div>
    )
  }

  const vars = resolveSlideVars(template)
  return (
    <div
      className={`m-slide ${className ?? ''}`}
      style={{ ...vars, background: template.colors.bg, color: template.colors.text, borderRadius: template.surfaces.slideRadius, ...style }}
    >
      <div className="m-slide-in">
        <span className="m-slide-h">{props.title}</span>
        {(props.kind === 'statement' || props.kind === 'closing') && props.body && <span className="m-slide-p">{props.body}</span>}
        {props.kind === 'cards' && (
          <div className="m-slide-cards">
            {props.cards.map((c, i) => (
              <div key={i} className="m-slide-card">
                <b>{c.value}</b>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        )}
        {props.kind === 'bars' && (
          <div className="m-slide-bars">
            {props.bars.map((h, i) => (
              <i
                key={i}
                style={{ height: `${h}%`, background: i === props.bars.length - 1 ? template.colors.chart[1] : template.colors.chart[0] }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
