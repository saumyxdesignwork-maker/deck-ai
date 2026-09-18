'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatItem, ChatItemPatch, OutlineSection } from './studioScript'
import { DeckData } from './fixtures'
import { StreamEvent } from './streamEvents'
import { fetchStream, DeckServiceError } from './deckStream'
import { CURRENT_USER } from './identity'

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

export function useStudioSession(initialPrompt: string) {
  const [items, setItems] = useState<ChatItem[]>([
    { id: nextId('user'), type: 'user', text: initialPrompt },
  ])
  const [previewState, setPreviewState] = useState<PreviewState>('idle')
  const [revealedSlides, setRevealedSlides] = useState<number[]>([])
  const [deck, setDeck] = useState<DeckData | null>(null)
  const [isWorking, setIsWorking] = useState(true)
  const [clarifyPending, setClarifyPending] = useState<{ id: string; question: string; options: string[] } | null>(null)
  const [outlinePending, setOutlinePending] = useState<{ id: string; sections: OutlineSection[] } | null>(null)

  const sessionIdRef = useRef<string | null>(null)

  const applyEvent = useCallback((event: StreamEvent) => {
    switch (event.t) {
      case 'session':
        sessionIdRef.current = event.sessionId
        break
      case 'chat':
        setItems(prev => [...prev, event.item])
        break
      case 'update':
        setItems(prev => prev.map(it => patchItemRecursive(it, event.id, event.patch)))
        break
      case 'group-push':
        setItems(prev => pushToGroup(prev, event.groupId, event.item))
        break
      case 'clarify':
        setItems(prev => [...prev, { id: event.id, type: 'clarify', question: event.question, options: event.options }])
        setClarifyPending({ id: event.id, question: event.question, options: event.options })
        break
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
        setDeck(event.deck)
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
    runStream('/generate', { prompt: initialPrompt, user: CURRENT_USER })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const answerClarify = useCallback(
    (answer: string) => {
      if (!clarifyPending) return
      setItems(prev => prev.map(it => (it.id === clarifyPending.id ? { ...it, answered: answer } : it)))
      setItems(prev => [
        ...prev,
        { id: nextId('agent'), type: 'agent', text: `Locking in "${answer}". I'll draft a storyline for you to review before building the slides.` },
      ])
      setClarifyPending(null)
      runStream('/clarify', { sessionId: sessionIdRef.current, answer })
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

  const sendFollowUp = useCallback(
    (text: string) => {
      if (!text.trim()) return
      setItems(prev => [...prev, { id: nextId('user'), type: 'user', text }])
      runStream('/followup', { sessionId: sessionIdRef.current, text })
    },
    [runStream],
  )

  const updateItem = useCallback((id: string, patch: ChatItemPatch) => {
    setItems(prev => prev.map(it => patchItemRecursive(it, id, patch)))
  }, [])

  return {
    items,
    previewState,
    revealedSlides,
    deck,
    isWorking,
    clarifyPending,
    outlinePending,
    answerClarify,
    approveOutline,
    regenerateOutline,
    sendFollowUp,
    updateItem,
  }
}
