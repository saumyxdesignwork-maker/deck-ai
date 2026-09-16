import type { z } from 'zod'
import { chatCompletion } from './client.js'
import type { ChatCompletionRequest, ChatMessage } from './types.js'

export class StructuredOutputError extends Error {
  constructor(
    message: string,
    public readonly zodError: unknown,
  ) {
    super(message)
    this.name = 'StructuredOutputError'
  }
}

/** Pulls the JSON payload out of a chat completion — either plain content
 * (json_schema response_format) or a forced tool call's arguments. */
function extractRawJson(res: Awaited<ReturnType<typeof chatCompletion>>, toolName?: string): string {
  const message = res.choices[0]?.message
  if (!message) throw new StructuredOutputError('OpenRouter returned no choices', null)

  if (toolName) {
    const call = message.tool_calls?.find(c => c.function.name === toolName)
    if (!call) throw new StructuredOutputError(`Expected a "${toolName}" tool call but got none`, null)
    return call.function.arguments
  }

  if (!message.content) throw new StructuredOutputError('OpenRouter returned empty content', null)
  return message.content
}

/**
 * Runs a structured chat completion, validates the JSON against `schema`,
 * and — on validation failure — retries exactly once with the zod error fed
 * back to the model. Throws StructuredOutputError if the repair also fails,
 * so callers can fall back to a deterministic scaffold instead of hanging.
 */
export async function structuredCompletion<T>(
  request: ChatCompletionRequest,
  schema: z.ZodType<T>,
  opts: { toolName?: string } = {},
): Promise<T> {
  const attempt = async (messages: ChatMessage[]): Promise<{ raw: string; parsed: ReturnType<typeof schema.safeParse> }> => {
    const res = await chatCompletion({ ...request, messages })
    const raw = extractRawJson(res, opts.toolName)
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return { raw, parsed: schema.safeParse(undefined) }
    }
    return { raw, parsed: schema.safeParse(json) }
  }

  const first = await attempt(request.messages)
  if (first.parsed.success) return first.parsed.data

  const repairMessages: ChatMessage[] = [
    ...request.messages,
    { role: 'assistant', content: first.raw },
    {
      role: 'user',
      content: `Your previous output failed schema validation: ${JSON.stringify(
        first.parsed.error.issues,
      )}. Return ONLY valid JSON matching the required schema — no prose, no markdown fences.`,
    },
  ]

  const second = await attempt(repairMessages)
  if (second.parsed.success) return second.parsed.data

  throw new StructuredOutputError('Structured output failed validation twice', second.parsed.error)
}
