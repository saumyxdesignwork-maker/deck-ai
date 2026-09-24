import { describe, expect, it } from 'vitest'
import { changedBlockIds, COVER_SUBTITLE_ID, COVER_TITLE_ID } from './deckDiff'
import { motionPresets, DUR } from './motion'
import type { DeckData } from './fixtures'

const deck = (over: Partial<DeckData> = {}): DeckData => ({
  title: 'Q3 review',
  subtitle: 'Where we are',
  author: 'QA',
  coverColor: '#000',
  sections: [
    {
      id: 's1', title: 'One', layout: 'key-points', thumbnailColor: '#fff',
      blocks: [
        { id: 'b1', type: 'heading', content: 'One' },
        { id: 'b2', type: 'paragraph', content: 'Alpha' },
      ],
    },
  ],
  ...over,
})

describe('changedBlockIds', () => {
  it('reports only blocks whose content changed', () => {
    const prev = deck()
    const next = deck({ sections: [{ ...prev.sections[0], blocks: [prev.sections[0].blocks[0], { id: 'b2', type: 'paragraph', content: 'Beta' }] }] })
    expect([...changedBlockIds(prev, next)]).toEqual(['b2'])
  })

  it('excludes brand-new blocks (they get an entrance instead) and removed ones', () => {
    const prev = deck()
    const next = deck({ sections: [{ ...prev.sections[0], blocks: [prev.sections[0].blocks[0], { id: 'b3', type: 'callout', content: 'New' }] }] })
    expect(changedBlockIds(prev, next).size).toBe(0)
  })

  it('flags cover title/subtitle with their pseudo ids', () => {
    const ids = changedBlockIds(deck(), deck({ title: 'Q3 in review', subtitle: 'Where we are' }))
    expect(ids.has(COVER_TITLE_ID)).toBe(true)
    expect(ids.has(COVER_SUBTITLE_ID)).toBe(false)
  })

  it('treats a layout-only change as no block change', () => {
    const prev = deck()
    const next = deck({ sections: [{ ...prev.sections[0], layout: 'bento' }] })
    expect(changedBlockIds(prev, next).size).toBe(0)
  })
})

describe('motionPresets', () => {
  it('uses the agreed short timings with no overshoot', () => {
    const m = motionPresets(false)
    expect(DUR.control).toBeGreaterThanOrEqual(0.1)
    expect(DUR.control).toBeLessThanOrEqual(0.16)
    expect(DUR.overlay).toBeGreaterThanOrEqual(0.18)
    expect(DUR.overlay).toBeLessThanOrEqual(0.24)
    expect(DUR.morph).toBeGreaterThanOrEqual(0.24)
    expect(DUR.morph).toBeLessThanOrEqual(0.3)
    expect(m.morph).toMatchObject({ duration: DUR.morph })
    expect(m.morph).not.toHaveProperty('type', 'spring')
    expect(m.rise).toBeGreaterThan(0)
  })

  it('reduced motion removes travel and duration but keeps the state change', () => {
    const m = motionPresets(true)
    expect(m.rise).toBe(0)
    for (const t of [m.control, m.menu, m.content, m.overlay, m.morph]) expect(t).toEqual({ duration: 0 })
    expect(m.arrive.initial).toEqual({ opacity: 0, y: 0 })
    expect(m.arrive.animate).toEqual({ opacity: 1, y: 0 })
  })
})
