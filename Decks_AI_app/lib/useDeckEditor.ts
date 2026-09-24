'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DeckData, DeckSection, Block, LayoutType } from './fixtures'
import { changedBlockIds, ChangeHighlight } from './deckDiff'

interface DeckEditorState {
  deck: DeckData | null
  past: DeckData[]
  future: DeckData[]
}

/** A named, timestamped snapshot for the History panel — an append-only log
 * of "what changed", distinct from the past/future undo stack (which undo
 * consumes as you step through it; this never shrinks except at the cap). */
export interface DeckHistoryEntry {
  id: string
  label: string
  timestamp: string
  deck: DeckData
}

const MAX_HISTORY = 50

function newHistoryId() {
  return `hist-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

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
  // Which blocks the latest EXTERNAL change (agent edit / AI rewrite)
  // altered — drives a brief "changed" cue on just those blocks. Never set by
  // the user's own typing, undo, or redo.
  const [highlight, setHighlight] = useState<ChangeHighlight | null>(null)
  const [history, setHistory] = useState<DeckHistoryEntry[]>([])
  const ownedRef = useRef(false)
  const pendingSnapshotRef = useRef<DeckData | null>(null)
  // Mirrors state.deck so applyMutation can read the pre-mutation deck
  // without going through setState's updater (needed to also snapshot the
  // post-mutation deck into `history` in the same call).
  const deckRef = useRef<DeckData | null>(null)
  useEffect(() => {
    deckRef.current = state.deck
  }, [state.deck])

  const logHistory = useCallback((label: string, deck: DeckData) => {
    setHistory(prev => [...prev, { id: newHistoryId(), label, timestamp: new Date().toISOString(), deck }].slice(-MAX_HISTORY))
  }, [])

  useEffect(() => {
    if (ownedRef.current) return
    if (streamedDeck) setState({ deck: streamedDeck, past: [], future: [] })
  }, [streamedDeck])

  useEffect(() => {
    if (!isDone || ownedRef.current) return
    ownedRef.current = true
    const restored = loadPersisted(sessionId)
    if (restored) {
      setState({ deck: restored, past: [], future: [] })
      logHistory('Restored your last session', restored)
    } else if (streamedDeck) {
      logHistory('Initial draft', streamedDeck)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, sessionId])

  const applyMutation = useCallback(
    (mutate: (deck: DeckData) => DeckData, label: string) => {
      const current = deckRef.current
      if (!current) return
      const next = mutate(current)
      persist(sessionId, next)
      setState(prev => ({ deck: next, past: [...prev.past, current].slice(-MAX_HISTORY), future: [] }))
      logHistory(label, next)
    },
    [sessionId, logHistory],
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
      }), `Added a ${blockType.replace('-', ' ')} block`)
    },
    [applyMutation],
  )

  const insertSection = useCallback(
    (index: number) => {
      applyMutation(deck => {
        const sections = [...deck.sections]
        sections.splice(index, 0, makeDefaultSection())
        return { ...deck, sections }
      }, 'Added a new slide')
    },
    [applyMutation],
  )

  const deleteBlocks = useCallback(
    (blockIds: Set<string>) => {
      applyMutation(
        deck => ({ ...deck, sections: deck.sections.map(s => ({ ...s, blocks: s.blocks.filter(b => !blockIds.has(b.id)) })) }),
        `Deleted ${blockIds.size} block${blockIds.size === 1 ? '' : 's'}`,
      )
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
      }), `Duplicated ${blockIds.size} block${blockIds.size === 1 ? '' : 's'}`)
    },
    [applyMutation],
  )

  const setSectionLayout = useCallback(
    (sectionIdx: number, layout: LayoutType) => {
      applyMutation(
        deck => ({ ...deck, sections: deck.sections.map((s, i) => (i === sectionIdx ? { ...s, layout } : s)) }),
        `Changed layout to ${layout.replace('-', ' ')}`,
      )
    },
    [applyMutation],
  )

  const applyRewrite = useCallback(
    (blockId: string, text: string) => {
      applyMutation(deck => ({
        ...deck,
        sections: deck.sections.map(s => ({ ...s, blocks: s.blocks.map(b => (b.id === blockId ? { ...b, content: text } : b)) })),
      }), 'Rewrote a block')
      setHighlight({ ids: new Set([blockId]), key: Date.now() })
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
      logHistory('Edited text', prev.deck)
      return { deck: prev.deck, past: [...prev.past, snapshot].slice(-MAX_HISTORY), future: [] }
    })
  }, [logHistory])

  // Adopts a whole deck returned by an agent edit (POST /edit) as ONE
  // undoable step — Cmd+Z reverts the entire edit, not each operation it
  // applied. Distinct from the streamedDeck mirror effect above: that one
  // only runs pre-ownership (first draft), this runs any time post-ownership.
  const applyExternalDeck = useCallback(
    (next: DeckData, label = 'Agent edit') => {
      const ids = changedBlockIds(state.deck, next)
      applyMutation(() => next, label)
      if (ids.size) setHighlight({ ids, key: Date.now() })
    },
    [applyMutation, state.deck],
  )

  // Jumps the deck straight to an earlier snapshot — logged as a new entry
  // (never rewrites history), same as a real version-control revert.
  const restoreToHistoryPoint = useCallback(
    (id: string) => {
      const entry = history.find(h => h.id === id)
      const current = deckRef.current
      if (!entry || !current) return
      persist(sessionId, entry.deck)
      setState(prev => ({ deck: entry.deck, past: [...prev.past, current].slice(-MAX_HISTORY), future: [] }))
      logHistory(`Restored: ${entry.label}`, entry.deck)
    },
    [history, sessionId, logHistory],
  )

  return {
    deck: state.deck,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undo,
    redo,
    history,
    restoreToHistoryPoint,
    insertBlock,
    insertSection,
    deleteBlocks,
    duplicateBlocks,
    setSectionLayout,
    applyRewrite,
    beginBlockEdit,
    updateBlockContent,
    commitBlockEdit,
    applyExternalDeck,
    highlight,
  }
}

export type DeckEditor = ReturnType<typeof useDeckEditor>
