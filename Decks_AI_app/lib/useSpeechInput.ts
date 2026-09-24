'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Minimal typing for the Web Speech API (not in lib.dom for every TS target).
interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike { isFinal: boolean; 0: SpeechRecognitionAlternativeLike; length: number }
interface SpeechRecognitionEventLike { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionErrorEventLike { error: string }
export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const noopSubscribe = () => () => {}

export const SPEECH_ERROR_TEXT: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked — allow it in your browser settings to use voice input.',
  'service-not-allowed': 'Microphone access is blocked — allow it in your browser settings to use voice input.',
  'audio-capture': 'No microphone was found.',
  'no-speech': "Didn't catch anything — try again.",
  network: 'Voice input needs a network connection.',
}

/**
 * Browser speech-to-text (Chrome, Edge, Safari). `onTranscript` receives the
 * finalized text plus the in-progress (interim) text for the current
 * listening session, so the caller can show words as they're spoken.
 */
export function useSpeechInput(onTranscript: (finalText: string, interimText: string) => void) {
  const supported = useSyncExternalStore(noopSubscribe, () => getRecognitionCtor() !== null, () => false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const callbackRef = useRef(onTranscript)
  useEffect(() => {
    callbackRef.current = onTranscript
  })

  const stop = useCallback(() => {
    recRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor || recRef.current) return
    const rec = new Ctor()
    rec.lang = navigator.language || 'en-US'
    rec.continuous = true
    rec.interimResults = true
    let finalText = ''
    rec.onresult = e => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      callbackRef.current(finalText, interim)
    }
    rec.onerror = e => {
      // 'aborted' is our own stop/unmount — not an error worth showing.
      if (e.error !== 'aborted') setError(SPEECH_ERROR_TEXT[e.error] ?? 'Voice input stopped unexpectedly.')
    }
    rec.onend = () => {
      recRef.current = null
      setListening(false)
    }
    setError(null)
    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch {
      setError('Voice input could not start.')
    }
  }, [])

  const toggle = useCallback(() => {
    if (recRef.current) stop()
    else start()
  }, [start, stop])

  useEffect(() => () => recRef.current?.abort(), [])

  return { supported, listening, error, start, stop, toggle, clearError: () => setError(null) }
}
