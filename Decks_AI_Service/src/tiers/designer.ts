import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MODELS } from '../config/models.js'
import { config } from '../config/env.js'
import { generateImage, OpenRouterError } from '../openrouter/client.js'
import { logError, log } from '../lib/log.js'
import { newId } from '../lib/ids.js'
import type { DeckSkeleton } from './copywriter.js'
import type { OrchestratorResult } from './orchestrator.js'
import type { AspectRatio, DeckSection } from '../contract/deck.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets')

const FALLBACK_PALETTE = ['#EAF2FF', '#F3F4F6', '#FFF4E5', '#E9F9EF', '#F5EEFF', '#FFEFEF']
const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Applies the Orchestrator's design directive as plain hex colors —
 * this rides on the Orchestrator's already-required call, no extra
 * OpenRouter request needed for theme (only real images cost extra). */
export function applyTheme(
  deck: DeckSkeleton,
  directive: OrchestratorResult['designDirective'] | undefined,
): { coverColor: string; sections: DeckSection[] } {
  const coverColor = directive && HEX_RE.test(directive.coverColor) ? directive.coverColor : '#1E7BFF'
  const sectionColors = directive?.sectionColors?.filter(c => HEX_RE.test(c)) ?? []

  const sections: DeckSection[] = deck.sections.map((s, i) => ({
    id: newId('section'),
    title: s.title,
    layout: s.layout,
    thumbnailColor: sectionColors[i] ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
    blocks: s.blocks.map(b => ({ ...b, id: newId('block') })),
  }))

  return { coverColor, sections }
}

interface ImageTarget {
  sectionIndex: number
  blockIndex: number
  caption: string
  sectionTitle: string
}

/** Picks up to `limit` image-type blocks to actually render — cover slide has
 * no image field in the current data model, so only section `image` blocks
 * are eligible. Assigns the first eligible slot(s) to Flux (photographic)
 * and, if budget remains, one to Recraft (clean vector/icon style) —
 * exercising both models the user specified rather than picking one. */
function pickImageTargets(sections: DeckSection[], limit: number): ImageTarget[] {
  const targets: ImageTarget[] = []
  for (let si = 0; si < sections.length && targets.length < limit; si++) {
    const section = sections[si]
    for (let bi = 0; bi < section.blocks.length && targets.length < limit; bi++) {
      const block = section.blocks[bi]
      if (block.type === 'image') {
        targets.push({ sectionIndex: si, blockIndex: bi, caption: block.content, sectionTitle: section.title })
      }
    }
  }
  return targets
}

async function saveImage(b64: string, mediaType: string): Promise<string> {
  await mkdir(ASSETS_DIR, { recursive: true })
  const ext = mediaType.includes('svg') ? 'svg' : mediaType.split('/')[1] || 'png'
  const filename = `${newId('img')}.${ext}`
  const buffer = Buffer.from(b64, 'base64')
  await writeFile(path.join(ASSETS_DIR, filename), buffer)
  return `${config.servicePublicUrl}/assets/${filename}`
}

const IMAGE_TIMEOUT_MS = 45_000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Image generation timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

/**
 * Generates real images for up to `config.maxImagesPerDeck` section `image`
 * blocks and mutates them in place with `imageUrl`/`alt`. Each generation is
 * independently try/caught with a timeout — a failure degrades that one
 * block back to its placeholder instead of failing the whole deck.
 * `onProgress` lets the caller emit a per-image UI chip.
 */
export async function generateAndAssignImages(
  sections: DeckSection[],
  directive: OrchestratorResult['designDirective'] | undefined,
  aspectRatio: AspectRatio,
  onProgress?: (label: string, status: 'running' | 'done' | 'failed') => void,
): Promise<void> {
  if (!config.imagesEnabled || config.maxImagesPerDeck <= 0) return

  const targets = pickImageTargets(sections, config.maxImagesPerDeck)
  const mood = directive?.moodKeywords?.join(', ') ?? 'clean, modern, professional'

  await Promise.all(
    targets.map(async (target, idx) => {
      // Split the budget across both required models: the first target uses
      // Flux (photographic), the second (if any) uses Recraft (flat vector) —
      // demonstrating both rather than defaulting to one for every slot.
      const useRecraft = idx === 1
      const model = useRecraft ? MODELS.designerVector : MODELS.designerImage
      const label = `${useRecraft ? 'Recraft' : 'Flux'} — ${target.sectionTitle}`
      onProgress?.(label, 'running')

      const prompt = useRecraft
        ? `Flat vector illustration, minimal geometric style, ${mood}. Subject: ${target.caption}. Clean background, no text.`
        : `Professional presentation photograph, ${mood} aesthetic. Subject: ${target.caption}. No text overlays.`

      try {
        const res = await withTimeout(
          generateImage({
            model,
            prompt,
            n: 1,
            aspect_ratio: aspectRatio,
            output_format: useRecraft ? 'svg' : 'png',
          }),
          IMAGE_TIMEOUT_MS,
        )
        const image = res.data[0]
        if (!image) throw new Error('OpenRouter returned no image data')
        const url = await saveImage(image.b64_json, image.media_type)
        const block = sections[target.sectionIndex].blocks[target.blockIndex]
        block.imageUrl = url
        block.alt = target.caption
        onProgress?.(label, 'done')
        log('designer', `generated image for "${target.sectionTitle}" via ${model}`)
      } catch (err) {
        if (err instanceof OpenRouterError || err instanceof Error) logError('designer.generateImage', err)
        onProgress?.(label, 'failed')
        // Block keeps its placeholder — no imageUrl assigned.
      }
    }),
  )
}
