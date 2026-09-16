import { env } from './env.js'

/**
 * Model slugs are env-overridable by design: several of these (esp. the
 * Orchestrator and Designer slugs) are very recent OpenRouter listings and
 * may be renamed/retired. If a slug 400s with "model not found", override it
 * here via Decks_AI_Service/.env — no code change needed. `npm run smoke`
 * probes every slug below and fails fast naming the bad one.
 */
export const MODELS = {
  orchestrator: env.MODEL_ORCHESTRATOR,
  copywriter: env.MODEL_COPYWRITER,
  designerImage: env.MODEL_DESIGNER_IMAGE,
  designerVector: env.MODEL_DESIGNER_VECTOR,
} as const
