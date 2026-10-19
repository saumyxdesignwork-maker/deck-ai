import { meridian } from './templates/meridian'
import { ledger } from './templates/ledger'
import { slate } from './templates/slate'
import { riso } from './templates/riso'
import { noir } from './templates/noir'
import { bloom } from './templates/bloom'
import { VISUAL_LANGUAGE_TEMPLATES } from './templates/visualLanguages'
import type { DeckTemplate } from './types'

export type { DeckTemplate, TemplateCategory, SlideSurface } from './types'
export { isEngineTemplateId } from './templates/visualLanguages'

// Kept as the fallback for legacy/unknown template ids (see getTemplate
// below) — old decks saved before the engine existed still reference these
// six by id. Not offered as a pick anywhere new is generated from; see
// DEFAULT_ENGINE_TEMPLATE_ID and ENGINE_TEMPLATES for that.
export const DEFAULT_TEMPLATE_ID = meridian.id

// All 6 templates (3 corporate, 3 creative) — added here as pure data on
// top of the schema Riso proved out. Nothing else in the app needs to
// change to add a 7th: write a templates/<id>.ts file and list it here.
// The engine-drawn visual languages (Gradient Burn, Data First, …) follow the
// six block-rendered templates.
export const TEMPLATES: DeckTemplate[] = [meridian, ledger, slate, riso, noir, bloom, ...VISUAL_LANGUAGE_TEMPLATES]

export const TEMPLATE_IDS = TEMPLATES.map(t => t.id)

// Only the template-engine visual languages — what every template picker
// shows now (Studio's composer no longer offers the six classic,
// block-rendered templates as a pick). They still render fine via
// getTemplate() if an older saved deck references one by id.
export const ENGINE_TEMPLATES: DeckTemplate[] = VISUAL_LANGUAGE_TEMPLATES
export const DEFAULT_ENGINE_TEMPLATE_ID = VISUAL_LANGUAGE_TEMPLATES[0].id

const TEMPLATES_BY_ID: Record<string, DeckTemplate> = Object.fromEntries(TEMPLATES.map(t => [t.id, t]))

/** Never throws — an unknown or missing id (a legacy deck, a template that
 * was later removed, contract drift with the backend) falls back to the
 * default template rather than crashing the renderer. */
export function getTemplate(id: string | undefined): DeckTemplate {
  return (id && TEMPLATES_BY_ID[id]) || TEMPLATES_BY_ID[DEFAULT_TEMPLATE_ID]
}
