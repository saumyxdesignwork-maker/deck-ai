'use client'

import { DeckSection, Block } from '@/lib/fixtures'
import { Plus } from 'lucide-react'
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
    case 'heading':    return <HeadingBlock    key={block.id} block={block} />
    case 'paragraph':  return <ParagraphBlock  key={block.id} block={block} />
    case 'callout':    return <CalloutBlock    key={block.id} block={block} />
    case 'image':      return <ImageBlock      key={block.id} block={block} />
    case 'card-group': return <CardGroupBlock  key={block.id} block={block} />
    default:           return null
  }
}

interface ContentSectionProps {
  section: DeckSection
  isActive: boolean
  onClick: () => void
}

export function ContentSection({ section, isActive, onClick }: ContentSectionProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
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
          onClick={e => e.stopPropagation()}
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
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          padding: '36px 44px',
          border: '1.5px solid',
          borderColor: isActive ? 'var(--accent)' : 'var(--border)',
          marginBottom: 6,
          transition: 'border-color 0.15s',
          cursor: 'text',
        }}
      >
        {section.blocks.map(renderBlock)}
      </div>
    </div>
  )
}
