// Lightweight local "my decks" registry — powers the Studio landing page's
// "Your slides" tab. There's no backend deck-listing endpoint (sessions are
// in-memory and expire), so this stores a full snapshot of each deck the
// moment its first draft finishes, entirely client-side. Reopening a saved
// deck restores that snapshot for viewing/presenting/manual editing; the
// backend session behind it has very likely expired by then, so AI-assisted
// (Ask AI) edits on a reopened deck degrade to the existing "session
// expired — start a new deck" messaging rather than silently failing.

import { AspectRatio, DeckData } from './fixtures'

export interface SavedDeck {
  sessionId: string
  title: string
  /** The prompt that produced it — shown as the card's subtitle and reused
   * as the reopened session's displayed first message. */
  prompt: string
  aspectRatio: AspectRatio
  createdAt: string
  deck: DeckData
}

const STORAGE_KEY = 'deckai-my-decks'
// Keeps localStorage bounded — decks carry real content (and any generated
// image URLs), so an unbounded list could grow large over a long-lived browser profile.
const MAX_SAVED = 24

export function getSavedDecks(): SavedDeck[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Records (or replaces, if already present) a deck snapshot — newest first. */
export function saveDeckToHistory(entry: SavedDeck): void {
  if (typeof window === 'undefined') return
  try {
    const next = [entry, ...getSavedDecks().filter(d => d.sessionId !== entry.sessionId)].slice(0, MAX_SAVED)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Best-effort only (private window, full storage) — never break the
    // generation flow over this.
  }
}
