import { z } from 'zod'
import { MODELS } from '../config/models.js'
import { structuredCompletion, StructuredOutputError } from '../openrouter/json.js'
import { OpenRouterError } from '../openrouter/client.js'
import { logError } from '../lib/log.js'
import type { DeckData } from '../contract/deck.js'
import type { VerifyFlag } from '../contract/verify.js'

const VerifyResultSchema = z.object({
  flags: z
    .array(
      z.object({
        sectionIndex: z.number().int().min(0),
        issue: z.string(),
        severity: z.enum(['warning', 'info']),
      }),
    )
    .max(20),
})

const VERIFY_TOOL_NAME = 'emit_verification'

function verifyTool(sectionCount: number) {
  return {
    type: 'function' as const,
    function: {
      name: VERIFY_TOOL_NAME,
      description: 'Emit content-quality flags found across the deck, if any.',
      parameters: {
        type: 'object',
        properties: {
          flags: {
            type: 'array',
            maxItems: 20,
            items: {
              type: 'object',
              properties: {
                sectionIndex: { type: 'integer', minimum: 0, maximum: sectionCount - 1 },
                issue: { type: 'string', description: 'One short sentence describing the specific problem.' },
                severity: { type: 'string', enum: ['warning', 'info'] },
              },
              required: ['sectionIndex', 'issue', 'severity'],
            },
          },
        },
        required: ['flags'],
      },
    },
  }
}

/**
 * Runs a single LLM pass over the assembled deck's text, flagging factual
 * inconsistencies (numbers/claims that contradict each other across
 * sections), repeated phrasing, and unsupported/weak claims. Section-level
 * granularity (not per-block) — enough to point the user at the right slide
 * without the complexity of block-level attribution.
 */
export async function verifyDeck(deck: DeckData): Promise<{ flags: VerifyFlag[]; usedFallback: boolean }> {
  const system = `You are a careful editor reviewing a finished slide deck before it ships. Read every section's text and flag genuine problems only — do not invent issues if the deck is clean, an empty flags array is a good result. Look for: factual or numerical inconsistencies BETWEEN sections (e.g. a stat stated differently twice), phrasing repeated near-verbatim across sections, and claims stated with unsupported certainty (e.g. "guaranteed", "impossible to fail") that should be softened. For each issue, name the exact section it's in and write one short, specific sentence. Call the emit_verification tool — do not respond in prose.`

  const user = `Deck title: "${deck.title}"\n\n${deck.sections
    .map((s, i) => `Section ${i} — "${s.title}":\n${s.blocks.map(b => (b.type === 'card-group' ? (b.cards ?? []).map(c => `${c.title}: ${c.value}`).join('; ') : b.content)).join('\n')}`)
    .join('\n\n')}`

  try {
    const result = await structuredCompletion(
      {
        model: MODELS.copywriter,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        tools: [verifyTool(deck.sections.length)],
        tool_choice: { type: 'function', function: { name: VERIFY_TOOL_NAME } },
      },
      VerifyResultSchema,
      { toolName: VERIFY_TOOL_NAME },
    )
    const flags = result.flags
      .filter(f => f.sectionIndex >= 0 && f.sectionIndex < deck.sections.length)
      .map(f => ({ sectionId: deck.sections[f.sectionIndex].id, issue: f.issue, severity: f.severity }))
    return { flags, usedFallback: false }
  } catch (err) {
    if (err instanceof StructuredOutputError || err instanceof OpenRouterError) {
      logError('verifier.verifyDeck', err)
      return { flags: [], usedFallback: true }
    }
    throw err
  }
}
