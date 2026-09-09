'use client'

import { useState } from 'react'
import {
  Type, SquareStack, Image, BarChart3, StickyNote,
  Heading1, AlignLeft, Quote, Flame, Hash,
  GripVertical, ChevronDown, ChevronRight,
} from 'lucide-react'

export const BLOCK_GROUPS = [
  {
    label: 'Text',
    icon: Type,
    blocks: [
      { icon: Heading1, label: 'Heading',   blockType: 'heading' },
      { icon: AlignLeft, label: 'Paragraph', blockType: 'paragraph' },
      { icon: Flame,     label: 'Callout',   blockType: 'callout' },
      { icon: Quote,     label: 'Quote',     blockType: 'paragraph' },
    ],
  },
  {
    label: 'Cards',
    icon: SquareStack,
    blocks: [
      { icon: Type,      label: 'Text Card',   blockType: 'card-group' },
      { icon: Hash,      label: 'Number Card', blockType: 'card-group' },
      { icon: Flame,     label: 'Icon Card',   blockType: 'card-group' },
      { icon: BarChart3, label: 'Stat Card',   blockType: 'card-group' },
    ],
  },
  {
    label: 'Media',
    icon: Image,
    blocks: [
      { icon: Image,     label: 'Image',   blockType: 'image' },
      { icon: SquareStack, label: 'Embed', blockType: 'image' },
      { icon: SquareStack, label: 'Video', blockType: 'image' },
      { icon: SquareStack, label: 'Mockup', blockType: 'image' },
    ],
  },
  {
    label: 'Data',
    icon: BarChart3,
    blocks: [
      { icon: BarChart3,   label: 'Chart',      blockType: 'card-group' },
      { icon: SquareStack, label: 'Table',      blockType: 'paragraph' },
      { icon: Type,        label: 'Code Block', blockType: 'paragraph' },
    ],
  },
  {
    label: 'Utility',
    icon: StickyNote,
    blocks: [
      { icon: StickyNote,  label: 'Sticky Note', blockType: 'callout' },
      { icon: SquareStack, label: 'Divider',     blockType: 'paragraph' },
      { icon: SquareStack, label: 'Spacer',      blockType: 'paragraph' },
    ],
  },
]

const TABS = ['Insert', 'Format', 'Style', 'Info'] as const

interface InsertPanelProps {
  width?: number
}

export function InsertPanel({ width }: InsertPanelProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Insert')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Text', 'Cards']))
  const [dragging, setDragging] = useState<string | null>(null)

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <div
      style={{
        width: width ?? 'var(--insert-panel-w)',
        flexShrink: 0,
        height: '100%',
        background: 'var(--surface-panel, var(--surface))',
        borderLeft: '1px solid var(--divider)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--divider)',
          padding: '0 8px',
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 4px',
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              borderBottom: '2px solid',
              borderColor: activeTab === tab ? 'var(--text)' : 'transparent',
              transition: 'all 0.12s',
              fontFamily: 'var(--font-body)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {activeTab === 'Insert' ? (
          <>
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-muted)',
                padding: '4px 14px 8px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Drag and drop any item to the canvas
            </p>

            {BLOCK_GROUPS.map(({ label, icon: GroupIcon, blocks }) => (
              <div key={label}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(label)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <GroupIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'left' }}>{label}</span>
                  {expandedGroups.has(label)
                    ? <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                    : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                </button>

                {/* Block rows */}
                {expandedGroups.has(label) && (
                  <div style={{ marginBottom: 4 }}>
                    {blocks.map(({ icon: Icon, label: blockLabel, blockType }) => (
                      <div
                        key={blockLabel}
                        draggable
                        onDragStart={e => {
                          // Store both the display label and the internal block type
                          e.dataTransfer.setData('text/plain', blockType)
                          e.dataTransfer.setData('application/x-block-label', blockLabel)
                          e.dataTransfer.effectAllowed = 'copy'
                          setDragging(blockLabel)
                        }}
                        onDragEnd={() => setDragging(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 14px 6px 28px',
                          cursor: 'grab',
                          transition: 'background 0.1s',
                          background: dragging === blockLabel ? 'var(--accent-soft)' : 'transparent',
                          opacity: dragging === blockLabel ? 0.6 : 1,
                        }}
                        onMouseEnter={e => {
                          if (dragging !== blockLabel)
                            (e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)'
                        }}
                        onMouseLeave={e => {
                          if (dragging !== blockLabel)
                            (e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, fontFamily: 'var(--font-body)' }}>
                          {blockLabel}
                        </span>
                        <GripVertical size={13} style={{ color: 'var(--text-disabled)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80%',
              color: 'var(--text-muted)',
              fontSize: 12,
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>🔜</span>
            <span>{activeTab} panel coming soon</span>
          </div>
        )}
      </div>
    </div>
  )
}
