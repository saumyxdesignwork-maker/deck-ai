'use client'

import { DeckSection, Block, AspectRatio, aspectRatioCss } from '@/lib/fixtures'
import { Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

function HeadingBlock({ block }: { block: Block }) {
  const [val, setVal] = useState(block.content)
  return (
    <input
      value={val}
      onChange={e => setVal(e.target.value)}
      style={{
        display: 'block',
        width: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontFamily: 'var(--font-heading)',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--text)',
        lineHeight: 1.25,
        padding: 0,
        marginBottom: 12,
      }}
    />
  )
}

function ParagraphBlock({ block }: { block: Block }) {
  const [val, setVal] = useState(block.content)
  return (
    <textarea
      value={val}
      onChange={e => setVal(e.target.value)}
      rows={3}
      style={{
        display: 'block',
        width: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontFamily: 'var(--font-body)',
        fontSize: 16,          // ← was 13; body text min 16px
        color: 'var(--text)',
        lineHeight: 1.65,
        padding: 0,
        resize: 'none',
        marginBottom: 12,
      }}
    />
  )
}

function CalloutBlock({ block }: { block: Block }) {
  const [val, setVal] = useState(block.content)
  return (
    <div
      style={{
        borderLeft: '3px solid var(--accent)',
        paddingLeft: 14,
        paddingTop: 8,
        paddingBottom: 8,
        marginBottom: 12,
        background: 'var(--accent-soft)',
        borderRadius: '0 var(--r-sm) var(--r-sm) 0',
      }}
    >
      <textarea
        value={val}
        onChange={e => setVal(e.target.value)}
        rows={2}
        style={{
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

function ImageBlock({ block }: { block: Block }) {
  if (block.imageUrl) {
    return (
      <img
        src={block.imageUrl}
        alt={block.alt ?? block.content}
        style={{
          width: '100%',
          height: 180,
          borderRadius: 'var(--r-md)',
          objectFit: 'cover',
          marginBottom: 12,
          display: 'block',
        }}
      />
    )
  }

  return (
    <div
      style={{
        height: 180,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-muted)',
        border: '1px dashed var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
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
        marginBottom: 12,
      }}
    >
      {block.cards.map((card, i) => (
        <div
          key={i}
          style={{
            padding: '14px 14px',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 6 }}>{card.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3, fontFamily: 'var(--font-body)' }}>
            {card.title}
          </div>
          <div style={{
            fontSize: isStats ? 24 : 14,  // ← label was 12; raise to 14
            fontWeight: isStats ? 700 : 400,
            color: isStats ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: isStats ? 'var(--font-heading)' : 'var(--font-body)',
          }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderBlock(block: Block) {
  switch (block.type) {
    case 'heading':    return <HeadingBlock    block={block} />
    case 'paragraph':  return <ParagraphBlock  block={block} />
    case 'callout':    return <CalloutBlock    block={block} />
    case 'image':      return <ImageBlock      block={block} />
    case 'card-group': return <CardGroupBlock  block={block} />
    default:           return null
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
}

export function ContentSection({ section, isActive, onClick, onInsertBefore, aspectRatio, onDropBlock, mode = 'edit', selectedBlockIds, onToggleBlockSelect, onClearSelection, flagCount = 0 }: ContentSectionProps) {
  const [hovered, setHovered] = useState(false)
  const [dragOver, setDragOver] = useState(false)

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
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          padding: '36px 44px',
          border: '1.5px solid',
          borderColor: dragOver ? 'var(--accent)' : flagCount > 0 ? '#E8963C' : isActive ? 'var(--accent)' : 'var(--border)',
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
        {section.blocks.map(block => (
          <div key={block.id} style={{ position: 'relative' }}>
            {renderBlock(block)}
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
                  background: selectedBlockIds?.has(block.id) ? 'var(--accent-soft)' : 'transparent',
                  outline: selectedBlockIds?.has(block.id) ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.1s',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
