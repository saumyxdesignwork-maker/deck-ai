import { z } from 'zod'
import { MODELS } from '../config/models.js'
import { structuredCompletion, StructuredOutputError } from '../openrouter/json.js'
import { OpenRouterError } from '../openrouter/client.js'
import { logError } from '../lib/log.js'
import type { SessionState } from '../session/store.js'
import { styleGuidance } from '../contract/deck.js'

const ClarifyQuestionSchema = z.object({
  topic: z.string().describe('A short 2-4 word label for this question, e.g. "Tone and stance" or "Length and shape".'),
  options: z.array(z.string()).min(2).max(6),
})

const OrchestratorResultSchema = z.object({
  reasoningTrace: z
    .string()
    .describe('A short first-person reasoning trace (2-4 numbered points) explaining how the brief was parsed and why clarifying questions are needed.'),
  clarifyQuestions: z.array(ClarifyQuestionSchema).min(1).max(3),
  copyDirective: z.object({
    audienceGoal: z.string(),
    tone: z.string(),
    sectionCount: z.number().int().min(3).max(10),
  }),
  designDirective: z.object({
    moodKeywords: z.array(z.string()).min(1).max(6),
    paletteHint: z.string(),
    coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex color'),
    sectionColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1),
  }),
})

export type OrchestratorResult = z.infer<typeof OrchestratorResultSchema>

const JSON_SCHEMA = {
  type: 'object',
  properties: {
    reasoningTrace: { type: 'string' },
    clarifyQuestions: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 6 },
        },
        required: ['topic', 'options'],
        additionalProperties: false,
      },
    },
    copyDirective: {
      type: 'object',
      properties: {
        audienceGoal: { type: 'string' },
        tone: { type: 'string' },
        sectionCount: { type: 'integer', minimum: 3, maximum: 10 },
      },
      required: ['audienceGoal', 'tone', 'sectionCount'],
      additionalProperties: false,
    },
    designDirective: {
      type: 'object',
      properties: {
        moodKeywords: { type: 'array', items: { type: 'string' } },
        paletteHint: { type: 'string' },
        coverColor: { type: 'string', description: 'hex color, e.g. #1E7BFF' },
        sectionColors: { type: 'array', items: { type: 'string' } },
      },
      required: ['moodKeywords', 'paletteHint', 'coverColor', 'sectionColors'],
      additionalProperties: false,
    },
  },
  required: ['reasoningTrace', 'clarifyQuestions', 'copyDirective', 'designDirective'],
  additionalProperties: false,
} as const

/** Deterministic fallback used if the Orchestrator call/validation fails twice —
 * keeps the pipeline moving instead of hanging the clarify gate. */
function fallbackResult(): OrchestratorResult {
  return {
    reasoningTrace:
      "1. Parsed the request for audience, tone, and primary goal signals\n" +
      '2. The goal, tone, and length are not fully specified in the prompt\n' +
      "3. I'll ask a couple of quick clarifying questions to lock the direction before drafting sections",
    clarifyQuestions: [
      { topic: 'Primary goal', options: ['Pitch to investors', 'Internal team update', 'Customer-facing overview', 'Conference talk'] },
      { topic: 'Tone and stance', options: ['Balanced and honest', 'Encouraging, vibes-forward', 'Cautionary, lessons-first'] },
    ],
    copyDirective: { audienceGoal: 'a general professional audience', tone: 'clear and confident', sectionCount: 6 },
    designDirective: {
      moodKeywords: ['clean', 'modern', 'minimal'],
      paletteHint: 'blue accent on a light neutral background',
      coverColor: '#1E7BFF',
      sectionColors: ['#EAF2FF', '#F3F4F6', '#FFF4E5', '#E9F9EF', '#F5EEFF', '#FFEFEF'],
    },
  }
}

/**
 * Analyzes the raw prompt + user vars, producing the clarifying question and
 * the two isolated directives (copy / design) that LLM 1 and LLM 2 consume.
 * Returns `{ result, usedFallback }` — callers should surface a soft error
 * event when usedFallback is true, but keep the session moving either way.
 */
export async function analyzeBrief(state: SessionState): Promise<{ result: OrchestratorResult; usedFallback: boolean }> {
  const system = `You are the Orchestrator for an AI deck-generation product. You receive a raw user prompt describing a presentation they want, plus light identity context. Your job:
1. Write a short first-person reasoning trace (2-4 numbered points) about how you parsed the brief.
2. Ask 1-3 short clarifying questions to lock the direction before drafting sections (never ask about the user's identity) — good topics are the deck's primary GOAL, its TONE/stance, and its LENGTH/shape, but only ask about what's genuinely ambiguous in the prompt. Each question needs a short 2-4 word topic label (e.g. "Tone and stance") and 2-6 concrete options.
3. Emit a "copyDirective" for a copywriter model: the audience/goal framing, a tone description, and how many content sections (3-10) the deck should have.
4. Emit a "designDirective" for a designer model: 1-6 mood keywords, a one-line palette hint, a cover hex color, and one hex color per content section (same count as sectionCount) for section thumbnails — all colors should read as a coherent, professional palette.
Respond with ONLY the JSON object matching the required schema.`

  const user = `User prompt: "${state.prompt}"\nUser name: ${state.user.name}${state.user.designation ? `\nUser designation: ${state.user.designation}` : ''}\n${styleGuidance(state.style)} Reflect it in the copyDirective tone and the designDirective mood/palette.`

  try {
    const result = await structuredCompletion(
      {
        model: MODELS.orchestrator,
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'orchestrator_result', strict: true, schema: JSON_SCHEMA } },
      },
      OrchestratorResultSchema,
    )
    return { result, usedFallback: false }
  } catch (err) {
    if (err instanceof StructuredOutputError || err instanceof OpenRouterError) {
      logError('orchestrator', err)
      return { result: fallbackResult(), usedFallback: true }
    }
    throw err
  }
}
