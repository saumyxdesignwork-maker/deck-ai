import { z } from 'zod'
import { MODELS } from '../config/models.js'
import { structuredCompletion, StructuredOutputError } from '../openrouter/json.js'
import { OpenRouterError } from '../openrouter/client.js'
import { logError } from '../lib/log.js'
import { newId } from '../lib/ids.js'
import type { SessionState } from '../session/store.js'
import type { OutlineSection } from '../contract/chat.js'
import type { LayoutType, Block, Archetype } from '../contract/deck.js'
import { styleGuidance, LAYOUT_RULES, ARCHETYPES, ARCHETYPE_RULES, ARCHETYPE_LAYOUT } from '../contract/deck.js'
import type { DeckDataset } from '../contract/data.js'

const LAYOUTS = ['statement', 'key-points', 'heading-media', 'media-text', 'bento', 'data', 'divider', 'two-column', 'closing'] as const satisfies readonly LayoutType[]
// The fallback deck (used only when the expandDeck model call fails) cycles
// through layouts positionally — restricted to the original content
// layouts so a network hiccup never turns an arbitrary section into a bare
// "divider" or "closing" slide.
const FALLBACK_LAYOUTS: LayoutType[] = ['statement', 'key-points', 'heading-media', 'media-text', 'bento', 'data']

// ── Data grounding ──────────────────────────────────────────────────────
// Shared between draftStoryline and expandDeck so a connected dataset (see
// contract/data.ts) shapes both the outline and the final copy the same way.

const GROUNDING_INSTRUCTIONS =
  'The user has attached real data (below). Ground the deck in it: use its actual figures instead of inventing numbers, and where a value would naturally appear (a stat, a comparison, a trend), pull it from this data. If the data does not cover something the deck seems to need, say so plainly rather than making a number up — a vague or qualitative statement is always better than a fabricated one. Do not silently drop the fact that a claim is not backed by the data.'

function formatDatasetForPrompt(dataset: DeckDataset): string {
  const usableColumns = dataset.columns.filter(c => c.role !== 'ignore').map(c => c.name)
  const rowLines = dataset.rows.map((row, i) => `${i + 1}. ${usableColumns.map(name => `${name}=${row[name] ?? ''}`).join(', ')}`)
  return [
    `Attached data — source: "${dataset.source}", captured ${dataset.capturedAt}:`,
    `Columns: ${usableColumns.join(', ')}`,
    ...rowLines,
  ].join('\n')
}

// ── Storyline (outline) ──────────────────────────────────────────────────

const StorylineSchema = z.object({
  sections: z
    .array(
      z.object({
        title: z.string(),
        bullets: z.array(z.string()).min(2).max(5),
        // Optional at the schema level so one omitted shape doesn't throw
        // away the whole outline — an unset shape is inferred from the
        // slide's blocks at render time, same as older decks.
        archetype: z.enum(ARCHETYPES).optional(),
      }),
    )
    .min(3)
    .max(10),
})

/** How to choose each slide's shape — the slide's HTML structure, decided at
 * outline time before any copy exists; expandDeck then writes content to fit. */
const ARCHETYPE_GUIDE = `For every section also pick its slide type ("archetype") — the shape of the slide that will be built:
- "text": an idea explained in prose (the default for narrative or explanation).
- "bullets": 3-6 parallel points, features, steps or reasons.
- "metric": the point is carried by 2-4 numbers (results, market size, growth, KPIs).
- "quote": one standout line from a customer, expert or leader — only when there's a real quote to feature.
- "section": a chapter break between major parts — only in decks of 7+ sections, at most two.
- "closing": the final slide when the deck ends with an ask, next step or call to action.
Vary the types to suit the content; avoid the same type more than twice in a row.`

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
      description: 'Emit the deck storyline as a list of sections, each with a title, bullets, and the slide type it will be built as.',
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
                archetype: { type: 'string', enum: ARCHETYPES as unknown as string[], description: 'The slide type this section will be built as.' },
              },
              required: ['title', 'bullets', 'archetype'],
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

  const system = `You are the copywriter for an AI deck-generation product. Draft a presentation storyline: a sequence of sections, each with a punchy title and 2-5 concise, high-impact bullet points. Write for ${directive?.audienceGoal ?? 'a general professional audience'} in a ${directive?.tone ?? 'clear, confident'} tone. Avoid repetitive phrasing across sections.${state.dataset ? ` ${GROUNDING_INSTRUCTIONS}` : ''}\n\n${ARCHETYPE_GUIDE}\n\nCall the emit_storyline tool with your result — do not respond in prose.`

  const clarifyAnswers = state.clarifyAnswers?.join('; ') ?? 'unspecified'
  const userParts = [`Deck topic: "${state.prompt}"`, styleGuidance(state.style), `Answers to clarifying questions: "${clarifyAnswers}"`, `Target section count: ${sectionCount}`]
  if (notes) userParts.push(`Additional notes for this revision: ${notes}`)
  if (state.dataset) userParts.push(formatDatasetForPrompt(state.dataset))

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
  type: z.enum(['heading', 'paragraph', 'card-group', 'image', 'callout', 'quote']),
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
        layout: z.enum(LAYOUTS),
        blocks: z.array(BlockSchema).min(1).max(6),
      }),
    )
    .min(1),
})

export interface DeckSkeleton {
  title: string
  subtitle: string
  sections: Array<{ title: string; layout: LayoutType; archetype?: Archetype; blocks: Block[] }>
}

/** A section's final layout: a user-picked layout always wins, then the one
 * its slide type implies, then the model's pick (or the fallback cycle). */
function resolveLayout(s: { layout?: LayoutType; archetype?: Archetype } | undefined, otherwise: LayoutType): LayoutType {
  return s?.layout ?? (s?.archetype ? ARCHETYPE_LAYOUT[s.archetype] : otherwise)
}

/** The shape rule for one approved section in the expandDeck prompt — the
 * slide type's rule when it has one (the HTML structure the copy must fill),
 * else a user-picked layout's rule, else nothing (the model chooses). */
function shapeRule(s: OutlineSection): string {
  if (s.archetype) return ` (slide type: ${s.archetype} — must contain: ${ARCHETYPE_RULES[s.archetype]})`
  if (s.layout) return ` (layout: ${s.layout} — must contain: ${LAYOUT_RULES[s.layout]})`
  return ''
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
                      type: { type: 'string', enum: ['heading', 'paragraph', 'card-group', 'image', 'callout', 'quote'] },
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
      layout: resolveLayout(s, FALLBACK_LAYOUTS[i % FALLBACK_LAYOUTS.length]),
      ...(s.archetype ? { archetype: s.archetype } : {}),
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

  const system = `You are the copywriter for an AI deck-generation product. You are given a storyline the user has ALREADY APPROVED — you must expand it into rendered slide blocks WITHOUT changing section titles, order, or count. For each section, produce the blocks its shape rule calls for (2-4 when it has none) using ONLY these block types: "heading" (the section title, at most once — omit it where a rule says so), "paragraph" (prose expanding a bullet), "callout" (one key stat or quote, short), "quote" (a standalone attributed or pull quote, short), "card-group" (2-4 short cards with an emoji icon, a title, and a short value — use for comparisons/lists of items), "image" (a short one-line caption describing what the image should depict — do not describe pixels, just the subject). Choose one layout per section from: ${LAYOUTS.join(', ')}. When a section specifies "(slide type: ...)", that slide's structure is already decided — write its blocks to fill exactly that shape, following the "must contain" rule given for it (its layout is set from the slide type, so any layout you emit for it is ignored). When a section instead specifies "(layout: ...)", you MUST use that exact layout AND follow the shape rule given for it.${state.dataset ? ` ${GROUNDING_INSTRUCTIONS} A "data" or "card-group" layout is a natural home for attached figures — cite the source in a callout or caption when you use one (e.g. "Source: ${state.dataset.source}").` : ''} Call the emit_deck tool — do not respond in prose.`

  const userParts = [
    `Deck topic: "${state.prompt}"`,
    styleGuidance(state.style),
    `Approved storyline (expand each section in this exact order):\n${storyline
      .map((s, i) => `${i + 1}. ${s.title}${shapeRule(s)}\n   - ${s.bullets.join('\n   - ')}`)
      .join('\n')}`,
  ]
  if (state.dataset) userParts.push(formatDatasetForPrompt(state.dataset))
  const user = userParts.join('\n\n')

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
          // A user-chosen layout (or the one the approved slide type implies)
          // always wins over the model's pick — the prompt asks for
          // compliance but this guarantees it rather than trusting the model.
          layout: resolveLayout(storyline[i], s.layout as LayoutType),
          ...(storyline[i]?.archetype ? { archetype: storyline[i].archetype } : {}),
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
