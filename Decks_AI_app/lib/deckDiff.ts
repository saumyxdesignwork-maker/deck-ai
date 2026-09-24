import type { Block, DeckData } from './fixtures'

/** Pseudo block ids for the cover's title/subtitle (they live on the deck,
 * not in `sections`) — same ids the backend planner uses. */
export const COVER_TITLE_ID = 'cover-title'
export const COVER_SUBTITLE_ID = 'cover-subtitle'

function sameBlock(a: Block, b: Block): boolean {
  return (
    a.type === b.type &&
    a.content === b.content &&
    a.imageUrl === b.imageUrl &&
    JSON.stringify(a.cards ?? null) === JSON.stringify(b.cards ?? null)
  )
}

/**
 * Ids of blocks whose content an external change (agent edit, AI rewrite)
 * actually altered — so only those get a "changed" cue on the canvas.
 * Blocks that are new in `next` are excluded: they get an entrance instead.
 * Removed blocks have nothing left to highlight.
 */
export function changedBlockIds(prev: DeckData | null, next: DeckData): Set<string> {
  const changed = new Set<string>()
  if (!prev) return changed
  const before = new Map<string, Block>()
  for (const s of prev.sections) for (const b of s.blocks) before.set(b.id, b)
  for (const s of next.sections) {
    for (const b of s.blocks) {
      const old = before.get(b.id)
      if (old && !sameBlock(old, b)) changed.add(b.id)
    }
  }
  if (prev.title !== next.title) changed.add(COVER_TITLE_ID)
  if (prev.subtitle !== next.subtitle) changed.add(COVER_SUBTITLE_ID)
  return changed
}

export interface ChangeHighlight {
  ids: Set<string>
  /** Changes on every new highlight so the cue replays even for the same ids. */
  key: number
}
