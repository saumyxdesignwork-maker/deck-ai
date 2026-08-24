'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildScript, ChatItem, ChatItemPatch, ScriptStep } from './studioScript'

export type PreviewState = 'idle' | 'preparing' | 'thumbs' | 'done'

let uid = 0
function nextId(prefix: string) {
  uid += 1
  return `${prefix}-${uid}`
}

export function useStudioSession(initialPrompt: string) {
  const [items, setItems] = useState<ChatItem[]>([
    { id: nextId('user'), type: 'user', text: initialPrompt },
  ])
  const [previewState, setPreviewState] = useState<PreviewState>('idle')
  const [revealedSlides, setRevealedSlides] = useState<number[]>([])
  const [isWorking, setIsWorking] = useState(true)
  const [clarifyPending, setClarifyPending] = useState<{ id: string; question: string; options: string[] } | null>(null)

  const scriptRef = useRef<ScriptStep[]>(buildScript())
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyStep = useCallback((step: ScriptStep) => {
    if (step.kind === 'chat') {
      setItems(prev => [...prev, step.item])
    } else if (step.kind === 'update') {
      setItems(prev => prev.map(it => (it.id === step.id ? ({ ...it, ...step.patch } as ChatItem) : it)))
    } else if (step.kind === 'preview') {
      setPreviewState(step.state)
    } else if (step.kind === 'reveal-slide') {
      setRevealedSlides(prev => (prev.includes(step.index) ? prev : [...prev, step.index]))
    }
    // 'clarify' steps are handled directly in scheduleNext, not here.
  }, [])

  const scheduleNext = useCallback(() => {
    const script = scriptRef.current
    const step = script[indexRef.current]

    if (!step) {
      setIsWorking(false)
      return
    }

    if (step.kind === 'clarify') {
      // Block: push the clarify item and wait for answerClarify()
      setItems(prev => [...prev, { id: step.id, type: 'clarify', question: step.question, options: step.options }])
      setClarifyPending({ id: step.id, question: step.question, options: step.options })
      setIsWorking(false)
      return
    }

    timeoutRef.current = setTimeout(() => {
      applyStep(step)
      indexRef.current += 1
      scheduleNext()
    }, step.delay)
  }, [applyStep])

  useEffect(() => {
    setIsWorking(true)
    scheduleNext()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const answerClarify = useCallback((answer: string) => {
    if (!clarifyPending) return
    setItems(prev => prev.map(it => (it.id === clarifyPending.id ? { ...it, answered: answer } : it)))
    setItems(prev => [
      ...prev,
      { id: nextId('agent'), type: 'agent', text: `Locking in "${answer}". I'll structure the storyline and start building the slides now.` },
    ])
    setClarifyPending(null)
    setIsWorking(true)
    indexRef.current += 1
    scheduleNext()
  }, [clarifyPending, scheduleNext])

  const sendFollowUp = useCallback((text: string) => {
    if (!text.trim()) return
    setItems(prev => [...prev, { id: nextId('user'), type: 'user', text }])
    setIsWorking(true)
    const ackId = nextId('agent')
    setTimeout(() => {
      setItems(prev => [...prev, { id: ackId, type: 'agent', text: "Got it — I've noted that. (This is a prototype; live refinement isn't wired up yet.)" }])
      setIsWorking(false)
    }, 900)
  }, [])

  const updateItem = useCallback((id: string, patch: ChatItemPatch) => {
    setItems(prev => prev.map(it => (it.id === id ? ({ ...it, ...patch } as ChatItem) : it)))
  }, [])

  return {
    items,
    previewState,
    revealedSlides,
    isWorking,
    clarifyPending,
    answerClarify,
    sendFollowUp,
    updateItem,
  }
}
