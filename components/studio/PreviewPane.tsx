'use client'

import { useEffect, useState, useCallback } from 'react'
import { BookOpen, History, FolderOpen, Play, Download, PanelLeft } from 'lucide-react'
import { CoverBlock } from '@/components/editor/blocks/CoverBlock'
import { ContentSection } from '@/components/editor/blocks/ContentSection'
import { InsertPanel } from '@/components/editor/InsertPanel'
import { BottomToolbar } from '@/components/editor/BottomToolbar'
import { PreviewToolbar } from './PreviewToolbar'
import { SlideThumbRail } from './SlideThumbRail'
import { MOCK_DECK, DeckSection, Block } from '@/lib/fixtures'
import { TOTAL_SLIDES } from '@/lib/studioScript'
import { PreviewState } from '@/lib/useStudioSession'

interface PreviewPaneProps {
  previewState: PreviewState
  revealedSlides: number[]
  isWorking: boolean
}

// Mirrors app/editor/page.tsx's makeBlock — kept local so Studio stays additive.
function makeBlock(blockType: string): Block {
  const id = `bl-${Date.now()}-${Math.random().toString(36).slice(2)}`
  if (blockType === 'card-group') {
    return { id, type: 'card-group', content: '', cards: [{ icon: '✨', title: 'New Card', value: '—' }] }
  }
  const defaults: Record<string, string> = {
    heading: 'New Heading', paragraph: 'Start writing here…', callout: 'Add a callout note…', image: 'Image placeholder',
  }
  return { id, type: blockType as Block['type'], content: defaults[blockType] ?? '' }
}

export function PreviewPane({ previewState, revealedSlides, isWorking }: PreviewPaneProps) {
  const [sections, setSections] = useState<DeckSection[]>(() =>
    MOCK_DECK.sections.map(s => ({ ...s, blocks: [...s.blocks] }))
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [autoFollow, setAutoFollow] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const isDone = previewState === 'done'

  // Follow the newest revealed slide while streaming
  useEffect(() => {
    if (autoFollow && revealedSlides.length > 0) {
      setActiveIndex(revealedSlides[revealedSlides.length - 1])
    }
  }, [revealedSlides, autoFollow])

  const handleSelect = useCallback((index: number) => {
    setAutoFollow(false)
    setActiveIndex(index)
  }, [])

  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const blockType = e.dataTransfer.getData('text/plain')
    if (!blockType || activeIndex === null || activeIndex === 0) return
    const sectionIdx = activeIndex - 1
    setSections(prev => prev.map((s, i) => (i === sectionIdx ? { ...s, blocks: [...s.blocks, makeBlock(blockType)] } : s)))
  }, [activeIndex])

  const showPlaceholder = previewState === 'idle' || previewState === 'preparing' || activeIndex === null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mini top bar */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
          borderBottom: '1px solid var(--divider)',
        }}
      >
        <PanelLeft size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', flex: 1 }}>
          {MOCK_DECK.title}
        </span>
        {isDone ? (
          <>
            <button style={miniBtnStyle}><Play size={12} fill="currentColor" /> Present</button>
            <button style={miniBtnStyle}><Download size={12} /> Export</button>
          </>
        ) : (
          <>
            <button style={miniBtnStyle}><History size={12} /> History</button>
            <button style={{ ...miniBtnStyle, padding: '5px 7px' }}><FolderOpen size={12} /></button>
          </>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {previewState !== 'idle' && (
          <SlideThumbRail revealedSlides={revealedSlides} activeIndex={activeIndex} onSelect={handleSelect} />
        )}

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: 'var(--bg-canvas)' }}>
          {isDone && <PreviewToolbar />}

          {!isDone && !showPlaceholder && (
            <div
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 'var(--r-pill)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                boxShadow: 'var(--sh-1)', fontSize: 11.5, color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} className="animate-pulse" />
              {isWorking ? 'Agent is editing…' : 'Agent is working…'}
            </div>
          )}

          <div
            onDragOver={e => { if (isDone) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true) } }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
            onDrop={handleCanvasDrop}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: isDone ? '56px 40px 96px' : '28px 40px',
              maxWidth: 820,
              width: '100%',
              margin: '0 auto',
              boxSizing: 'border-box',
              outline: isDragOver ? '2px dashed var(--accent)' : 'none',
              outlineOffset: -4,
              borderRadius: 'var(--r-lg)',
              transition: 'outline 0.12s',
            }}
          >
            {showPlaceholder ? (
              <div style={{
                height: '100%', minHeight: 320,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, color: 'var(--text-muted)',
              }}>
                <BookOpen size={28} strokeWidth={1.5} />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)' }}>
                  {previewState === 'idle' ? 'Waiting to start…' : 'Preparing your slides…'}
                </span>
              </div>
            ) : activeIndex === 0 ? (
              <CoverBlock
                title={MOCK_DECK.title}
                subtitle={MOCK_DECK.subtitle}
                author={MOCK_DECK.author}
                coverColor={MOCK_DECK.coverColor}
              />
            ) : (
              <ContentSection
                section={sections[activeIndex - 1]}
                isActive
                onClick={() => {}}
              />
            )}
          </div>

          {isDone && <BottomToolbar />}
        </div>

        {isDone && <InsertPanel />}
      </div>
    </div>
  )
}

const miniBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 10px',
  borderRadius: 'var(--r-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  fontSize: 11.5, color: 'var(--text-muted)',
  cursor: 'pointer', fontFamily: 'var(--font-body)',
}
