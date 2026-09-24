'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatItem, ChatItemPatch, ClarifyQuestion, OutlineSection, VerifyFlag } from './studioScript'
import { AspectRatio, DeckData } from './fixtures'
import { StreamEvent } from './streamEvents'
import { fetchStream, postJson, DeckServiceError } from './deckStream'
import { CURRENT_USER } from './identity'
import { useDeckEditor } from './useDeckEditor'
import { DeckDataset } from './dataset'

export type PreviewState = 'idle' | 'preparing' | 'thumbs' | 'done'

// Error codes that end the session with nothing left to resume — these get
// a visible chat message. Everything else (*_FALLBACK codes from a degraded
// model call) is a soft error the pipeline already recovered from.
const HARD_ERROR_CODES = new Set(['SESSION_NOT_FOUND', 'NO_STORYLINE', 'PIPELINE_ERROR'])

let uid = 0
function nextId(prefix: string) {
  uid += 1
  return `${prefix}-${uid}`
}

// Chat items can be nested one level inside a 'group' (chain-of-thought
// container) — these helpers find/patch/append by id regardless of nesting.
function patchItemRecursive(item: ChatItem, id: string, patch: ChatItemPatch): ChatItem {
  if (item.id === id) return { ...item, ...patch } as ChatItem
  if (item.type === 'group') {
    return { ...item, children: item.children.map(child => patchItemRecursive(child, id, patch)) }
  }
  return item
}

function pushToGroup(items: ChatItem[], groupId: string, child: ChatItem): ChatItem[] {
  return items.map(it => (it.id === groupId && it.type === 'group' ? { ...it, children: [...it.children, child] } : it))
}

export function useStudioSession(initialPrompt: string, aspectRatio: AspectRatio) {
  const [items, setItems] = useState<ChatItem[]>([
    { id: nextId('user'), type: 'user', text: initialPrompt },
  ])
  const [previewState, setPreviewState] = useState<PreviewState>('idle')
  const [revealedSlides, setRevealedSlides] = useState<number[]>([])
  const [streamedDeck, setStreamedDeck] = useState<DeckData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(true)
  const [clarifyPending, setClarifyPending] = useState<{ id: string; questions: ClarifyQuestion[] } | null>(null)
  const [outlinePending, setOutlinePending] = useState<{ id: string; sections: OutlineSection[] } | null>(null)
  const [verifyFlags, setVerifyFlags] = useState<VerifyFlag[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [dataset, setDataset] = useState<DeckDataset | null>(null)
  const [isAttachingDataset, setIsAttachingDataset] = useState(false)

  const isDone = previewState === 'done'
  const deckEditor = useDeckEditor(streamedDeck, isDone, sessionId)

  const sessionIdRef = useRef<string | null>(null)
  // Data-connect nudge is a standalone call-to-action (see DataNudgeCard),
  // not part of the backend protocol — injected client-side exactly once,
  // alongside the first clarify gate, never repeated on /regenerate etc.
  const hasNudgedRef = useRef(false)

  // While an agent edit (/edit) is in flight, the streamed `deck` event is
  // the whole edited deck coming back from the Editor tier — it must land as
  // ONE undoable step via deckEditor.applyExternalDeck, not through the
  // pre-ownership streamedDeck mirror (which would just get discarded once
  // useDeckEditor already owns the deck). A ref (not state) because
  // applyEvent is a stable useCallback with an empty dep array.
  const isEditingRef = useRef(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editGroupId, setEditGroupId] = useState<string | null>(null)
  // True when the latest /edit run ended without completing (hard error,
  // network failure, or the stream closing before `done`) — lets the status
  // chips show an honest "Failed" instead of guessing from message text.
  const [editFailed, setEditFailed] = useState(false)

  // applyEvent (below) is a stable useCallback with an empty dep array — it
  // reaches deckEditor.applyExternalDeck through this ref (kept current
  // every render) rather than closing over it directly, since useDeckEditor
  // returns a fresh object each render and a stale closure would end up
  // bound to whatever sessionId was in scope when applyEvent was created.
  const deckEditorRef = useRef(deckEditor)
  useEffect(() => {
    deckEditorRef.current = deckEditor
  })

  const applyEvent = useCallback((event: StreamEvent) => {
    switch (event.t) {
      case 'session':
        sessionIdRef.current = event.sessionId
        setSessionId(event.sessionId)
        break
      case 'chat':
        // The first `group` item of an /edit run is the live agent-progress
        // container the floating popup renders — capture its id so it can
        // find that item in `items` (the group id itself is server-random,
        // unlike /generate's fixed 'group-analyze'/'group-slides').
        if (isEditingRef.current && event.item.type === 'group') {
          setEditGroupId(prev => prev ?? event.item.id)
        }
        setItems(prev => [...prev, event.item])
        break
      case 'update':
        setItems(prev => prev.map(it => patchItemRecursive(it, event.id, event.patch)))
        break
      case 'group-push':
        setItems(prev => pushToGroup(prev, event.groupId, event.item))
        break
      case 'clarify': {
        const nudge: ChatItem[] = hasNudgedRef.current ? [] : [{ id: nextId('data-nudge'), type: 'data-nudge' }]
        hasNudgedRef.current = true
        setItems(prev => [...prev, ...nudge, { id: event.id, type: 'clarify', questions: event.questions }])
        setClarifyPending({ id: event.id, questions: event.questions })
        break
      }
      case 'outline':
        setItems(prev => [...prev, { id: event.id, type: 'outline', sections: event.sections }])
        setOutlinePending({ id: event.id, sections: event.sections })
        break
      case 'preview':
        setPreviewState(event.state)
        break
      case 'reveal-slide':
        setRevealedSlides(prev => (prev.includes(event.index) ? prev : [...prev, event.index]))
        break
      case 'deck':
        if (isEditingRef.current) {
          // Agent edit result — lands as ONE undoable step on the deck the
          // user is already editing, not through the pre-ownership mirror.
          deckEditorRef.current.applyExternalDeck(event.deck)
        } else {
          setStreamedDeck(event.deck)
        }
        break
      case 'error':
        console.error(`[decks-ai-service] ${event.code}: ${event.message}`)
        // Soft errors (a model fallback) are logged only — the pipeline
        // already degrades to a scaffold and keeps streaming, so surfacing
        // them as a chat message would just be noise. Hard/terminal errors
        // (the session is gone or the request failed outright) end the
        // stream with nothing left to resume, so they need a visible
        // message — otherwise the UI just goes quiet with no explanation.
        if (HARD_ERROR_CODES.has(event.code)) {
          setClarifyPending(null)
          setOutlinePending(null)
          if (isEditingRef.current) setEditFailed(true)
          isEditingRef.current = false
          setIsEditing(false)
          setItems(prev => [
            ...prev,
            {
              id: nextId('agent'),
              type: 'agent',
              text:
                event.code === 'SESSION_NOT_FOUND'
                  ? "This session has expired (it's been a while since we last talked). Please start a new deck to continue."
                  : "Something went wrong on my end. Please try again, or start a new deck if the problem continues.",
            },
          ])
        }
        break
      case 'done':
        isEditingRef.current = false
        setIsEditing(false)
        break
    }
  }, [])

  const runStream = useCallback(
    async (path: string, body: unknown) => {
      setIsWorking(true)
      try {
        await fetchStream<StreamEvent>(path, body, applyEvent)
      } catch (err) {
        const message = err instanceof DeckServiceError ? err.message : 'Could not reach Decks AI Service — is it running?'
        console.error(message, err)
        setItems(prev => [...prev, { id: nextId('agent'), type: 'agent', text: "I couldn't reach the deck-generation service. Please check it's running and try again." }])
      } finally {
        // An /edit stream that errored or closed before its `done` event
        // would otherwise leave isEditing stuck true forever (composer
        // disabled, status chips spinning).
        if (isEditingRef.current) {
          isEditingRef.current = false
          setIsEditing(false)
          setEditFailed(true)
        }
        setIsWorking(false)
      }
    },
    [applyEvent],
  )

  const hasStartedRef = useRef(false)

  useEffect(() => {
    // React Strict Mode double-invokes effects in dev — without this guard
    // the mount effect would fire /generate twice, producing two backend
    // sessions with colliding chat-item ids (and double OpenRouter spend).
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    runStream('/generate', { prompt: initialPrompt, user: CURRENT_USER, aspectRatio })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const answerClarify = useCallback(
    (answers: string[]) => {
      if (!clarifyPending) return
      setItems(prev => prev.map(it => (it.id === clarifyPending.id ? { ...it, answered: answers } : it)))
      setItems(prev => [
        ...prev,
        { id: nextId('agent'), type: 'agent', text: `Locking in "${answers.join('", "')}". I'll draft a storyline for you to review before building the slides.` },
      ])
      setClarifyPending(null)
      runStream('/clarify', { sessionId: sessionIdRef.current, answers })
    },
    [clarifyPending, runStream],
  )

  const approveOutline = useCallback(
    (editedSections?: OutlineSection[]) => {
      if (!outlinePending) return
      setItems(prev => prev.map(it => (it.id === outlinePending.id ? { ...it, approved: true } : it)))
      setItems(prev => [
        ...prev,
        { id: nextId('agent'), type: 'agent', text: 'Great — building your slides now.' },
      ])
      setOutlinePending(null)
      // editedSections carries whatever the user left in the outline review
      // card (title/bullet/layout edits, reordering) — the backend uses
      // these instead of its original draft when present.
      runStream('/approve', { sessionId: sessionIdRef.current, sections: editedSections })
    },
    [outlinePending, runStream],
  )

  const regenerateOutline = useCallback(
    (notes?: string) => {
      if (!outlinePending) return
      setOutlinePending(null)
      runStream('/regenerate', { sessionId: sessionIdRef.current, notes })
    },
    [outlinePending, runStream],
  )

  // Real canvas-first editing: sends the client's CURRENT deck (so unsaved
  // inline edits aren't lost) plus the instruction and, when known, which
  // slide is active — the backend Coordinator scopes ambiguous asks to it.
  // The agents' own progress renders through the normal `items` timeline
  // (same chip/checklist components as first-draft generation); the result
  // comes back as a single `deck` event applied as ONE undoable step.
  const runEdit = useCallback(
    (instruction: string, activeSectionId?: string) => {
      const deck = deckEditorRef.current.deck
      if (!instruction.trim() || !deck || isEditingRef.current) return
      setItems(prev => [...prev, { id: nextId('user'), type: 'user', text: instruction }])
      isEditingRef.current = true
      setIsEditing(true)
      setEditFailed(false)
      setEditGroupId(null)
      runStream('/edit', { sessionId: sessionIdRef.current, instruction, deck, activeSectionId })
    },
    [runStream],
  )

  // The persistent chat's bottom composer now drives real edits too, instead
  // of the old dead-stub /followup acknowledgment.
  const sendFollowUp = useCallback((text: string) => runEdit(text), [runEdit])

  const verifyContent = useCallback(async () => {
    const deck = deckEditor.deck
    if (!deck || isVerifying) return
    setIsVerifying(true)
    try {
      const res = await postJson<{ flags: Omit<VerifyFlag, 'sectionTitle'>[] }>('/verify', { sessionId: sessionIdRef.current })
      const flags = res.flags.map(f => ({ ...f, sectionTitle: deck.sections.find(s => s.id === f.sectionId)?.title ?? 'Untitled section' }))
      setVerifyFlags(flags)
      setItems(prev => [...prev, { id: nextId('verify-report'), type: 'verify-report', flags }])
    } catch (err) {
      const message = err instanceof DeckServiceError ? err.message : 'Could not reach Decks AI Service — is it running?'
      console.error(message, err)
      setItems(prev => [...prev, { id: nextId('agent'), type: 'agent', text: "I couldn't verify the deck's content. Please check the service is running and try again." }])
    } finally {
      setIsVerifying(false)
    }
  }, [deckEditor.deck, isVerifying])

  const rewriteBlock = useCallback(async (text: string, instruction: string, sectionTitle?: string): Promise<string | null> => {
    setIsRewriting(true)
    try {
      const res = await postJson<{ text: string }>('/rewrite', { sessionId: sessionIdRef.current, text, instruction, sectionTitle })
      return res.text
    } catch (err) {
      const message = err instanceof DeckServiceError ? err.message : 'Could not reach Decks AI Service — is it running?'
      console.error(message, err)
      return null
    } finally {
      setIsRewriting(false)
    }
  }, [])

  const attachDataset = useCallback(async (next: DeckDataset) => {
    if (!sessionIdRef.current) return
    setIsAttachingDataset(true)
    try {
      await postJson('/data', { sessionId: sessionIdRef.current, dataset: next })
      setDataset(next)
      setItems(prev => [
        ...prev,
        {
          id: nextId('agent'),
          type: 'agent',
          text: `Connected "${next.source}" (${next.rows.length} row${next.rows.length === 1 ? '' : 's'}) — I'll ground the deck in this data and call out anything it doesn't cover.`,
        },
      ])
    } catch (err) {
      const message = err instanceof DeckServiceError ? err.message : 'Could not reach Decks AI Service — is it running?'
      console.error(message, err)
      setItems(prev => [...prev, { id: nextId('agent'), type: 'agent', text: "I couldn't attach that data. Please check the service is running and try again." }])
    } finally {
      setIsAttachingDataset(false)
    }
  }, [])

  const updateItem = useCallback((id: string, patch: ChatItemPatch) => {
    setItems(prev => prev.map(it => patchItemRecursive(it, id, patch)))
  }, [])

  return {
    items,
    previewState,
    revealedSlides,
    deck: deckEditor.deck,
    sessionId,
    dataset,
    isAttachingDataset,
    attachDataset,
    isWorking,
    clarifyPending,
    outlinePending,
    verifyFlags,
    isVerifying,
    isRewriting,
    canUndo: deckEditor.canUndo,
    canRedo: deckEditor.canRedo,
    undo: deckEditor.undo,
    redo: deckEditor.redo,
    insertBlock: deckEditor.insertBlock,
    insertSection: deckEditor.insertSection,
    deleteBlocks: deckEditor.deleteBlocks,
    duplicateBlocks: deckEditor.duplicateBlocks,
    setSectionLayout: deckEditor.setSectionLayout,
    applyRewrite: deckEditor.applyRewrite,
    beginBlockEdit: deckEditor.beginBlockEdit,
    updateBlockContent: deckEditor.updateBlockContent,
    commitBlockEdit: deckEditor.commitBlockEdit,
    answerClarify,
    approveOutline,
    regenerateOutline,
    sendFollowUp,
    isEditing,
    editFailed,
    editGroupId,
    runEdit,
    verifyContent,
    rewriteBlock,
    updateItem,
  }
}
