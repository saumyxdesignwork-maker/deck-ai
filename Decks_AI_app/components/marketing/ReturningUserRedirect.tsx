'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSavedDecks } from '@/lib/deckHistory'

/** Preserves the old "/" behavior for people who've actually used the
 * product before: if they have a saved deck, skip the marketing page and go
 * straight to their flow (Studio by default, Classic if they'd switched).
 * First-time visitors have nothing saved yet, so they fall through and see
 * the landing page render normally underneath this (this component renders
 * nothing itself). */
export function ReturningUserRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (getSavedDecks().length === 0) return
    const savedFlow = localStorage.getItem('deckai-flow')
    router.replace(savedFlow === 'classic' ? '/create' : '/create/studio')
  }, [router])

  return null
}
