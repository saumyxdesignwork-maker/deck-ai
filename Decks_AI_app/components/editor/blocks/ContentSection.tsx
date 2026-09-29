'use client'

import { DeckSection, Block, AspectRatio, LayoutType, aspectRatioCss } from '@/lib/fixtures'
import { Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ChangeHighlight } from '@/lib/deckDiff'
import { motionPresets } from '@/lib/motion'
import { DeckThemeScope, useDeckTemplate, CornerMarks } from '@/components/deck/DeckThemeScope'

interface BlockEditHandlers {
  onChange: (text: string) => void
  onFocus: () => void
  onBlur: () => void
  /** Text alignment for this layout (e.g. centered "statement" slides). */
  align?: 'left' | 'center'
}

function HeadingBlock({ block, onChange, onFocus, onBlur, align = 'left' }: { block: Block } & BlockEditHandlers) {
  return (
    <input
      value={block.content}
      onChange={e => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label="Slide heading"
      style={{
        textAlign: align,
        display: 'block',
        width: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontFamily: 'var(--font-heading)',
        fontSize: align === 'center' ? 'var(--dt-h1, 28px)' : 'var(--dt-h2, 22px)',
        fontWeight: 'var(--dt-h-weight, 700)' as unknown as number,
        textTransform: 'var(--dt-h-case, none)' as React.CSSProperties['textTransform'],
        letterSpacing: 'var(--dt-h-track, normal)',
        color: 'var(--text)',
        lineHeight: 1.25,
        padding: 0,
        marginBottom: 'var(--dt-gap, 12px)',
      }}
    />
  )
}

function ParagraphBlock({ block, onChange, onFocus, onBlur, align = 'left' }: { block: Block } & BlockEditHandlers) {
  return (
    <textarea
      value={block.content}
      onChange={e => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      rows={3}
      aria-label="Slide text"
      style={{
        textAlign: align,
        display: 'block',
        width: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--dt-body, 16px)',          // ← was 13; body text min 16px
        color: 'var(--text)',
        lineHeight: 1.65,
        padding: 0,
        resize: 'none',
        marginBottom: 'var(--dt-gap, 12px)',
      }}
    />
  )
}

function CalloutBlock({ block, onChange, onFocus, onBlur, align = 'left' }: { block: Block } & BlockEditHandlers) {
  return (
    <div
      style={{
        borderLeft: '3px solid var(--accent)',
        paddingLeft: 14,
        paddingTop: 8,
        paddingBottom: 8,
        marginBottom: 'var(--dt-gap, 12px)',
        background: 'var(--accent-soft)',
        borderRadius: '0 var(--r-sm) var(--r-sm) 0',
      }}
    >
      <textarea
        value={block.content}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        rows={2}
        aria-label="Callout"
        style={{
          textAlign: align,
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          fontSize: 14,          // ← was 13; UI text 14px
          color: 'var(--accent)',
          fontWeight: 500,
          lineHeight: 1.55,
          padding: 0,
          resize: 'none',
        }}
      />
    </div>
  )
}

// A larger, italic pull-quote — distinct from CalloutBlock (a highlighted
// stat/aside): this is for an attributed or standalone quotation, styled to
// read as a statement rather than supporting detail.
function QuoteBlock({ block, onChange, onFocus, onBlur, align = 'left' }: { block: Block } & BlockEditHandlers) {
  return (
    <div style={{ marginBottom: 'var(--dt-gap, 12px)' }}>
      <span
        aria-hidden
        style={{
          display: 'block', fontFamily: 'var(--font-heading)', fontSize: 36,
          lineHeight: 0.5, color: 'var(--accent)', opacity: 0.5, marginBottom: 6,
          textAlign: align,
        }}
      >
        "
      </span>
      <textarea
        value={block.content}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        rows={2}
        aria-label="Quote"
        style={{
          textAlign: align,
          display: 'block',
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          fontSize: 20,
          fontWeight: 500,
          color: 'var(--text)',
          lineHeight: 1.4,
          padding: 0,
          resize: 'none',
        }}
      />
    </div>
  )
}

function ImageBlock({ block }: { block: Block }) {
  if (block.imageUrl) {
    return (
      <img
        src={block.imageUrl}
        alt={block.alt ?? block.content}
        // Required for html-to-image (deck export) to read this image back
        // out of the canvas — without it, a same-app-but-different-host
        // image (the backend's own /assets URL) taints the canvas even
        // though the server already sends the matching CORS header.
        crossOrigin="anonymous"
        style={{
          width: '100%',
          height: 180,
          borderRadius: 'var(--dt-img-radius, var(--r-md))',
          border: 'var(--dt-img-frame, none)',
          filter: 'var(--dt-img-filter, none)',
          mixBlendMode: 'var(--dt-img-blend, normal)' as React.CSSProperties['mixBlendMode'],
          objectFit: 'cover',
          marginBottom: 'var(--dt-gap, 12px)',
          display: 'block',
          boxSizing: 'border-box',
        }}
      />
    )
  }

  return (
    <div
      style={{
        height: 180,
        borderRadius: 'var(--dt-img-radius, var(--r-md))',
        background: 'var(--surface-muted)',
        border: '1px dashed var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--dt-gap, 12px)',
        color: 'var(--text-muted)',
        fontSize: 14,           // ← was 12; raise to 14
      }}
    >
      📷 {block.content}
    </div>
  )
}

function CardGroupBlock({ block }: { block: Block }) {
  if (!block.cards) return null
  const isStats = block.cards.length <= 3
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isStats
          ? `repeat(${block.cards.length}, 1fr)`
          : 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 'var(--dt-gap, 12px)',
      }}
    >
      {block.cards.map((card, i) => (
        <div
          key={i}
          style={{
            padding: '14px 14px',
            borderRadius: 'var(--dt-card-radius, var(--r-md))',
            background: 'var(--dt-card-bg, var(--surface-muted))',
            border: 'var(--dt-card-border, 1px solid var(--border))',
            boxShadow: 'var(--dt-card-shadow, none)',
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 6 }}>{card.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3, fontFamily: 'var(--font-body)' }}>
            {card.title}
          </div>
          <div style={{
            fontSize: isStats ? 24 : 14,  // ← label was 12; raise to 14
            fontWeight: isStats ? 700 : 400,
            color: isStats ? 'var(--dt-stat-color, var(--accent))' : 'var(--text-muted)',
            fontFamily: isStats ? 'var(--dt-numeric-font, var(--font-heading))' : 'var(--font-body)',
          }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderBlock(block: Block, handlers: BlockEditHandlers) {
  switch (block.type) {
    case 'heading':    return <HeadingBlock    block={block} {...handlers} />
    case 'paragraph':  return <ParagraphBlock  block={block} {...handlers} />
    case 'callout':    return <CalloutBlock    block={block} {...handlers} />
    case 'quote':      return <QuoteBlock      block={block} {...handlers} />
    case 'image':      return <ImageBlock      block={block} />
    case 'card-group': return <CardGroupBlock  block={block} />
    default:           return null
  }
}

// ── Layouts ─────────────────────────────────────────────────────────────
// Pure CSS arrangement of the section's existing blocks (block order and
// content never change) so the inspector's Layout tab has a visible,
// undoable effect on the canvas.
function layoutContainerStyle(layout: LayoutType): React.CSSProperties {
  switch (layout) {
    case 'statement':
      return { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%', maxWidth: 560, margin: '0 auto' }
    case 'media-text':
      return { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, alignContent: 'start' }
    case 'bento':
      return { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 14, alignContent: 'start' }
    case 'heading-media':
    case 'data':
      return { display: 'flex', flexDirection: 'column' }
    // Bottom-aligned so the heading sits low on the slide, like a real
    // section-break card — the (usually short) supporting paragraph, if
    // any, trails just above it.
    case 'divider':
      return { display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100%', maxWidth: 640 }
    // Heading/callout run full-width above two columns of body content —
    // whatever blocks come after them alternate left/right.
    case 'two-column':
      return { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 32, alignContent: 'start' }
    // Centered like a closing/CTA card: heading, then a short pitch, then
    // an optional callout styled as the call-to-action itself.
    case 'closing':
      return { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100%', maxWidth: 560, margin: '0 auto' }
    case 'key-points':
    default:
      return {}
  }
}

function layoutItemStyle(layout: LayoutType, block: Block, columnIndex = 0): React.CSSProperties {
  const isMedia = block.type === 'image'
  const isHeading = block.type === 'heading'
  const isFigure = block.type === 'card-group' || block.type === 'callout'
  switch (layout) {
    case 'heading-media':
      return { order: isHeading ? 0 : isMedia ? 1 : 2 }
    case 'media-text':
      return isMedia ? { gridColumn: 1, gridRow: '1 / span 20' } : { gridColumn: 2 }
    case 'bento':
      return isHeading || block.type === 'card-group' ? { gridColumn: '1 / -1' } : {}
    case 'data':
      return { order: isHeading ? 0 : isFigure ? 1 : 2 }
    // Heading spans both columns up top; the rest alternate left/right in
    // block order, so two paragraphs (or two card-groups) land side by side.
    case 'two-column':
      return isHeading ? { gridColumn: '1 / -1' } : { gridColumn: columnIndex % 2 === 0 ? 1 : 2 }
    default:
      return {}
  }
}

interface ContentSectionProps {
  section: DeckSection
  isActive: boolean
  onClick: () => void
  onInsertBefore?: () => void
  /** Locks the slide's shape (defaults to 16:9). Content that doesn't fit
   * scrolls within the box rather than pushing it taller or bleeding
   * outside its bounds. */
  aspectRatio?: AspectRatio
  /** Called with the dropped block type when an Insert-panel item is
   * dropped directly onto THIS slide's card — not the canvas at large. */
  onDropBlock?: (blockType: string) => void
  /** 'select' overlays each block with a click target for multi-select
   * instead of the normal text-editing interaction. Defaults to 'edit'. */
  mode?: 'select' | 'edit'
  selectedBlockIds?: Set<string>
  onToggleBlockSelect?: (blockId: string, additive: boolean) => void
  /** Clicking the card background (not a block) while in select mode clears
   * the current selection, mirroring how selection tools usually work. */
  onClearSelection?: () => void
  /** Content-verification issues found for this section (see PreviewToolbar's
   * "Verify content") — shown as a small warning badge, not inline per block. */
  flagCount?: number
  /** Inline text editing — controlled off the authoritative deck (see
   * lib/useDeckEditor.ts) so edits are captured, undoable, and never lost. */
  onUpdateBlockContent?: (blockId: string, text: string) => void
  onBeginBlockEdit?: () => void
  onCommitBlockEdit?: () => void
  /** Blocks an external change (agent edit / AI rewrite) just altered — each
   * gets a brief tint cue; nothing else on the canvas moves. */
  highlight?: ChangeHighlight | null
}

export function ContentSection({ section, isActive, onClick, onInsertBefore, aspectRatio, onDropBlock, mode = 'edit', selectedBlockIds, onToggleBlockSelect, onClearSelection, flagCount = 0, onUpdateBlockContent, onBeginBlockEdit, onCommitBlockEdit, highlight }: ContentSectionProps) {
  const [hovered, setHovered] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  // Blocks present at first render never animate in; only blocks added
  // later (Insert panel drop, duplicate, agent add-block) get an entrance.
  const [initialBlockIds] = useState(() => new Set(section.blocks.map(b => b.id)))
  const m = motionPresets(useReducedMotion())
  const template = useDeckTemplate()
  const layout = section.layout ?? 'key-points'
  const align = layout === 'statement' || layout === 'closing' ? 'center' : 'left'

  return (
    <div
      onClick={() => { onClick(); if (mode === 'select') onClearSelection?.() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Between-section insert control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
        <button
          onClick={e => { e.stopPropagation(); onInsertBefore?.() }}
          title="Insert a new slide here"
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '1.5px solid var(--accent)',
            background: 'var(--surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            flexShrink: 0,
          }}
        >
          <Plus size={12} />
        </button>
        <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
      </div>

      <div
        onDragOver={e => {
          if (!onDropBlock) return
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'copy'
          setDragOver(true)
        }}
        onDragLeave={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
        }}
        onDrop={e => {
          if (!onDropBlock) return
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
          const blockType = e.dataTransfer.getData('text/plain')
          if (blockType) onDropBlock(blockType)
        }}
        style={{
          position: 'relative',
          // Border/radius/frame styling come from the deck TEMPLATE (not
          // the app's Craft/Night/Warm theme) via `template.*` directly in
          // JS — this frame div sits OUTSIDE the DeckThemeScope below, so a
          // CSS-var override inside the scope (for slide content) can't
          // reach it either way; reading the template object here keeps the
          // frame's own accent/border in sync with the content without
          // relying on variable cascade. The flag-orange for verify issues
          // stays a fixed, template-independent warning color.
          borderRadius: template.surfaces.slideRadius,
          border: '1.5px solid',
          borderColor: dragOver ? template.colors.accent : flagCount > 0 ? '#E8963C' : isActive ? template.colors.accent : template.colors.border,
          borderStyle: dragOver ? 'dashed' : 'solid',
          marginBottom: 6,
          transition: 'border-color 0.15s',
          cursor: mode === 'select' ? 'default' : 'text',
          aspectRatio: aspectRatioCss(aspectRatio),
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {flagCount > 0 && (
          <div
            title={`${flagCount} content issue${flagCount > 1 ? 's' : ''} — see Verify content in chat`}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 1,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
              background: '#E8963C', color: 'white', fontSize: 11, fontWeight: 600,
            }}
          >
            <TriangleAlert size={11} />
            {flagCount}
          </div>
        )}
        {template.surfaces.cornerMarks && <CornerMarks color={template.colors.border} />}
        {/* Everything below is slide CONTENT, themed by the deck template —
            not the app's own theme. */}
        <DeckThemeScope layout={layout}>
        {/* Layout change = quick crossfade of this slide's content only. */}
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={layout}
          data-layout={layout}
          {...m.fade}
          exit={{ opacity: 0, transition: m.exit }}
          transition={m.content}
          style={layoutContainerStyle(layout)}
        >
        {(() => {
          // Only meaningful for 'two-column': counts non-heading blocks so
          // the first body block lands left, the second right, and so on —
          // the heading itself always spans both columns.
          let bodyIndex = -1
          return section.blocks.map(block => {
          if (block.type !== 'heading') bodyIndex += 1
          const isSelected = selectedBlockIds?.has(block.id) ?? false
          const isNew = !initialBlockIds.has(block.id)
          const isChanged = !!highlight?.ids.has(block.id)
          return (
            <motion.div
              key={block.id}
              data-block-id={block.id}
              data-entering={isNew || undefined}
              initial={isNew ? m.arrive.initial : false}
              animate={m.arrive.animate}
              transition={m.content}
              style={{ position: 'relative', ...layoutItemStyle(layout, block, bodyIndex) }}
            >
              {isChanged && (
                // Keyed on the highlight so the cue replays on each new change.
                <span key={highlight!.key} aria-hidden data-changed className="dk-changed-cue" />
              )}
              {renderBlock(block, {
                onChange: text => onUpdateBlockContent?.(block.id, text),
                onFocus: () => onBeginBlockEdit?.(),
                onBlur: () => onCommitBlockEdit?.(),
                align,
              })}
              {mode === 'select' && (
                <div
                  onClick={e => {
                    e.stopPropagation()
                    onToggleBlockSelect?.(block.id, e.shiftKey || e.metaKey || e.ctrlKey)
                  }}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    cursor: 'pointer',
                    borderRadius: 'var(--r-sm)',
                    background: isSelected ? 'var(--accent-soft)' : 'transparent',
                    outline: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.1s',
                  }}
                />
              )}
            </motion.div>
          )
        })
        })()}
        </motion.div>
        </AnimatePresence>
        </DeckThemeScope>
      </div>
    </div>
  )
}
