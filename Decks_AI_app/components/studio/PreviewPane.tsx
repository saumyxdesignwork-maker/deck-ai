'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { BookOpen, History, FolderOpen, Play, Download, PanelLeft, Trash2, Copy, X } from 'lucide-react'
import { CoverBlock } from '@/components/editor/blocks/CoverBlock'
import { ContentSection } from '@/components/editor/blocks/ContentSection'
import { InsertPanel } from '@/components/editor/InsertPanel'
import { PresentationMode } from '@/components/editor/PresentationMode'
import { PreviewToolbar, CanvasMode } from './PreviewToolbar'
import { SlideThumbRail } from './SlideThumbRail'
import { OutlineReviewPanel } from './OutlineReviewPanel'
import { ResizeHandle } from '@/components/shared/ResizeHandle'
import { MOCK_DECK, DeckData, DeckSection, Block } from '@/lib/fixtures'
import { OutlineSection, VerifyFlag } from '@/lib/studioScript'
import { PreviewState } from '@/lib/useStudioSession'
import { useResizableWidth } from '@/lib/useResizableWidth'

const MIN_INSERT_WIDTH = 220
const MAX_INSERT_WIDTH = 480
const DEFAULT_INSERT_WIDTH = 276

interface PreviewPaneProps {
  previewState: PreviewState
  revealedSlides: number[]
  deck: DeckData | null
  isWorking: boolean
  outlinePending: { id: string; sections: OutlineSection[] } | null
  onApproveOutline: (sections: OutlineSection[]) => void
  onRegenerateOutline: () => void
  verifyFlags: VerifyFlag[]
  isVerifying: boolean
  onVerify: () => void
}

// Mirrors app/editor/page.tsx's makeBlock/makeDefaultSection — kept local so Studio stays additive.
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

function makeDefaultSection(): DeckSection {
  return {
    id: `ds-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: 'New Section',
    layout: 'key-points',
    thumbnailColor: '#F3F4F6',
    blocks: [
      { id: `bl-h-${Date.now()}`, type: 'heading',   content: 'New Section' },
      { id: `bl-p-${Date.now()}`, type: 'paragraph', content: 'Start writing your content here…' },
    ],
  }
}

export function PreviewPane({ previewState, revealedSlides, deck, isWorking, outlinePending, onApproveOutline, onRegenerateOutline, verifyFlags, isVerifying, onVerify }: PreviewPaneProps) {
  const [sections, setSections] = useState<DeckSection[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [autoFollow, setAutoFollow] = useState(true)
  const [isPresenting, setIsPresenting] = useState(false)
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('edit')
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const { width: insertWidth, isResizing: isResizingInsert, handlePointerDown: handleInsertResizeStart } =
    useResizableWidth(DEFAULT_INSERT_WIDTH, MIN_INSERT_WIDTH, MAX_INSERT_WIDTH, /* invert */ true)

  const isDone = previewState === 'done'
  const slideRefs = useRef<Array<HTMLDivElement | null>>([])

  // Seed local (editable) sections from the real generated deck as soon as
  // it arrives over the stream — replaces the old MOCK_DECK.sections seed.
  useEffect(() => {
    if (deck) setSections(deck.sections.map(s => ({ ...s, blocks: [...s.blocks] })))
  }, [deck])

  // Follow the newest revealed slide while streaming (single-slide preview)
  useEffect(() => {
    if (autoFollow && revealedSlides.length > 0) {
      setActiveIndex(revealedSlides[revealedSlides.length - 1])
    }
  }, [revealedSlides, autoFollow])

  const handleSelect = useCallback((index: number) => {
    setAutoFollow(false)
    setActiveIndex(index)
    // Once the deck is fully assembled, all slides render stacked —
    // clicking a thumbnail scrolls to it instead of swapping a single view.
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Dropped directly onto a specific slide's card (see ContentSection's
  // onDropBlock) — never onto the canvas at large, so the block always
  // lands on the slide the user actually dropped it on.
  const handleDropOnSection = useCallback((sectionIdx: number, blockType: string) => {
    setSections(prev => prev.map((s, i) => (i === sectionIdx ? { ...s, blocks: [...s.blocks, makeBlock(blockType)] } : s)))
  }, [])

  // Inserts a new slide immediately before the section at `index`
  const handleInsertSectionAt = useCallback((index: number) => {
    const newSection = makeDefaultSection()
    setSections(prev => {
      const next = [...prev]
      next.splice(index, 0, newSection)
      return next
    })
  }, [])

  const handleModeChange = useCallback((mode: CanvasMode) => {
    setCanvasMode(mode)
    setSelectedBlockIds(new Set())
  }, [])

  const handleToggleBlockSelect = useCallback((blockId: string, additive: boolean) => {
    setSelectedBlockIds(prev => {
      const next = additive ? new Set(prev) : new Set<string>()
      if (prev.has(blockId) && additive) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }, [])

  const handleClearSelection = useCallback(() => setSelectedBlockIds(new Set()), [])

  const handleDeleteSelected = useCallback(() => {
    setSections(prev => prev.map(s => ({ ...s, blocks: s.blocks.filter(b => !selectedBlockIds.has(b.id)) })))
    setSelectedBlockIds(new Set())
  }, [selectedBlockIds])

  const handleDuplicateSelected = useCallback(() => {
    setSections(prev =>
      prev.map(s => {
        const toDuplicate = s.blocks.filter(b => selectedBlockIds.has(b.id))
        if (!toDuplicate.length) return s
        const duplicates = toDuplicate.map(b => ({ ...b, id: `bl-${Date.now()}-${Math.random().toString(36).slice(2)}` }))
        return { ...s, blocks: [...s.blocks, ...duplicates] }
      }),
    )
    setSelectedBlockIds(new Set())
  }, [selectedBlockIds])

  const flagCountBySection = new Map<string, number>()
  for (const flag of verifyFlags) {
    flagCountBySection.set(flag.sectionId, (flagCountBySection.get(flag.sectionId) ?? 0) + 1)
  }

  const showOutlineReview = !!outlinePending
  const showPlaceholder = !showOutlineReview && (previewState === 'idle' || previewState === 'preparing' || activeIndex === null)

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
          background: 'var(--surface-panel, var(--surface))',
        }}
      >
        <PanelLeft size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', flex: 1 }}>
          {deck?.title ?? MOCK_DECK.title}
        </span>
        {isDone ? (
          <>
            <button style={miniBtnStyle} onClick={() => setIsPresenting(true)}><Play size={12} fill="currentColor" /> Present</button>
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
          <SlideThumbRail deck={deck} revealedSlides={revealedSlides} activeIndex={activeIndex} onSelect={handleSelect} />
        )}

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: 'var(--bg-canvas)' }}>
          {isDone && (
            <PreviewToolbar
              mode={canvasMode}
              onModeChange={handleModeChange}
              onVerify={onVerify}
              isVerifying={isVerifying}
              flagCount={verifyFlags.length ? verifyFlags.length : null}
            />
          )}

          {isDone && canvasMode === 'select' && selectedBlockIds.size > 0 && (
            <div
              style={{
                position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 8px 6px 14px', borderRadius: 'var(--r-pill)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                boxShadow: 'var(--sh-2)', zIndex: 15,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                {selectedBlockIds.size} selected
              </span>
              <button onClick={handleDuplicateSelected} style={bulkBtnStyle} title="Duplicate">
                <Copy size={13} />
              </button>
              <button onClick={handleDeleteSelected} style={{ ...bulkBtnStyle, color: '#E8515A' }} title="Delete">
                <Trash2 size={13} />
              </button>
              <button onClick={handleClearSelection} style={bulkBtnStyle} title="Clear selection">
                <X size={13} />
              </button>
            </div>
          )}

          {!isDone && !showPlaceholder && !showOutlineReview && (
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
            style={{
              flex: 1,
              overflow: 'auto',
              padding: isDone ? '56px 40px' : showOutlineReview ? '0 40px 28px' : '28px 40px',
              maxWidth: 820,
              width: '100%',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            {showOutlineReview ? (
              <OutlineReviewPanel
                sections={outlinePending!.sections}
                onApprove={onApproveOutline}
                onRegenerate={onRegenerateOutline}
              />
            ) : showPlaceholder ? (
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
            ) : isDone ? (
              // Deck is fully assembled — render every slide stacked, like the standalone editor.
              <>
                <div ref={el => { slideRefs.current[0] = el }}>
                  <CoverBlock
                    title={deck?.title ?? MOCK_DECK.title}
                    subtitle={deck?.subtitle ?? MOCK_DECK.subtitle}
                    author={deck?.author ?? MOCK_DECK.author}
                    coverColor={deck?.coverColor ?? MOCK_DECK.coverColor}
                    aspectRatio={deck?.aspectRatio}
                  />
                </div>
                {sections.map((section, i) => (
                  <div key={section.id} ref={el => { slideRefs.current[i + 1] = el }}>
                    <ContentSection
                      section={section}
                      isActive={activeIndex === i + 1}
                      onClick={() => setActiveIndex(i + 1)}
                      onInsertBefore={() => handleInsertSectionAt(i)}
                      aspectRatio={deck?.aspectRatio}
                      onDropBlock={blockType => handleDropOnSection(i, blockType)}
                      mode={canvasMode}
                      selectedBlockIds={selectedBlockIds}
                      onToggleBlockSelect={handleToggleBlockSelect}
                      onClearSelection={handleClearSelection}
                      flagCount={flagCountBySection.get(section.id) ?? 0}
                    />
                  </div>
                ))}
                <div style={{ height: 60 }} />
              </>
            ) : activeIndex === 0 ? (
              // Streaming — show only the slide currently being written
              <CoverBlock
                title={deck?.title ?? MOCK_DECK.title}
                subtitle={deck?.subtitle ?? MOCK_DECK.subtitle}
                author={deck?.author ?? MOCK_DECK.author}
                coverColor={deck?.coverColor ?? MOCK_DECK.coverColor}
                aspectRatio={deck?.aspectRatio}
              />
            ) : activeIndex !== null ? (
              <ContentSection
                section={sections[activeIndex - 1]}
                isActive
                onClick={() => {}}
                aspectRatio={deck?.aspectRatio}
              />
            ) : null}
          </div>
        </div>

        {isDone && (
          <>
            <ResizeHandle isResizing={isResizingInsert} onPointerDown={handleInsertResizeStart} />
            <InsertPanel width={insertWidth} />
          </>
        )}
      </div>

      {isPresenting && (
        <PresentationMode
          deckTitle={deck?.title ?? MOCK_DECK.title}
          subtitle={deck?.subtitle ?? MOCK_DECK.subtitle}
          author={deck?.author ?? MOCK_DECK.author}
          coverColor={deck?.coverColor ?? MOCK_DECK.coverColor}
          sections={sections}
          onClose={() => setIsPresenting(false)}
          aspectRatio={deck?.aspectRatio}
        />
      )}
    </div>
  )
}

const bulkBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26,
  borderRadius: '50%',
  border: 'none', background: 'transparent',
  color: 'var(--text-muted)', cursor: 'pointer',
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
