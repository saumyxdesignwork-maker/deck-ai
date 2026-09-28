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
