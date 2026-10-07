'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { TEMPLATES, DEFAULT_TEMPLATE_ID, type DeckTemplate } from '@/lib/deckTemplates'
import { SlideMock } from './SlideMock'
import { Eyebrow } from './Eyebrow'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'
import { studioHref } from './studioLink'

const CORPORATE = TEMPLATES.filter(t => t.category === 'corporate')
const CREATIVE = TEMPLATES.filter(t => t.category === 'creative')

function TemplateButton({ template, active, onClick }: { template: DeckTemplate; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className="m-tpl-btn" aria-pressed={active} onClick={onClick}>
      <span className="m-sw">
        <i style={{ background: template.colors.bg }} />
        <i style={{ background: template.colors.accent }} />
        <i style={{ background: template.colors.text }} />
      </span>
      {template.name}
    </button>
  )
}

export function TemplateSwitcher() {
  const rootRef = useRef<HTMLElement>(null)
  const [activeId, setActiveId] = useState(DEFAULT_TEMPLATE_ID)
  const [swapping, setSwapping] = useState(false)
  useScrollReveals(rootRef)

  const active = TEMPLATES.find(t => t.id === activeId) ?? TEMPLATES[0]

  const pick = (id: string) => {
    if (id === activeId) return
    setSwapping(true)
    setTimeout(() => {
      setActiveId(id)
      setSwapping(false)
    }, 220)
  }

  return (
    <section ref={rootRef} className="m-block" id="templates" aria-labelledby="h-tpl">
      <div className="m-wrap">
        <div className="m-sec-head" data-reveal>
          <Eyebrow>Templates</Eyebrow>
          <TypewriterHeading as="h2" id="h-tpl">
            Six looks. Zero design work.
          </TypewriterHeading>
          <p className="m-lede">
            Corporate when it counts. Creative when it should be. Pick one and the whole deck restyles: palette, type, cards, and cover.
          </p>
        </div>

        <div className="m-tpl" data-reveal>
          <div className="m-tpl-side">
            <p className="m-grp">Corporate</p>
            <div className="m-tpl-list">
              {CORPORATE.map(t => (
                <TemplateButton key={t.id} template={t} active={t.id === activeId} onClick={() => pick(t.id)} />
              ))}
            </div>
            <p className="m-grp">Creative</p>
            <div className="m-tpl-list">
              {CREATIVE.map(t => (
                <TemplateButton key={t.id} template={t} active={t.id === activeId} onClick={() => pick(t.id)} />
              ))}
            </div>
          </div>

          <div>
            <div className={`m-tpl-stage${swapping ? ' swap' : ''}`}>
              <SlideMock template={active} kind="cover" title="Rise & Subscribe" subtitle="Fresh bread, on repeat. Seed pitch deck." />
              <SlideMock
                template={active}
                kind="cards"
                title="Subscribers doubled in six months"
                cards={[
                  { value: '12.4k', label: 'active subscribers' },
                  { value: '2.1x', label: 'revenue growth' },
                  { value: '94%', label: 'renew each month' },
                ]}
              />
            </div>
            <div className="m-swatches" aria-hidden="true">
              {[active.colors.bg, active.surfaces.card.bg, active.colors.textMuted, active.colors.accent, active.colors.chart[1], active.colors.text].map(
                (c, i) => (
                  <i key={i} style={{ background: c }} />
                )
              )}
            </div>
            <div className="m-tpl-meta">
              <h3>{active.name}</h3>
              <p>{active.blurb}</p>
              <Link href={studioHref({ template: active.id })} className="m-btn m-btn-primary" data-primary>
                Start with {active.name}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
