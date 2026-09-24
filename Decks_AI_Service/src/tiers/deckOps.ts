// Pure structural operations over DeckData for the /edit pipeline's Editor
// step. Mirrors the shapes Decks_AI_app/lib/useDeckEditor.ts's mutators
// produce client-side (same default block content, same "append if no
// afterBlockId" semantics) so an agent edit looks identical to a manual one.

import { newId } from '../lib/ids.js'
import type { DeckData, DeckSection, Block, LayoutType } from '../contract/deck.js'
import type { Op } from './planner.js'
import { COVER_SECTION_ID, COVER_TITLE_BLOCK_ID, COVER_SUBTITLE_BLOCK_ID } from './planner.js'

const BLOCK_DEFAULTS: Partial<Record<Block['type'], string>> = {
  heading: 'New Heading',
  paragraph: 'Start writing here…',
  callout: 'Add a callout note…',
  image: 'Image placeholder',
}

/** `content` is the Coordinator's real copy for this block (required for
 * everything but images) — falls back to a generic placeholder only if the
 * plan omitted it, which should be rare. */
export function makeBlock(blockType: Block['type'], content?: string): Block {
  if (blockType === 'card-group') {
    return { id: newId('bl'), type: 'card-group', content: content ?? '', cards: [{ icon: '✨', title: 'New Card', value: '—' }] }
  }
  return { id: newId('bl'), type: blockType, content: content ?? BLOCK_DEFAULTS[blockType] ?? '' }
}

export function applyAddBlock(deck: DeckData, op: Extract<Op, { kind: 'add-block' }>): DeckData {
  return {
    ...deck,
    sections: deck.sections.map(s => {
      if (s.id !== op.sectionId) return s
      const block = makeBlock(op.blockType, op.content)
      if (!op.afterBlockId) return { ...s, blocks: [...s.blocks, block] }
      const idx = s.blocks.findIndex(b => b.id === op.afterBlockId)
      if (idx === -1) return { ...s, blocks: [...s.blocks, block] }
      const blocks = [...s.blocks]
      blocks.splice(idx + 1, 0, block)
      return { ...s, blocks }
    }),
  }
}

export function applyDeleteBlock(deck: DeckData, op: Extract<Op, { kind: 'delete-block' }>): DeckData {
  return { ...deck, sections: deck.sections.map(s => ({ ...s, blocks: s.blocks.filter(b => b.id !== op.blockId) })) }
}

export function applyReorderSection(deck: DeckData, op: Extract<Op, { kind: 'reorder-section' }>): DeckData {
  const idx = deck.sections.findIndex(s => s.id === op.sectionId)
  if (idx === -1) return deck
  const sections = [...deck.sections]
  const [section] = sections.splice(idx, 1)
  const toIndex = Math.max(0, Math.min(op.toIndex, sections.length))
  sections.splice(toIndex, 0, section)
  return { ...deck, sections }
}

export function applySetLayout(deck: DeckData, op: Extract<Op, { kind: 'set-layout' }>): DeckData {
  return { ...deck, sections: deck.sections.map(s => (s.id === op.sectionId ? { ...s, layout: op.layout as LayoutType } : s)) }
}

/** True if a block/section id referenced by `op` still exists in `deck` —
 * lets the Editor step skip/flag an op whose target vanished (e.g. two ops
 * targeting the same just-deleted block) instead of silently no-oping. */
export function opTargetExists(deck: DeckData, op: Op): boolean {
  switch (op.kind) {
    case 'rewrite':
      if (op.blockId === COVER_TITLE_BLOCK_ID || op.blockId === COVER_SUBTITLE_BLOCK_ID) return true
      return deck.sections.some(s => s.blocks.some(b => b.id === op.blockId))
    case 'delete-block':
      return deck.sections.some(s => s.blocks.some(b => b.id === op.blockId))
    case 'add-block':
    case 'reorder-section':
    case 'set-layout':
      if (op.sectionId === COVER_SECTION_ID) return false // cover has no add-block/reorder/layout ops
      return deck.sections.some((s: DeckSection) => s.id === op.sectionId)
  }
}
