'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { BookOpen, History, FolderOpen, Play, Download, PanelLeft, PanelRight, Trash2, Copy, X } from 'lucide-react'
import { CoverBlock } from '@/components/editor/blocks/CoverBlock'
import { ContentSection } from '@/components/editor/blocks/ContentSection'
import { InsertPanel } from '@/components/editor/InsertPanel'
import { PresentationMode } from '@/components/editor/PresentationMode'
import { PreviewToolbar, CanvasMode } from './PreviewToolbar'
import { SlideThumbRail } from './SlideThumbRail'
import { OutlineReviewPanel } from './OutlineReviewPanel'
import { FloatingChat } from './FloatingChat'
import { ResizeHandle } from '@/components/shared/ResizeHandle'
import { MOCK_DECK, DeckData, LayoutType } from '@/lib/fixtures'
import { ChatItem, OutlineSection, VerifyFlag } from '@/lib/studioScript'
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
  isRewriting: boolean
  onRewriteBlock: (text: string, instruction: string, sectionTitle?: string) => Promise<string | null>
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onInsertBlock: (sectionIdx: number, blockType: string) => void
  onInsertSection: (index: number) => void
  onDeleteBlocks: (blockIds: Set<string>) => void
  onDuplicateBlocks: (blockIds: Set<string>) => void
  onApplyRewrite: (blockId: string, text: string) => void
  onBeginBlockEdit: () => void
  onUpdateBlockContent: (blockId: string, text: string) => void
  onCommitBlockEdit: () => void
  onSetSectionLayout: (sectionIdx: number, layout: LayoutType) => void
  items: ChatItem[]
  isEditing: boolean
  editGroupId: string | null
  onRunEdit: (instruction: string, activeSectionId?: string) => void
}

export function PreviewPane({
  previewState, revealedSlides, deck, isWorking, outlinePending, onApproveOutline, onRegenerateOutline,
  verifyFlags, isVerifying, onVerify, isRewriting, onRewriteBlock,
  canUndo, canRedo, onUndo, onRedo,
  onInsertBlock, onInsertSection, onDeleteBlocks, onDuplicateBlocks, onApplyRewrite,
  onBeginBlockEdit, onUpdateBlockContent, onCommitBlockEdit, onSetSectionLayout,
  items, isEditing, editGroupId, onRunEdit,
}: PreviewPaneProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [autoFollow, setAutoFollow] = useState(true)
  const [isPresenting, setIsPresenting] = useState(false)
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('edit')
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [isAskAIOpen, setIsAskAIOpen] = useState(false)
  const [insertCollapsed, setInsertCollapsed] = useState(false)
  const metaHeldRef = useRef(false)
  const metaCleanRef = useRef(true)
  const lastCleanTapRef = useRef(0)
  const { width: insertWidth, isResizing: isResizingInsert, handlePointerDown: handleInsertResizeStart } =
    useResizableWidth(DEFAULT_INSERT_WIDTH, MIN_INSERT_WIDTH, MAX_INSERT_WIDTH, /* invert */ true)

  const isDone = previewState === 'done'
  const sections = deck?.sections ?? []
  const slideRefs = useRef<Array<HTMLDivElement | null>>([])

  // Undo/redo — only meaningful once the deck is editable, and never while
  // the user is typing in a field (native Cmd+Z there must stay untouched).
  useEffect(() => {
    if (!isDone) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (isTyping) return
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      if (e.shiftKey) onRedo()
      else onUndo()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDone, onUndo, onRedo])

  // Ask AI — double-tap Cmd (⌘⌘) toggles the floating popup. Only live once
  // a first draft exists. "Clean tap" tracking (metaHeldRef/metaCleanRef)
  // means a tap only counts if no other key was pressed while Meta was held
  // — so ⌘S ⌘S (save twice) never mis-fires this, unlike counting every
  // Meta keydown. macOS/iOS only: Meta is OS-reserved on Windows/Linux, so
  // there the visible "Ask AI" button (PreviewToolbar) is the only trigger.
  useEffect(() => {
    if (!isDone) return
    const isApplePlatform = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
    if (!isApplePlatform) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta') {
        if (!e.repeat) {
          metaHeldRef.current = true
          metaCleanRef.current = true
        }
        return
      }
      if (metaHeldRef.current) metaCleanRef.current = false
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Meta') return
      const wasCleanTap = metaHeldRef.current && metaCleanRef.current
      metaHeldRef.current = false
      if (!wasCleanTap) return
      const target = document.activeElement as HTMLElement | null
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (isTyping) return
      const now = Date.now()
      if (now - lastCleanTapRef.current < 350) {
        setIsAskAIOpen(open => !open)
        lastCleanTapRef.current = 0
      } else {
        lastCleanTapRef.current = now
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isDone])

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
    onDeleteBlocks(selectedBlockIds)
    setSelectedBlockIds(new Set())
  }, [selectedBlockIds, onDeleteBlocks])

  const handleDuplicateSelected = useCallback(() => {
    onDuplicateBlocks(selectedBlockIds)
    setSelectedBlockIds(new Set())
  }, [selectedBlockIds, onDuplicateBlocks])

  const handleRewriteBlock = useCallback(
    async (sectionIdx: number, blockId: string, instruction: string) => {
      const section = sections[sectionIdx]
      const block = section?.blocks.find(b => b.id === blockId)
      if (!block) return
      const newText = await onRewriteBlock(block.content, instruction, section.title)
      if (newText === null) return
      onApplyRewrite(blockId, newText)
    },
    [sections, onRewriteBlock, onApplyRewrite],
  )

  // The slide Ask AI targets — whichever slide was active when it opened.
  // null for the cover (no editable blocks) or when nothing is active yet.
  const activeSectionIdx = activeIndex !== null && activeIndex > 0 ? activeIndex - 1 : null
  const activeSection = activeSectionIdx !== null ? sections[activeSectionIdx] ?? null : null

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
            <button
              style={{ ...miniBtnStyle, padding: '5px 7px' }}
              title={insertCollapsed ? 'Show insert panel' : 'Hide insert panel'}
              onClick={() => setInsertCollapsed(c => !c)}
            >
              <PanelRight size={12} />
            </button>
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
              onOpenAskAI={() => setIsAskAIOpen(true)}
            />
          )}

          {isDone && (
            <FloatingChat
              isOpen={isAskAIOpen}
              onClose={() => setIsAskAIOpen(false)}
              activeSection={activeSection}
              items={items}
              isEditing={isEditing}
              editGroupId={editGroupId}
              onSubmit={onRunEdit}
              canUndo={canUndo}
              onUndo={onUndo}
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
                      onInsertBefore={() => onInsertSection(i)}
                      aspectRatio={deck?.aspectRatio}
                      onDropBlock={blockType => onInsertBlock(i, blockType)}
                      mode={canvasMode}
                      selectedBlockIds={selectedBlockIds}
                      onToggleBlockSelect={handleToggleBlockSelect}
                      onClearSelection={handleClearSelection}
                      flagCount={flagCountBySection.get(section.id) ?? 0}
                      onRewriteBlock={(blockId, instruction) => handleRewriteBlock(i, blockId, instruction)}
                      isRewriting={isRewriting}
                      onUpdateBlockContent={onUpdateBlockContent}
                      onBeginBlockEdit={onBeginBlockEdit}
                      onCommitBlockEdit={onCommitBlockEdit}
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
                onUpdateBlockContent={onUpdateBlockContent}
                onBeginBlockEdit={onBeginBlockEdit}
                onCommitBlockEdit={onCommitBlockEdit}
              />
            ) : null}
          </div>
        </div>

        {isDone && (
          insertCollapsed ? (
            <button
              onClick={() => setInsertCollapsed(false)}
              title="Show insert panel"
              style={{
                width: 40, flexShrink: 0, height: '100%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 16,
                border: 'none', borderLeft: '1px solid var(--divider)',
                background: 'var(--surface-panel, var(--surface))', cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <PanelRight size={16} />
            </button>
          ) : (
            <>
              <ResizeHandle isResizing={isResizingInsert} onPointerDown={handleInsertResizeStart} />
              <InsertPanel width={insertWidth} />
            </>
          )
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
