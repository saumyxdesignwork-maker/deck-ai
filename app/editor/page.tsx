'use client'

import { useState, useCallback } from 'react'
import { EditorTopBar } from '@/components/editor/EditorTopBar'
import { SectionNavigator } from '@/components/editor/SectionNavigator'
import { CoverBlock } from '@/components/editor/blocks/CoverBlock'
import { ContentSection } from '@/components/editor/blocks/ContentSection'
import { InsertPanel } from '@/components/editor/InsertPanel'
import { BottomToolbar } from '@/components/editor/BottomToolbar'
import { PresentationMode } from '@/components/editor/PresentationMode'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { MOCK_DECK, DeckSection, Block } from '@/lib/fixtures'
import { useCreate } from '@/lib/createContext'
import { useTheme } from '@/components/controls/ThemeProvider'

export default function EditorPage() {
  const { deckTitle, setDeckTitle } = useCreate()
  const { vl } = useTheme()
  const isVL3 = vl === '3'
  const [sections, setSections] = useState<DeckSection[]>(MOCK_DECK.sections)
  const [activeSectionId, setActiveSectionId] = useState('cover')
  const [isPresenting, setIsPresenting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleAddSection = () => {
    const newSection: DeckSection = {
      id: `ds-${Date.now()}`,
      title: 'New Section',
      layout: 'key-points',
      thumbnailColor: '#F3F4F6',
      blocks: [
        { id: `bl-h-${Date.now()}`, type: 'heading',   content: 'New Section' },
        { id: `bl-p-${Date.now()}`, type: 'paragraph', content: 'Start writing your content here…' },
      ],
    }
    setSections(prev => [...prev, newSection])
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
          position: 'relative', // anchors the floating BottomToolbar in VL3
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
            padding: isVL3 ? '28px 40px 96px' : '28px 40px', // extra bottom pad for floating toolbar
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
          {sections.map((section) => (
            <ContentSection
              key={section.id}
              section={section}
              isActive={activeSectionId === section.id}
              onClick={() => setActiveSectionId(section.id)}
            />
          ))}

          <div style={{ height: 60 }} />
        </div>

        {/* Bottom toolbar — floating in VL3, docked in VL1/VL2 */}
        <BottomToolbar />
      </div>

      {/* Insert panel */}
      <InsertPanel />
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
          sections={sections}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </>
  )
}
