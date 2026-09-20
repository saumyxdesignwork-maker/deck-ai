'use client'

import { useState, useCallback } from 'react'
import { EditorTopBar } from '@/components/editor/EditorTopBar'
import { SectionNavigator } from '@/components/editor/SectionNavigator'
import { CoverBlock } from '@/components/editor/blocks/CoverBlock'
import { ContentSection } from '@/components/editor/blocks/ContentSection'
import { InsertPanel } from '@/components/editor/InsertPanel'
import { PresentationMode } from '@/components/editor/PresentationMode'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { ResizeHandle } from '@/components/shared/ResizeHandle'
import { MOCK_DECK, DeckSection, Block } from '@/lib/fixtures'
import { useCreate } from '@/lib/createContext'
import { useResizableWidth } from '@/lib/useResizableWidth'

const MIN_INSERT_WIDTH = 220
const MAX_INSERT_WIDTH = 480
const DEFAULT_INSERT_WIDTH = 276

export default function EditorPage() {
  const { deckTitle, setDeckTitle } = useCreate()
  const [sections, setSections] = useState<DeckSection[]>(MOCK_DECK.sections)
  const [activeSectionId, setActiveSectionId] = useState('cover')
  const [isPresenting, setIsPresenting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const { width: insertWidth, isResizing: isResizingInsert, handlePointerDown: handleInsertResizeStart } =
    useResizableWidth(DEFAULT_INSERT_WIDTH, MIN_INSERT_WIDTH, MAX_INSERT_WIDTH, /* invert */ true)

  // Build a new block from a dropped block type
  const makeBlock = (blockType: string): Block => {
    const id = `bl-${Date.now()}-${Math.random().toString(36).slice(2)}`
    if (blockType === 'card-group') {
      return {
        id,
        type: 'card-group',
        content: '',
        cards: [
          { icon: '✨', title: 'New Card', value: '—' },
        ],
      }
    }
    const defaults: Record<string, string> = {
      heading: 'New Heading',
      paragraph: 'Start writing here…',
      callout: 'Add a callout note…',
      image: 'Image placeholder',
    }
    return {
      id,
      type: blockType as Block['type'],
      content: defaults[blockType] ?? '',
    }
  }

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const blockType = e.dataTransfer.getData('text/plain')
      if (!blockType) return

      setSections(prev =>
        prev.map(s => {
          if (s.id !== activeSectionId) return s
          return { ...s, blocks: [...s.blocks, makeBlock(blockType)] }
        })
      )
    },
    [activeSectionId]
  )

  const makeDefaultSection = (): DeckSection => ({
    id: `ds-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: 'New Section',
    layout: 'key-points',
    thumbnailColor: '#F3F4F6',
    blocks: [
      { id: `bl-h-${Date.now()}`, type: 'heading',   content: 'New Section' },
      { id: `bl-p-${Date.now()}`, type: 'paragraph', content: 'Start writing your content here…' },
    ],
  })

  const handleAddSection = () => {
    const newSection = makeDefaultSection()
    setSections(prev => [...prev, newSection])
    setActiveSectionId(newSection.id)
  }

  // Inserts a new slide immediately before the section at `index`
  const handleInsertSectionAt = (index: number) => {
    const newSection = makeDefaultSection()
    setSections(prev => {
      const next = [...prev]
      next.splice(index, 0, newSection)
      return next
    })
    setActiveSectionId(newSection.id)
  }

  const handleReorder = (newSections: DeckSection[]) => setSections(newSections)

  const editorPane = (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* Section navigator — sortable */}
      <SectionNavigator
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={setActiveSectionId}
        onAddSection={handleAddSection}
        onReorder={handleReorder}
      />

      {/* Canvas */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-canvas)',
          position: 'relative',
        }}
      >
        <div
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true) }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false)
          }}
          onDrop={handleCanvasDrop}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '28px 40px',
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
          {/* Cover block */}
          <CoverBlock
            title={MOCK_DECK.title}
            subtitle={MOCK_DECK.subtitle}
            author={MOCK_DECK.author}
            coverColor={MOCK_DECK.coverColor}
          />

          {/* Content sections */}
          {sections.map((section, i) => (
            <ContentSection
              key={section.id}
              section={section}
              isActive={activeSectionId === section.id}
              onClick={() => setActiveSectionId(section.id)}
              onInsertBefore={() => handleInsertSectionAt(i)}
            />
          ))}

          <div style={{ height: 60 }} />
        </div>
      </div>

      {/* Insert panel */}
      <ResizeHandle isResizing={isResizingInsert} onPointerDown={handleInsertResizeStart} />
      <InsertPanel width={insertWidth} />
    </div>
  )

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--bg-canvas)',
        }}
      >
        <EditorTopBar
          title={deckTitle}
          onTitleChange={setDeckTitle}
          onPresent={() => setIsPresenting(true)}
        />
        {editorPane}
      </div>

      <ControlsPanel />

      {isPresenting && (
        <PresentationMode
          deckTitle={deckTitle}
          subtitle={MOCK_DECK.subtitle}
          author={MOCK_DECK.author}
          coverColor={MOCK_DECK.coverColor}
          sections={sections}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </>
  )
}
