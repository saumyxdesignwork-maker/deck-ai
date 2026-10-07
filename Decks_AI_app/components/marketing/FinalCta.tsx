'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from '@/lib/deckTemplates'
import { TypewriterHeading } from './TypewriterHeading'
import { useScrollReveals } from './motion/useScrollReveals'
import { studioHref } from './studioLink'

export function FinalCta() {
  const rootRef = useRef<HTMLElement>(null)
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID)
  useScrollReveals(rootRef)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(studioHref({ prompt: prompt.trim() || undefined, template: templateId }))
  }

  return (
    <section ref={rootRef} className="m-block m-final" aria-labelledby="h-final">
      <div className="m-wrap">
        <TypewriterHeading as="h2" id="h-final" data-reveal>
          Your next deck is one sentence away.
        </TypewriterHeading>
        <form className="m-final-form" data-reveal onSubmit={handleSubmit} autoComplete="off">
          <label htmlFor="finalPrompt" style={{ position: 'absolute', left: -9999 }}>
            Describe your deck
          </label>
          <input
            id="finalPrompt"
            type="text"
            placeholder="Describe your deck in a sentence"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          <label htmlFor="finalTpl" style={{ position: 'absolute', left: -9999 }}>
            Template
          </label>
          <select id="finalTpl" value={templateId} onChange={e => setTemplateId(e.target.value)}>
            {TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button type="submit" className="m-btn m-btn-primary" data-primary>
            Build my deck
          </button>
        </form>
      </div>
    </section>
  )
}
