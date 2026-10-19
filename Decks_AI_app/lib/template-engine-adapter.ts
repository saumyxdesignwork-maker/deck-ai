import type { Block, DeckData, DeckSection } from './fixtures'
import type { Deck, Slide } from './template-engine/types'

/**
 * Maps the app's block-based DeckData onto the template engine's deck.json.
 * One app slide → one engine slide (cover first), so slide indexes line up
 * with PreviewPane's slideRefs / activeIndex. The engine picks each slide's
 * variant from the content; the app's layout only chooses the archetype.
 */
export function toEngineDeck(deck: DeckData, vl: string): Deck {
  return {
    id: `app-${hashString(deck.title)}`,
    version: 1,
    meta: { title: deck.title, subtitle: deck.subtitle || undefined, author: deck.author || undefined },
    design: { visual_language: vl, theme: { placeholders: false }, aspect: deck.aspectRatio === '4:3' ? '4:3' : '16:9' },
    slides: [coverSlide(deck), ...deck.sections.map((s, i) => sectionSlide(s, i))],
  }
}

function coverSlide(deck: DeckData): Slide {
  return slide('cover', 'title', clean({ title: deck.title || 'Untitled deck', subtitle: deck.subtitle, byline: deck.author }))
}

function sectionSlide(section: DeckSection, index: number): Slide {
  const of = (t: Block['type']) => section.blocks.filter(b => b.type === t)
  const title = of('heading')[0]?.content.trim() || section.title
  const paras = of('paragraph').map(b => b.content.trim()).filter(Boolean)
  const callouts = of('callout').map(b => b.content.trim()).filter(Boolean)
  const quotes = of('quote').map(b => b.content.trim()).filter(Boolean)
  const cards = of('card-group').flatMap(b => b.cards ?? [])
  const imageBlock = of('image').find(b => b.imageUrl)
  const image = imageBlock ? { src: imageBlock.imageUrl!, alt: imageBlock.alt ?? imageBlock.content } : undefined
  const id = section.id

  switch (section.layout) {
    case 'divider':
      return slide(id, 'section', clean({ number: String(index + 1).padStart(2, '0'), title, kicker: paras[0], image }))
    case 'closing':
      return slide(id, 'closing', clean({ title, body: paras[0], contact: callouts[0], image }))
  }

  if (quotes.length && !paras.length && !cards.length)
    return slide(id, 'quote', clean({ quote: quotes[0], attribution: callouts[0] ?? section.title, image }))

  if (cards.length && (section.layout === 'data' || cards.every(c => /\d/.test(c.value) && c.value.length <= 12)))
    return slide(id, 'metric', clean({
      title,
      body: paras[0],
      items: cards.map(c => ({ value: c.value, label: c.title })),
      source: callouts[0],
    }))

  if (cards.length)
    return slide(id, 'bullets', clean({ title, intro: paras[0], items: cards.map(c => clean({ title: c.title, text: c.value })) }))

  if (section.layout === 'key-points' && paras.length + callouts.length >= 2) {
    const items = [...paras, ...callouts].map(splitLead)
    return slide(id, 'bullets', clean({ title, items }))
  }

  const body = paras.length ? paras : callouts.length ? callouts : [quotes[0] ?? section.title]
  return slide(id, 'text', clean({ title, body, pull_quote: paras.length ? (callouts[0] ?? quotes[0]) : undefined, image }))
}

/** "Lead: the rest" or "Lead. The rest" → a bullet with a short title and supporting text. */
function splitLead(text: string): { title: string; text?: string } {
  const m = /^(.{3,70}?)(?::\s+|\s+[—–-]\s+|\.\s+)([\s\S]+)$/.exec(text)
  if (m) return { title: m[1].trim(), text: m[2].trim() }
  return { title: text }
}

function slide(id: string, archetype: string, content: Record<string, unknown>): Slide {
  return { id, archetype, variant: null, ground: null, content }
}

/** Drops empty optional slots so the engine's capacity rules see only real content. */
function clean<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T
}

function hashString(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0).toString(36)
}
