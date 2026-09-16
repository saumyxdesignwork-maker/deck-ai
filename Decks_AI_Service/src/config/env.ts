import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

loadDotenv()

// Fail fast: if OPENROUTER_API_KEY (or anything else required) is missing,
// the server should refuse to start rather than fail confusingly mid-request.
const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required — set it in Decks_AI_Service/.env'),
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default('http://localhost:3301'),
  SERVICE_PUBLIC_URL: z.string().default('http://localhost:8787'),

  // anthropic/claude-3.5-sonnet is retired on OpenRouter; claude-sonnet-5 is
  // the current equivalent. flux-2-pro's real slug uses a dot: flux.2-pro.
  MODEL_ORCHESTRATOR: z.string().default('openai/gpt-5.6-luna'),
  MODEL_COPYWRITER: z.string().default('anthropic/claude-sonnet-5'),
  MODEL_DESIGNER_IMAGE: z.string().default('black-forest-labs/flux.2-pro'),
  MODEL_DESIGNER_VECTOR: z.string().default('recraft/recraft-v4.1'),

  IMAGES_ENABLED: z
    .string()
    .default('true')
    .transform(v => v.toLowerCase() !== 'false' && v !== '0'),
  MAX_IMAGES_PER_DECK: z.coerce.number().int().min(0).default(3),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:')
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = parsed.data

// Never log env.OPENROUTER_API_KEY or include it in any response body.
export const config = {
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  servicePublicUrl: env.SERVICE_PUBLIC_URL,
  imagesEnabled: env.IMAGES_ENABLED,
  maxImagesPerDeck: env.MAX_IMAGES_PER_DECK,
}
