import { renderDeck } from '../template-engine/index.js'
import { toEngineDeck, engineDeckKey } from './engineAdapter.js'
import type { DeckData } from '../contract/deck.js'

/** Template ids drawn by the template engine carry this prefix plus the
 * engine's visual-language id (mirrors VL_PREFIX in
 * Decks_AI_app/lib/deckTemplates/templates/visualLanguages.ts). */
const ENGINE_TEMPLATE_PREFIX = 'vl-'

/** A generated deck compiled into its template's HTML — the shape the app's
 * EngineDeck draws (one HTML string per slide, cover first, plus the deck's
 * scoped stylesheet). `key` fingerprints the engine deck it was compiled from,
 * so the client can tell when an edit has made it stale. */
export interface RenderedDeckHtml {
  vl: string
  key: string
  css: string
  scopeClass: string
  frame: { w: number; h: number }
  slideIds: string[]
  slides: string[]
}

/** The engine visual language for a template id, or null for the classic,
 * block-rendered templates (which have no HTML step). */
export function engineVlFor(templateId: string | undefined): string | null {
  return templateId?.startsWith(ENGINE_TEMPLATE_PREFIX) ? templateId.slice(ENGINE_TEMPLATE_PREFIX.length) : null
}

/** "gradient-burn" → "Gradient Burn" — the engine's ids are its display names. */
export function visualLanguageName(vl: string): string {
  return vl.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/** Compiles every slide of `deck` into the `vl` template's HTML. Throws on an
 * unknown visual language or content the engine rejects — callers treat that
 * as "no server render" and let the client compile instead. */
export function renderDeckHtml(deck: DeckData, vl: string): RenderedDeckHtml {
  const engineDeck = toEngineDeck(deck, vl)
  const rendered = renderDeck(engineDeck)
  return {
    vl,
    key: engineDeckKey(engineDeck),
    css: rendered.css,
    scopeClass: rendered.scopeClass,
    frame: rendered.frame,
    slideIds: rendered.plan.map(p => p.slide.id),
    slides: rendered.slides,
  }
}
