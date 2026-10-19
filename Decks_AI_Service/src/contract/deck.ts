// Mirrors Decks_AI_app/lib/fixtures.ts — keep these two files in sync by hand.
// (The two repos aren't an npm workspace, so types can't be shared directly.)

export type LayoutType =
  | 'statement' | 'key-points' | 'heading-media' | 'media-text' | 'bento' | 'data'
  // Added for the deck template system — see LAYOUT_RULES below for what
  // each one is expected to contain.
  | 'divider' | 'two-column' | 'closing'
export type AspectRatio = '16:9' | '4:3'

/** What each layout's blocks should contain, in one shared sentence per
 * layout — injected into the copywriter's expandDeck prompt per section
 * (Decks_AI_Service/src/tiers/copywriter.ts) so the model has a concrete
 * target instead of guessing from the layout name alone. Deliberately not
 * per-template: every template renders every layout, so the CONTENT shape
 * a layout implies must stay the same regardless of which template a user
 * eventually views it in. */
export const LAYOUT_RULES: Record<LayoutType, string> = {
  statement: 'a short, punchy heading as the main statement, optionally one supporting paragraph — no more.',
  'key-points': 'a heading followed by 2-4 short paragraph or callout blocks, one idea each.',
  'heading-media': 'a heading, one image block (the visual anchor), and 1-2 short paragraphs.',
  'media-text': 'a heading, one image block, and 1-2 short paragraphs describing it.',
  bento: 'a heading plus one card-group (2-4 short cards) for a compact grid of related items.',
  data: 'a heading, one card-group of 2-4 numeric stats, and optionally one callout citing the source.',
  divider: 'ONLY a short heading naming the next section, and optionally one brief supporting paragraph — never an image or card-group; this is a section break, not content.',
  'two-column': 'a heading followed by exactly two paragraph or card-group blocks meant to sit side by side (e.g. two options, before/after, pros/cons).',
  closing: 'a heading (the closing statement), one short paragraph making the ask/call-to-action, and optionally one callout reinforcing it — never an image.',
}

/** The template engine's slide shapes the AI can pick per slide (the cover is
 * always the engine's `title` archetype). Chosen at outline time, then
 * expandDeck writes each slide's blocks to fit it, and the engine compiles
 * slide + selected template into HTML. Only the shapes today's block model can
 * express cleanly — timeline, comparison, people, table and chart need content
 * fields blocks don't have yet. */
export const ARCHETYPES = ['text', 'bullets', 'metric', 'quote', 'section', 'closing'] as const
export type Archetype = (typeof ARCHETYPES)[number]

/** What each archetype's blocks must contain — injected per slide into the
 * expandDeck prompt, the same way LAYOUT_RULES is, so the content arrives
 * already shaped for the slide it fills instead of being guessed at render
 * time. Kept in step with the block→slot mapping in
 * render/engineAdapter.ts (and its mirror Decks_AI_app/lib/template-engine-adapter.ts). */
export const ARCHETYPE_RULES: Record<Archetype, string> = {
  text: 'a heading, then 1-3 paragraph blocks of prose (one idea each); optionally one short callout used as a pull quote, and one image.',
  bullets: 'a heading, optionally one short intro paragraph, then ONE card-group of 3-6 cards — each card a short point as the title and a one-line explanation as the value (icon: one emoji).',
  metric: 'a heading, optionally one short paragraph of context, then ONE card-group of 2-4 cards where each value is a number/stat (e.g. "94%", "$2.4M", "3×") and each title is what it measures; optionally one callout naming the source.',
  quote: 'ONLY one quote block (a single memorable sentence) and one callout naming who said it — no heading, paragraphs or cards.',
  section: 'ONLY a short heading naming the chapter, and optionally one brief paragraph as its kicker — this is a chapter break, not content.',
  closing: 'a heading (the closing statement), one short paragraph making the ask or call to action, and optionally one callout with contact details or a next step — never an image or cards.',
}

/** The layout an archetype implies, so layout-driven code (the classic
 * templates, LAYOUT_RULES, the planner's set-layout op) stays consistent with
 * the slide's shape. */
export const ARCHETYPE_LAYOUT: Record<Archetype, LayoutType> = {
  text: 'statement',
  bullets: 'key-points',
  metric: 'data',
  quote: 'statement',
  section: 'divider',
  closing: 'closing',
}

/** Inverse of ARCHETYPE_LAYOUT for when a layout is changed directly (the
 * planner's set-layout op): the slide shape that layout best implies. */
export function archetypeForLayout(layout: LayoutType): Archetype {
  switch (layout) {
    case 'divider': return 'section'
    case 'closing': return 'closing'
    case 'data': return 'metric'
    case 'key-points':
    case 'bento': return 'bullets'
    default: return 'text'
  }
}

/** The Studio creation screen's Professional / Creative choice. */
export type DeckStyle = 'professional' | 'creative'

/** One prompt line describing the chosen style, shared by every tier that
 * writes or directs content so the choice is applied consistently. */
export function styleGuidance(style: DeckStyle): string {
  return style === 'creative'
    ? 'Requested style: Creative — vivid, expressive language with a distinct voice and memorable phrasing; bolder structure and visual direction are welcome, but stay accurate and never invent facts.'
    : 'Requested style: Professional — measured, precise, evidence-led language; restrained wording and a conventional, easy-to-scan structure.'
}

export interface BlockCard {
  icon: string
  title: string
  value: string
}

export interface Block {
  id: string
  type: 'heading' | 'paragraph' | 'card-group' | 'image' | 'callout' | 'quote'
  content: string
  cards?: BlockCard[]
  /** Real generated asset URL (served from this backend's /assets route). */
  imageUrl?: string
  alt?: string
}

export interface DeckSection {
  id: string
  title: string
  layout: LayoutType
  /** The template-engine slide shape picked at outline time (see ARCHETYPES).
   * Optional: decks generated before this existed, and the classic flow,
   * leave it out and fall back to inferring the shape from the blocks. */
  archetype?: Archetype
  blocks: Block[]
  thumbnailColor: string
}

export interface DeckData {
  title: string
  subtitle: string
  author: string
  coverColor: string
  sections: DeckSection[]
  /** Echoes the ratio the user picked in Studio's "Auto Ratio" control —
   * also fed to the Designer tier's image generation so images match. */
  aspectRatio: AspectRatio
  /** The deck template driving colors/type/surfaces for every slide (see
   * Decks_AI_app/lib/deckTemplates). Optional so decks generated before
   * this field existed still parse — the frontend's getTemplate() falls
   * back to the default template for undefined/unknown ids. */
  templateId?: string
}
