import { z } from 'zod'
import { MODELS } from '../config/models.js'
import { structuredCompletion, StructuredOutputError } from '../openrouter/json.js'
import { OpenRouterError } from '../openrouter/client.js'
import { logError } from '../lib/log.js'
import type { DeckData } from '../contract/deck.js'

const BLOCK_TYPES = ['heading', 'paragraph', 'card-group', 'image', 'callout', 'quote'] as const
const LAYOUTS = ['statement', 'key-points', 'heading-media', 'media-text', 'bento', 'data'] as const

// The cover (deck.title/deck.subtitle) isn't a real section — it's addressed
// via these two fixed pseudo-ids so the planner can target it with the same
// 'rewrite' op as any other block, instead of the cover being invisible to
// it (and instructions like "punch up the cover subtitle" silently landing
// on the nearest real paragraph instead).
export const COVER_SECTION_ID = 'cover'
export const COVER_TITLE_BLOCK_ID = 'cover-title'
export const COVER_SUBTITLE_BLOCK_ID = 'cover-subtitle'

const OpSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('rewrite'), sectionId: z.string(), blockId: z.string(), instruction: z.string() }),
  z.object({
    kind: z.literal('add-block'),
    sectionId: z.string(),
    blockType: z.enum(BLOCK_TYPES),
    afterBlockId: z.string().optional(),
    // The actual text this new block should contain — without it, add-block
    // has no way to satisfy "add a callout ABOUT X" and would just insert a
    // generic unfilled placeholder.
    content: z.string().optional(),
  }),
  z.object({ kind: z.literal('delete-block'), blockId: z.string() }),
  z.object({ kind: z.literal('reorder-section'), sectionId: z.string(), toIndex: z.number().int().min(0) }),
  z.object({ kind: z.literal('set-layout'), sectionId: z.string(), layout: z.enum(LAYOUTS) }),
])

export type Op = z.infer<typeof OpSchema>

const PlanResultSchema = z.object({
  summary: z.string(),
  operations: z.array(OpSchema).max(20),
})

export type PlanResult = z.infer<typeof PlanResultSchema>

const PLAN_TOOL_NAME = 'emit_plan'

function planTool() {
  return {
    type: 'function' as const,
    function: {
      name: PLAN_TOOL_NAME,
      description: 'Emit a plan of deck-edit operations that satisfies the user instruction.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'One short sentence describing the planned change, written for the user (e.g. "Tightening the copy on slide 3 and adding a stat callout").' },
          operations: {
            type: 'array',
            maxItems: 20,
            description: 'Empty if the instruction asks for something out of scope (e.g. images, theme colors) or nothing changeable was found.',
            items: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['rewrite', 'add-block', 'delete-block', 'reorder-section', 'set-layout'] },
                sectionId: { type: 'string', description: 'Required for rewrite, add-block, reorder-section, set-layout.' },
                blockId: { type: 'string', description: 'Required for rewrite and delete-block.' },
                instruction: { type: 'string', description: 'Required for rewrite — the specific change to make to that block\'s text.' },
                blockType: { type: 'string', enum: BLOCK_TYPES as unknown as string[], description: 'Required for add-block.' },
                afterBlockId: { type: 'string', description: 'Optional for add-block — insert after this block id (else appended to the section).' },
                content: { type: 'string', description: 'Required for add-block unless blockType is "image" — the actual text to put in the new block, written to satisfy the instruction (e.g. the real callout copy, not a placeholder).' },
                toIndex: { type: 'integer', minimum: 0, description: 'Required for reorder-section — the new zero-based section index.' },
                layout: { type: 'string', enum: LAYOUTS as unknown as string[], description: 'Required for set-layout.' },
              },
              required: ['kind'],
            },
          },
        },
        required: ['summary', 'operations'],
      },
    },
  }
}

/** Compact, token-cheap outline of the deck for the planner prompt — titles,
 * layouts, and block ids/content previews, not the full deck (images/colors
 * are irrelevant to planning a copy/structure edit). */
function summarizeDeck(deck: DeckData, activeSectionId?: string): string {
  const cover =
    `Slide 0 (COVER) — sectionId=${COVER_SECTION_ID}\n` +
    `    - blockId=${COVER_TITLE_BLOCK_ID} type=heading content="${deck.title.slice(0, 120)}"\n` +
    `    - blockId=${COVER_SUBTITLE_BLOCK_ID} type=paragraph content="${deck.subtitle.slice(0, 120)}"`

  const rest = deck.sections
    .map((s, i) => {
      const marker = s.id === activeSectionId ? ' [ACTIVE SLIDE]' : ''
      const blocks = s.blocks
        .map(b => `    - blockId=${b.id} type=${b.type} content="${(b.content || (b.cards ?? []).map(c => `${c.title}: ${c.value}`).join('; ')).slice(0, 120)}"`)
        .join('\n')
      return `Slide ${i + 1} — sectionId=${s.id} title="${s.title}" layout=${s.layout}${marker}\n${blocks}`
    })
    .join('\n\n')

  return `${cover}\n\n${rest}`
}

/**
 * Coordinator tier for the /edit pipeline. Classifies a free-form edit
 * instruction against the deck's current structure into a small ordered
 * plan of operations the Editor tier will execute. Returns an empty
 * operations array (not an error) when the instruction doesn't map to a
 * real change — callers should treat that as "nothing to do", not a failure.
 */
export async function planEdit(instruction: string, deck: DeckData, activeSectionId?: string): Promise<{ plan: PlanResult; usedFallback: boolean }> {
  const system = `You are the Coordinator for an AI deck-editing product. The user has a finished slide deck open and typed a free-form instruction asking for a change. Your job is to turn that instruction into a short ordered plan of concrete operations over the deck's existing sections and blocks — you do not write the new copy yourself, you only decide WHAT should change and WHERE.

Available operations:
- rewrite: change one block's text per a specific instruction (pass the instruction through, sharpened if vague — e.g. "punch this up").
- add-block: insert a new block (heading/paragraph/card-group/image/callout/quote) into a section — you must also write its actual "content" (the real copy that satisfies the instruction, e.g. the actual callout sentence), never leave it blank; content is optional only when blockType is "image".
- delete-block: remove a block.
- reorder-section: move a slide to a new zero-based index (index 0 among CONTENT slides — the cover isn't counted and can't be reordered).
- set-layout: change a slide's layout.

The deck outline below numbers the cover as Slide 0 and content slides starting at Slide 1 — "the first content slide"/"first slide" (as opposed to "the cover") means Slide 1. The cover has its own fixed ids (sectionId="cover", blockId="cover-title"/"cover-subtitle") — use those for a rewrite when the instruction is about the cover title or subtitle; it has no other operations available (no add-block/delete-block/set-layout on the cover).

Rules:
- Prefer the section marked [ACTIVE SLIDE] when the instruction is ambiguous about scope (e.g. "make this shorter" means the active slide); only touch other slides when the instruction clearly means the whole deck (e.g. "tighten the whole deck", "renumber the sections").
- Only emit operations for things you can see in the deck outline below — use the exact sectionId/blockId values given, never invent ids.
- Image edits and color/theme edits are OUT OF SCOPE — never emit an operation for them; if the instruction ONLY asks for one of those, return an empty operations array and say so in the summary.
- If the instruction is a pure review/check ask ("does this look right?", "check my deck") with nothing to change, return an empty operations array.
- Keep the plan minimal — do not touch blocks the user didn't ask about.
- Write "summary" as one short sentence in first person describing what you're about to do (or why nothing changes), for display to the user.
Call the emit_plan tool — do not respond in prose.`

  const user = `Deck outline:\n${summarizeDeck(deck, activeSectionId)}\n\nUser instruction: "${instruction}"`

  try {
    const result = await structuredCompletion(
      {
        model: MODELS.orchestrator,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        tools: [planTool()],
        tool_choice: { type: 'function', function: { name: PLAN_TOOL_NAME } },
      },
      PlanResultSchema,
      { toolName: PLAN_TOOL_NAME },
    )
    return { plan: result, usedFallback: false }
  } catch (err) {
    if (err instanceof StructuredOutputError || err instanceof OpenRouterError) {
      logError('planner.planEdit', err)
      return { plan: { summary: "I couldn't work out a change to make for that.", operations: [] }, usedFallback: true }
    }
    throw err
  }
}
