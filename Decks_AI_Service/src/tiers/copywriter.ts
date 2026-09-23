import { z } from 'zod'
import { MODELS } from '../config/models.js'
import { structuredCompletion, StructuredOutputError } from '../openrouter/json.js'
import { OpenRouterError } from '../openrouter/client.js'
import { logError } from '../lib/log.js'
import { newId } from '../lib/ids.js'
import type { SessionState } from '../session/store.js'
import type { OutlineSection } from '../contract/chat.js'
import type { LayoutType, Block } from '../contract/deck.js'

const LAYOUTS: LayoutType[] = ['statement', 'key-points', 'heading-media', 'media-text', 'bento', 'data']

// ── Storyline (outline) ──────────────────────────────────────────────────

const StorylineSchema = z.object({
  sections: z
    .array(z.object({ title: z.string(), bullets: z.array(z.string()).min(2).max(5) }))
    .min(3)
    .max(10),
})

const STORYLINE_TOOL_NAME = 'emit_storyline'

/**
 * Claude via OpenRouter is unreliable with response_format json_schema —
 * forced tool-calling is the reliable structured-output path here.
 */
function storylineTool(sectionCount: number) {
  return {
    type: 'function' as const,
    function: {
      name: STORYLINE_TOOL_NAME,
      description: 'Emit the deck storyline as a list of sections with title + bullets.',
      parameters: {
        type: 'object',
        properties: {
          sections: {
            type: 'array',
            minItems: Math.max(3, sectionCount - 1),
            maxItems: sectionCount + 1,
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                bullets: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
              },
              required: ['title', 'bullets'],
            },
          },
        },
        required: ['sections'],
      },
    },
  }
}

function fallbackStoryline(prompt: string, sectionCount: number): OutlineSection[] {
  const base = ['The Problem', 'Our Approach', 'Why It Works', 'Who It Serves', 'Evidence & Results', "What's Next"]
  return base.slice(0, sectionCount).map((title, i) => ({
    title: i === 0 ? title : title,
    bullets: [`Key point about "${prompt.slice(0, 60)}"`, 'Supporting detail', 'Why this matters to the audience'],
  }))
}

export async function draftStoryline(state: SessionState, notes?: string): Promise<{ sections: OutlineSection[]; usedFallback: boolean }> {
  const directive = state.copyDirective
  const sectionCount = directive?.sectionCount ?? 6

  const system = `You are the copywriter for an AI deck-generation product. Draft a presentation storyline: a sequence of sections, each with a punchy title and 2-5 concise, high-impact bullet points. Write for ${directive?.audienceGoal ?? 'a general professional audience'} in a ${directive?.tone ?? 'clear, confident'} tone. Avoid repetitive phrasing across sections. Call the emit_storyline tool with your result — do not respond in prose.`

  const clarifyAnswers = state.clarifyAnswers?.join('; ') ?? 'unspecified'
  const userParts = [`Deck topic: "${state.prompt}"`, `Answers to clarifying questions: "${clarifyAnswers}"`, `Target section count: ${sectionCount}`]
  if (notes) userParts.push(`Additional notes for this revision: ${notes}`)

  try {
    const result = await structuredCompletion(
      {
        model: MODELS.copywriter,
        temperature: 0.6,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userParts.join('\n') },
        ],
        tools: [storylineTool(sectionCount)],
        tool_choice: { type: 'function', function: { name: STORYLINE_TOOL_NAME } },
      },
      StorylineSchema,
      { toolName: STORYLINE_TOOL_NAME },
    )
    return { sections: result.sections, usedFallback: false }
  } catch (err) {
    if (err instanceof StructuredOutputError || err instanceof OpenRouterError) {
      logError('copywriter.draftStoryline', err)
      return { sections: fallbackStoryline(state.prompt, sectionCount), usedFallback: true }
    }
    throw err
  }
}

// ── Full deck expansion ──────────────────────────────────────────────────

const BlockSchema = z.object({
  type: z.enum(['heading', 'paragraph', 'card-group', 'image', 'callout']),
  content: z.string(),
  cards: z.array(z.object({ icon: z.string(), title: z.string(), value: z.string() })).optional(),
})

const DeckSkeletonSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  sections: z
    .array(
      z.object({
        title: z.string(),
        layout: z.enum(['statement', 'key-points', 'heading-media', 'media-text', 'bento', 'data']),
        blocks: z.array(BlockSchema).min(1).max(6),
      }),
    )
    .min(1),
})

export interface DeckSkeleton {
  title: string
  subtitle: string
  sections: Array<{ title: string; layout: LayoutType; blocks: Block[] }>
}

const DECK_TOOL_NAME = 'emit_deck'

function deckTool() {
  return {
    type: 'function' as const,
    function: {
      name: DECK_TOOL_NAME,
      description: 'Emit the full deck: a title, subtitle, and the approved sections expanded into rendered blocks.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                layout: { type: 'string', enum: LAYOUTS },
                blocks: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 6,
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['heading', 'paragraph', 'card-group', 'image', 'callout'] },
                      content: { type: 'string', description: 'Text content, or a short image caption when type is "image".' },
                      cards: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: { icon: { type: 'string' }, title: { type: 'string' }, value: { type: 'string' } },
                          required: ['icon', 'title', 'value'],
                        },
                      },
                    },
                    required: ['type', 'content'],
                  },
                },
              },
              required: ['title', 'layout', 'blocks'],
            },
          },
        },
        required: ['title', 'subtitle', 'sections'],
      },
    },
  }
}

function fallbackDeck(state: SessionState): DeckSkeleton {
  const storyline = state.approvedStoryline ?? []
  return {
    title: state.prompt.length > 60 ? state.prompt.slice(0, 57) + '…' : state.prompt,
    subtitle: state.copyDirective?.audienceGoal ?? 'Generated with DeckAI',
    sections: storyline.map((s, i) => ({
      title: s.title,
      layout: s.layout ?? LAYOUTS[i % LAYOUTS.length],
      blocks: [
        { id: newId('bl'), type: 'heading', content: s.title },
        ...s.bullets.map(b => ({ id: newId('bl'), type: 'paragraph' as const, content: b })),
      ],
    })),
  }
}

/**
 * Expands the user-APPROVED storyline into full deck blocks. The approved
 * storyline (titles/order/bullets) is passed as authoritative context so the
 * built slides always match what the user reviewed — the model expands,
 * it does not re-invent section titles or ordering.
 */
export async function expandDeck(state: SessionState): Promise<{ deck: DeckSkeleton; usedFallback: boolean }> {
  const storyline = state.approvedStoryline ?? []

  const system = `You are the copywriter for an AI deck-generation product. You are given a storyline the user has ALREADY APPROVED — you must expand it into rendered slide blocks WITHOUT changing section titles, order, or count. For each section, produce 2-4 blocks using ONLY these block types: "heading" (the section title, once), "paragraph" (prose expanding a bullet), "callout" (one key stat or quote, short), "card-group" (2-4 short cards with an emoji icon, a title, and a short value — use for comparisons/lists of items), "image" (a short one-line caption describing what the image should depict — do not describe pixels, just the subject). Choose one layout per section from: ${LAYOUTS.join(', ')} — unless a section already specifies "(layout: ...)", in which case you MUST use that exact layout. Call the emit_deck tool — do not respond in prose.`

  const user = `Deck topic: "${state.prompt}"\nApproved storyline (expand each section in this exact order):\n${storyline
    .map((s, i) => `${i + 1}. ${s.title}${s.layout ? ` (layout: ${s.layout})` : ''}\n   - ${s.bullets.join('\n   - ')}`)
    .join('\n')}`

  try {
    const result = await structuredCompletion(
      {
        model: MODELS.copywriter,
        temperature: 0.5,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        tools: [deckTool()],
        tool_choice: { type: 'function', function: { name: DECK_TOOL_NAME } },
      },
      DeckSkeletonSchema,
      { toolName: DECK_TOOL_NAME },
    )
    return {
      deck: {
        title: result.title,
        subtitle: result.subtitle,
        sections: result.sections.map((s, i) => ({
          title: s.title,
          // A user-chosen layout always wins over the model's pick —
          // the prompt asks for compliance but this guarantees it rather
          // than trusting the model to follow instructions.
          layout: storyline[i]?.layout ?? (s.layout as LayoutType),
          blocks: s.blocks.map(b => ({ id: newId('bl'), type: b.type, content: b.content, cards: b.cards })),
        })),
      },
      usedFallback: false,
    }
  } catch (err) {
    if (err instanceof StructuredOutputError || err instanceof OpenRouterError) {
      logError('copywriter.expandDeck', err)
      return { deck: fallbackDeck(state), usedFallback: true }
    }
    throw err
  }
}
