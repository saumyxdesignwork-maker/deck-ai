import { z } from 'zod'
import { MODELS } from '../config/models.js'
import { structuredCompletion, StructuredOutputError } from '../openrouter/json.js'
import { OpenRouterError } from '../openrouter/client.js'
import { logError } from '../lib/log.js'

const RewriteResultSchema = z.object({ text: z.string() })

const REWRITE_TOOL_NAME = 'emit_rewrite'

function rewriteTool() {
  return {
    type: 'function' as const,
    function: {
      name: REWRITE_TOOL_NAME,
      description: 'Emit the rewritten text.',
      parameters: {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
    },
  }
}

/**
 * Rewrites a single block's text per a free-form user instruction (or one of
 * the quick actions: Polish / Make longer / Make shorter / Verify). Scoped
 * to one block at a time — no deck-wide context needed beyond the text and
 * the instruction, so this stays a light, fast call.
 */
export async function rewriteText(text: string, instruction: string, sectionTitle?: string): Promise<{ text: string; usedFallback: boolean }> {
  const system = `You rewrite a single slide's text block per the user's instruction. Keep the same general length and register unless the instruction asks otherwise (e.g. "Make longer"/"Make shorter" should visibly change length). "Polish" means tighten wording and fix awkward phrasing without changing meaning. "Verify" means check the claim for unsupported certainty or vague wording and soften/correct it if needed, otherwise return it unchanged. Never wrap the output in quotes and never add commentary — output only the replacement text. Call the emit_rewrite tool — do not respond in prose.`

  const user = `${sectionTitle ? `Section: "${sectionTitle}"\n` : ''}Current text: "${text}"\nInstruction: "${instruction}"`

  try {
    const result = await structuredCompletion(
      {
        model: MODELS.copywriter,
        temperature: 0.5,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        tools: [rewriteTool()],
        tool_choice: { type: 'function', function: { name: REWRITE_TOOL_NAME } },
      },
      RewriteResultSchema,
      { toolName: REWRITE_TOOL_NAME },
    )
    return { text: result.text, usedFallback: false }
  } catch (err) {
    if (err instanceof StructuredOutputError || err instanceof OpenRouterError) {
      logError('rewriter.rewriteText', err)
      return { text, usedFallback: true }
    }
    throw err
  }
}
