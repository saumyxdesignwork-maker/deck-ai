// Mirrors Decks_AI_app/lib/fixtures.ts — keep these two files in sync by hand.
// (The two repos aren't an npm workspace, so types can't be shared directly.)

export type LayoutType = 'statement' | 'key-points' | 'heading-media' | 'media-text' | 'bento' | 'data'
export type AspectRatio = '16:9' | '4:3'

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
}
