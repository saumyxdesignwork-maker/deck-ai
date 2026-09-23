'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DeckData, DeckSection, Block, LayoutType } from './fixtures'

interface DeckEditorState {
  deck: DeckData | null
  past: DeckData[]
  future: DeckData[]
}

const MAX_HISTORY = 50

function storageKeyFor(sessionId: string) {
  return `deckai-edited-deck-${sessionId}`
}

function loadPersisted(sessionId: string | null): DeckData | null {
  if (!sessionId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKeyFor(sessionId))
    return raw ? (JSON.parse(raw) as DeckData) : null
  } catch {
    return null
  }
}

function persist(sessionId: string | null, deck: DeckData | null) {
  if (!sessionId || typeof window === 'undefined' || !deck) return
  try {
    window.localStorage.setItem(storageKeyFor(sessionId), JSON.stringify(deck))
  } catch {
    // Best-effort only (private window, full storage) — never break editing over this.
  }
}

function newBlockId() {
  return `bl-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function makeBlock(blockType: string): Block {
  if (blockType === 'card-group') {
    return { id: newBlockId(), type: 'card-group', content: '', cards: [{ icon: '✨', title: 'New Card', value: '—' }] }
  }
  const defaults: Record<string, string> = {
    heading: 'New Heading', paragraph: 'Start writing here…', callout: 'Add a callout note…', image: 'Image placeholder',
  }
  return { id: newBlockId(), type: blockType as Block['type'], content: defaults[blockType] ?? '' }
}

export function makeDefaultSection(): DeckSection {
  return {
    id: `ds-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: 'New Section',
    layout: 'key-points',
    thumbnailColor: '#F3F4F6',
    blocks: [
      { id: `bl-h-${Date.now()}`, type: 'heading', content: 'New Section' },
      { id: `bl-p-${Date.now()}`, type: 'paragraph', content: 'Start writing your content here…' },
    ],
  }
}

/**
 * Single source of truth for the editable deck. Mirrors the streamed deck
 * while generation is still in progress (no history, nothing editable yet);
 * the moment generation finishes it takes ownership exactly once — restoring
 * a per-session autosave if one exists — so later renders never clobber
 * local edits. Every structural mutation goes through here, so it's undoable.
 */
export function useDeckEditor(streamedDeck: DeckData | null, isDone: boolean, sessionId: string | null) {
  const [state, setState] = useState<DeckEditorState>({ deck: null, past: [], future: [] })
  const ownedRef = useRef(false)
  const pendingSnapshotRef = useRef<DeckData | null>(null)

  useEffect(() => {
    if (ownedRef.current) return
    if (streamedDeck) setState({ deck: streamedDeck, past: [], future: [] })
  }, [streamedDeck])

  useEffect(() => {
    if (!isDone || ownedRef.current) return
    ownedRef.current = true
    const restored = loadPersisted(sessionId)
    if (restored) setState({ deck: restored, past: [], future: [] })
  }, [isDone, sessionId])

  const applyMutation = useCallback(
    (mutate: (deck: DeckData) => DeckData) => {
      setState(prev => {
        if (!prev.deck) return prev
        const next = mutate(prev.deck)
        persist(sessionId, next)
        return { deck: next, past: [...prev.past, prev.deck].slice(-MAX_HISTORY), future: [] }
      })
    },
    [sessionId],
  )

  const undo = useCallback(() => {
    setState(prev => {
      if (!prev.past.length || !prev.deck) return prev
      const previous = prev.past[prev.past.length - 1]
      persist(sessionId, previous)
      return { deck: previous, past: prev.past.slice(0, -1), future: [prev.deck, ...prev.future] }
    })
  }, [sessionId])

  const redo = useCallback(() => {
    setState(prev => {
      if (!prev.future.length || !prev.deck) return prev
      const [next, ...rest] = prev.future
      persist(sessionId, next)
      return { deck: next, past: [...prev.past, prev.deck], future: rest }
    })
  }, [sessionId])

  const insertBlock = useCallback(
    (sectionIdx: number, blockType: string) => {
      applyMutation(deck => ({
        ...deck,
        sections: deck.sections.map((s, i) => (i === sectionIdx ? { ...s, blocks: [...s.blocks, makeBlock(blockType)] } : s)),
      }))
    },
    [applyMutation],
  )

  const insertSection = useCallback(
    (index: number) => {
      applyMutation(deck => {
        const sections = [...deck.sections]
        sections.splice(index, 0, makeDefaultSection())
        return { ...deck, sections }
      })
    },
    [applyMutation],
  )

  const deleteBlocks = useCallback(
    (blockIds: Set<string>) => {
      applyMutation(deck => ({ ...deck, sections: deck.sections.map(s => ({ ...s, blocks: s.blocks.filter(b => !blockIds.has(b.id)) })) }))
    },
    [applyMutation],
  )

  const duplicateBlocks = useCallback(
    (blockIds: Set<string>) => {
      applyMutation(deck => ({
        ...deck,
        sections: deck.sections.map(s => {
          const toDuplicate = s.blocks.filter(b => blockIds.has(b.id))
          if (!toDuplicate.length) return s
          const duplicates = toDuplicate.map(b => ({ ...b, id: newBlockId() }))
          return { ...s, blocks: [...s.blocks, ...duplicates] }
        }),
      }))
    },
    [applyMutation],
  )

  const setSectionLayout = useCallback(
    (sectionIdx: number, layout: LayoutType) => {
      applyMutation(deck => ({ ...deck, sections: deck.sections.map((s, i) => (i === sectionIdx ? { ...s, layout } : s)) }))
    },
    [applyMutation],
  )

  const applyRewrite = useCallback(
    (blockId: string, text: string) => {
      applyMutation(deck => ({
        ...deck,
        sections: deck.sections.map(s => ({ ...s, blocks: s.blocks.map(b => (b.id === blockId ? { ...b, content: text } : b)) })),
      }))
    },
    [applyMutation],
  )

  // Inline text editing: keystrokes update the deck live (so the field stays
  // controlled and responsive) without spamming undo history — the pre-edit
  // snapshot is captured once on focus and committed as ONE history entry
  // on blur, so "undo" reverts a whole editing pass, not one keystroke.
  const beginBlockEdit = useCallback(() => {
    setState(prev => {
      if (pendingSnapshotRef.current === null) pendingSnapshotRef.current = prev.deck
      return prev
    })
  }, [])

  const updateBlockContent = useCallback(
    (blockId: string, text: string) => {
      setState(prev => {
        if (!prev.deck) return prev
        const next = {
          ...prev.deck,
          sections: prev.deck.sections.map(s => ({ ...s, blocks: s.blocks.map(b => (b.id === blockId ? { ...b, content: text } : b)) })),
        }
        persist(sessionId, next)
        return { ...prev, deck: next }
      })
    },
    [sessionId],
  )

  const commitBlockEdit = useCallback(() => {
    setState(prev => {
      const snapshot = pendingSnapshotRef.current
      pendingSnapshotRef.current = null
      if (!snapshot || !prev.deck || snapshot === prev.deck) return prev
      return { deck: prev.deck, past: [...prev.past, snapshot].slice(-MAX_HISTORY), future: [] }
    })
  }, [])

  return {
    deck: state.deck,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undo,
    redo,
    insertBlock,
    insertSection,
    deleteBlocks,
    duplicateBlocks,
    setSectionLayout,
    applyRewrite,
    beginBlockEdit,
    updateBlockContent,
    commitBlockEdit,
  }
}

export type DeckEditor = ReturnType<typeof useDeckEditor>
