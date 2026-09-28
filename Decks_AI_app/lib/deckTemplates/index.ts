import { meridian } from './templates/meridian'
import { ledger } from './templates/ledger'
import { slate } from './templates/slate'
import { riso } from './templates/riso'
import { noir } from './templates/noir'
import { bloom } from './templates/bloom'
import type { DeckTemplate } from './types'

export type { DeckTemplate, TemplateCategory, SlideSurface } from './types'

export const DEFAULT_TEMPLATE_ID = meridian.id

// All 6 templates (3 corporate, 3 creative) — added here as pure data on
// top of the schema Riso proved out. Nothing else in the app needs to
// change to add a 7th: write a templates/<id>.ts file and list it here.
export const TEMPLATES: DeckTemplate[] = [meridian, ledger, slate, riso, noir, bloom]

export const TEMPLATE_IDS = TEMPLATES.map(t => t.id)

const TEMPLATES_BY_ID: Record<string, DeckTemplate> = Object.fromEntries(TEMPLATES.map(t => [t.id, t]))

/** Never throws — an unknown or missing id (a legacy deck, a template that
 * was later removed, contract drift with the backend) falls back to the
 * default template rather than crashing the renderer. */
export function getTemplate(id: string | undefined): DeckTemplate {
  return (id && TEMPLATES_BY_ID[id]) || TEMPLATES_BY_ID[DEFAULT_TEMPLATE_ID]
}
