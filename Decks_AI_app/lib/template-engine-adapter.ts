import type { Block, DeckData, DeckSection } from './fixtures'
import type { Deck, Slide } from './template-engine/types'

/**
 * Where an engine slot's text came from: one app block, possibly only part of
 * it (a key-point "Lead: rest" is split into a bullet's title and text). An
 * edit writes `before + value + after` back to the block's content.
 */
export interface SlotSource {
  blockId: string
  before: string
  after: string
}

/** Per engine slide (same indexes as the deck), slot path → source block. */
export type SlotSources = Record<string, SlotSource>[]

/**
 * Maps the app's block-based DeckData onto the template engine's deck.json.
 * One app slide → one engine slide (cover first), so slide indexes line up
 * with PreviewPane's slideRefs / activeIndex. The engine picks each slide's
 * variant from the content; the app's layout only chooses the archetype.
 */
export function toEngineDeck(deck: DeckData, vl: string): Deck {
  return toEngineDeckWithSources(deck, vl).deck
}

/**
 * toEngineDeck plus, for every slide, which block each text slot
 * (`data-slot="content.…"` in the engine HTML) was drawn from — what inline
 * editing writes back to. Slots with no block behind them (the cover, card
 * values, a heading that falls back to the section title) are left out, the
 * same things the classic templates don't edit inline.
 */
export function toEngineDeckWithSources(deck: DeckData, vl: string): { deck: Deck; sources: SlotSources } {
  const built = deck.sections.map((s, i) => sectionSlide(s, i))
  return {
    deck: {
      id: `app-${hashString(deck.title)}`,
      version: 1,
      meta: { title: deck.title, subtitle: deck.subtitle || undefined, author: deck.author || undefined },
      design: { visual_language: vl, theme: { placeholders: false }, aspect: deck.aspectRatio === '4:3' ? '4:3' : '16:9' },
      slides: [coverSlide(deck), ...built.map(b => b.slide)],
    },
    sources: [{}, ...built.map(b => b.sources)],
  }
}

function coverSlide(deck: DeckData): Slide {
  return slide('cover', 'title', clean({ title: deck.title || 'Untitled deck', subtitle: deck.subtitle, byline: deck.author }))
}

interface Text { text: string; block: Block }

function sectionSlide(section: DeckSection, index: number): { slide: Slide; sources: Record<string, SlotSource> } {
  const of = (t: Block['type']): Text[] =>
    section.blocks.filter(b => b.type === t).map(block => ({ text: block.content.trim(), block })).filter(t => t.text)
  const heading = of('heading')[0]
  const title = heading?.text || section.title
  const paras = of('paragraph')
  const callouts = of('callout')
  const quotes = of('quote')
  const cards = section.blocks.filter(b => b.type === 'card-group').flatMap(b => b.cards ?? [])
  const imageBlock = section.blocks.find(b => b.type === 'image' && b.imageUrl)
  const image = imageBlock ? { src: imageBlock.imageUrl!, alt: imageBlock.alt ?? imageBlock.content } : undefined
  const id = section.id

  const sources: Record<string, SlotSource> = {}
  const from = (path: string, t: Text | undefined) => {
    if (t) sources[path] = { blockId: t.block.id, before: '', after: '' }
    return t?.text
  }
  if (heading) from('content.title', heading)
  const done = (archetype: string, content: Record<string, unknown>) => ({ slide: slide(id, archetype, clean(content)), sources })

  // The slide shape the copywriter chose at outline time wins; each branch
  // still checks the blocks can actually fill it, and anything they can't
  // falls through to inferring a shape from the blocks (older decks, the
  // classic flow, or content edited away from its shape).
  const pick = section.archetype

  if (pick === 'section' || (!pick && section.layout === 'divider'))
    return done('section', { number: String(index + 1).padStart(2, '0'), title, kicker: from('content.kicker', paras[0]), image })
  if (pick === 'closing' || (!pick && section.layout === 'closing'))
    return done('closing', { title, body: from('content.body', paras[0]), contact: from('content.contact', callouts[0]), image })

  if (pick === 'quote' ? quotes.length > 0 : quotes.length && !paras.length && !cards.length) {
    const attribution = callouts[0] ? from('content.attribution', callouts[0]) : section.title
    return done('quote', { quote: from('content.quote', quotes[0]), attribution, image })
  }

  if (cards.length && (pick === 'metric' || (!pick && (section.layout === 'data' || cards.every(c => /\d/.test(c.value) && c.value.length <= 12)))))
    return done('metric', {
      title,
      body: from('content.body', paras[0]),
      items: cards.map(c => ({ value: c.value, label: c.title })),
      source: from('content.source', callouts[0]),
    })

  if (cards.length)
    return done('bullets', { title, intro: from('content.intro', paras[0]), items: cards.map(c => clean({ title: c.title, text: c.value })) })

  if ((pick === 'bullets' || (!pick && section.layout === 'key-points')) && paras.length + callouts.length >= 2) {
    const items = [...paras, ...callouts].map((t, i) => {
      const lead = splitLead(t.text)
      if (!lead) return { title: from(`content.items[${i}].title`, t)! }
      sources[`content.items[${i}].title`] = { blockId: t.block.id, before: '', after: lead.titleAfter }
      sources[`content.items[${i}].text`] = { blockId: t.block.id, before: lead.textBefore, after: '' }
      return { title: lead.title, text: lead.text }
    })
    return done('bullets', { title, items })
  }

  const bodyFrom = paras.length ? paras : callouts.length ? callouts : quotes.slice(0, 1)
  const body = bodyFrom.length ? bodyFrom.map((t, i) => from(`content.body[${i}]`, t)!) : [section.title]
  const pullQuote = paras.length ? (callouts[0] ?? quotes[0]) : undefined
  return done('text', { title, body, pull_quote: from('content.pull_quote', pullQuote), image })
}

/**
 * "Lead: the rest" or "Lead. The rest" → a bullet with a short title and
 * supporting text, plus the surrounding text each part needs to rebuild the
 * original string when only one of them is edited.
 */
function splitLead(text: string): { title: string; text: string; titleAfter: string; textBefore: string } | null {
  const m = /^(.{3,70}?)(:\s+|\s+[—–-]\s+|\.\s+)([\s\S]+)$/.exec(text)
  if (!m) return null
  const title = m[1].trim()
  const rest = m[3].trim()
  return { title, text: rest, titleAfter: text.slice(title.length), textBefore: text.slice(0, text.length - rest.length) }
}

function slide(id: string, archetype: string, content: Record<string, unknown>): Slide {
  return { id, archetype, variant: null, ground: null, content }
}

/** Drops empty optional slots so the engine's capacity rules see only real content. */
function clean<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T
}

/**
 * Fingerprint of an engine deck — the backend computes the same one when it
 * compiles a freshly generated deck to HTML (Decks_AI_Service/src/render/
 * engineAdapter.ts mirrors this adapter). EngineDeck shows that server HTML
 * only while the fingerprints match, i.e. until an edit or a template switch,
 * after which it compiles locally. If the two adapters ever drift, the
 * fingerprints just stop matching and the client compiles — slower, never wrong.
 */
export function engineDeckKey(deck: Deck): string {
  return hashString(JSON.stringify(deck))
}

function hashString(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0).toString(36)
}
