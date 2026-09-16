import { env, config } from '../config/env.js'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './types.js'

const BASE_URL = 'https://openrouter.ai/api/v1'

/**
 * Standard headers OpenRouter recommends for app attribution/ranking.
 * NEVER log or return these — Authorization carries the secret key.
 */
function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': config.servicePublicUrl,
    'X-Title': 'Decks AI',
  }
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly model: string,
  ) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

export async function chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(req),
  })

  const json = (await res.json()) as ChatCompletionResponse

  if (!res.ok || json.error) {
    const message = json.error?.message ?? `OpenRouter chat/completions failed with status ${res.status}`
    throw new OpenRouterError(message, res.status, req.model)
  }

  return json
}

export async function generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const res = await fetch(`${BASE_URL}/images`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(req),
  })

  const json = (await res.json()) as ImageGenerationResponse

  if (!res.ok || json.error) {
    const message = json.error?.message ?? `OpenRouter images failed with status ${res.status}`
    throw new OpenRouterError(message, res.status, req.model)
  }

  return json
}
