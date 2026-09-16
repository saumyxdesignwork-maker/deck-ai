/**
 * End-to-end smoke test: confirms OpenRouter connectivity, that every
 * configured model slug resolves, and that the full pipeline produces a
 * valid deck (with a real image, if IMAGES_ENABLED). Run with `npm run smoke`.
 *
 * This does NOT start the HTTP server — it calls the pipeline functions
 * directly, so it also works as a fast local dev loop.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stat } from 'node:fs/promises'
import { env, config } from '../config/env.js'
import { MODELS } from '../config/models.js'
import { chatCompletion, generateImage, OpenRouterError } from '../openrouter/client.js'
import { createSession } from '../session/store.js'
import { runGenerate, runClarify, runApprove } from '../pipeline/pipeline.js'
import type { StreamEvent } from '../pipeline/events.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets')

const SAMPLE_PROMPT = 'A pitch deck for an AI-powered note-taking app aimed at busy product managers'

async function probeModel(label: string, model: string): Promise<void> {
  const start = Date.now()
  try {
    await chatCompletion({ model, messages: [{ role: 'user', content: 'Reply with just the word OK.' }], max_tokens: 5 })
    console.log(`✅ ${label} (${model}) resolved — ${Date.now() - start}ms`)
  } catch (err) {
    if (err instanceof OpenRouterError) {
      console.error(`❌ ${label} (${model}) FAILED — status ${err.status}: ${err.message}`)
      console.error(`   Fix: override the slug via .env, e.g. MODEL_${label.toUpperCase()}=<a valid OpenRouter slug>`)
    } else {
      console.error(`❌ ${label} (${model}) FAILED —`, err)
    }
    throw err
  }
}

async function probeImageModel(label: string, model: string): Promise<void> {
  const start = Date.now()
  try {
    const res = await generateImage({ model, prompt: 'a simple blue circle on a white background', n: 1 })
    if (!res.data[0]?.b64_json) throw new Error('no image data returned')
    console.log(`✅ ${label} (${model}) resolved — ${Date.now() - start}ms, ${res.data[0].media_type}`)
  } catch (err) {
    if (err instanceof OpenRouterError) {
      console.error(`❌ ${label} (${model}) FAILED — status ${err.status}: ${err.message}`)
    } else {
      console.error(`❌ ${label} (${model}) FAILED —`, err)
    }
    throw err
  }
}

async function main() {
  console.log('── Decks AI Service smoke test ──')
  console.log(`OPENROUTER_API_KEY present: ${env.OPENROUTER_API_KEY ? 'yes' : 'NO — aborting'}`)
  if (!env.OPENROUTER_API_KEY) process.exit(1)

  console.log('\n1. Probing model slugs...')
  await probeModel('orchestrator', MODELS.orchestrator)
  await probeModel('copywriter', MODELS.copywriter)
  if (config.imagesEnabled) {
    await probeImageModel('designerImage', MODELS.designerImage)
    await probeImageModel('designerVector', MODELS.designerVector)
  } else {
    console.log('   (IMAGES_ENABLED=false — skipping designer model probes)')
  }

  console.log('\n2. Running the full pipeline for a canned prompt...')
  const state = createSession('smoke-session', SAMPLE_PROMPT, { name: 'Smoke Test' })

  const events: StreamEvent[] = []
  const emit = async (e: StreamEvent) => {
    events.push(e)
  }

  const t0 = Date.now()
  await runGenerate(state, emit)
  const clarifyEvent = events.find(e => e.t === 'clarify')
  if (!clarifyEvent || clarifyEvent.t !== 'clarify') throw new Error('runGenerate did not produce a clarify gate')
  console.log(`   ✅ generate → clarify: "${clarifyEvent.question}" (${Date.now() - t0}ms)`)

  const t1 = Date.now()
  await runClarify(state, clarifyEvent.options[0], emit)
  const outlineEvent = events.find(e => e.t === 'outline')
  if (!outlineEvent || outlineEvent.t !== 'outline') throw new Error('runClarify did not produce an outline gate')
  if (outlineEvent.sections.length < 1) throw new Error('outline has no sections')
  console.log(`   ✅ clarify → outline: ${outlineEvent.sections.length} sections (${Date.now() - t1}ms)`)

  const t2 = Date.now()
  await runApprove(state, emit)
  const deckEvent = events.find(e => e.t === 'deck')
  if (!deckEvent || deckEvent.t !== 'deck') throw new Error('runApprove did not produce a deck event')
  const { deck } = deckEvent
  if (!deck.title || !deck.coverColor || deck.sections.length < 1) throw new Error('deck is missing required fields')
  console.log(`   ✅ approve → deck: "${deck.title}" — ${deck.sections.length} sections, cover ${deck.coverColor} (${Date.now() - t2}ms)`)

  // Consistency check: outline section titles must match the deck section titles/order.
  const outlineTitles = outlineEvent.sections.map(s => s.title)
  const deckTitles = deck.sections.map(s => s.title)
  const consistent = outlineTitles.length === deckTitles.length && outlineTitles.every((t, i) => t === deckTitles[i])
  console.log(consistent ? '   ✅ outline ↔ deck section titles match' : `   ⚠️  outline/deck section mismatch:\n      outline: ${outlineTitles.join(', ')}\n      deck:    ${deckTitles.join(', ')}`)

  if (config.imagesEnabled) {
    const imagedBlocks = deck.sections.flatMap(s => s.blocks).filter(b => b.imageUrl)
    if (imagedBlocks.length > 0) {
      console.log(`   ✅ ${imagedBlocks.length} image(s) generated:`)
      for (const b of imagedBlocks) {
        const url = b.imageUrl!
        // The smoke test calls the pipeline directly (no HTTP server
        // running), so verify the saved file on disk rather than fetching
        // the /assets URL — that route is checked separately in the
        // browser E2E pass once the server is up.
        const filename = url.split('/assets/')[1]
        const filePath = path.join(ASSETS_DIR, filename ?? '')
        const stats = await stat(filePath).catch(() => null)
        console.log(`      - ${url} → ${stats ? `${stats.size} bytes on disk ✓` : 'FILE NOT FOUND ✗'}`)
      }
    } else {
      console.log('   ⚠️  no images were generated (all targets may have failed/timed out, or the deck had no image blocks)')
    }
  }

  const errorEvents = events.filter(e => e.t === 'error')
  if (errorEvents.length > 0) {
    console.log(`\n⚠️  ${errorEvents.length} soft error event(s) occurred (fallbacks were used):`)
    for (const e of errorEvents) if (e.t === 'error') console.log(`   - [${e.code}] ${e.message}`)
  }

  console.log('\n✅ Smoke test complete.')
}

main().catch(err => {
  console.error('\n❌ Smoke test failed:', err)
  process.exit(1)
})
