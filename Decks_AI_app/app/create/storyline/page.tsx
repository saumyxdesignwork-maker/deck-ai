'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, RefreshCw, Sparkles, Plus } from 'lucide-react'
import {
  DndContext, DragEndEvent, PointerSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AppLayout } from '@/components/shell/AppLayout'
import { StorylineSectionCard } from '@/components/storyline/StorylineSectionCard'
import { useCreate } from '@/lib/createContext'
import { useTheme } from '@/components/controls/ThemeProvider'
import { StorylineSection, MOCK_STORYLINE } from '@/lib/fixtures'

// ─── Sortable wrapper ────────────────────────────────────────────────────────
interface SortableCardProps {
  section: StorylineSection
  index: number
  onUpdate: (s: StorylineSection) => void
  onDuplicate: () => void
  onDelete: () => void
  onAddBelow: () => void
  isVL3?: boolean
}

function SortableCard({ section, index, onUpdate, onDuplicate, onDelete, onAddBelow, isVL3 }: SortableCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: section.id })

  if (isVL3) {
    return (
      <div
        ref={setNodeRef}
        id={`section-${section.id}`}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.45 : 1,
          zIndex: isDragging ? 99 : 'auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
        }}
      >
        {/* Timeline marker — numbered circle sitting on the spine */}
        <div
          {...attributes}
          {...listeners}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1.5px solid var(--accent)',
            background: 'var(--surface)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            marginLeft: -14, // half of 28 to sit on the spine line
            marginTop: 14,
            cursor: 'grab',
            zIndex: 2,
            boxShadow: 'var(--sh-1)',
            userSelect: 'none',
          }}
        >
          {index + 1}
        </div>

        {/* Card hanging to the right of the spine */}
        <div style={{ flex: 1, paddingLeft: 16, paddingBottom: 16 }}>
          <StorylineSectionCard
            section={section}
            index={index}
            hideNumberBadge
            dragHandleProps={{ ...attributes, ...listeners }}
            onUpdate={onUpdate}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onAddBelow={onAddBelow}
          />
        </div>
      </div>
    )
  }

  // VL1/VL2 — flat card
  return (
    <div
      ref={setNodeRef}
      id={`section-${section.id}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 99 : 'auto',
        position: 'relative',
      }}
    >
      <StorylineSectionCard
        section={section}
        index={index}
        dragHandleProps={{ ...attributes, ...listeners }}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddBelow={onAddBelow}
      />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function StorylinePage() {
  const router = useRouter()
  const { storyline, setStoryline, deckTitle } = useCreate()
  const { vl } = useTheme()
  const isVL3 = vl === '3'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIdx = storyline.findIndex(s => s.id === active.id)
      const newIdx = storyline.findIndex(s => s.id === over.id)
      setStoryline(arrayMove(storyline, oldIdx, newIdx))
    }
  }

  const updateSection = (id: string, updated: StorylineSection) =>
    setStoryline(storyline.map(s => (s.id === id ? updated : s)))

  const duplicateSection = (id: string) => {
    const idx = storyline.findIndex(s => s.id === id)
    const orig = storyline[idx]
    const copy: StorylineSection = {
      ...orig,
      id: `s-${Date.now()}`,
      title: `${orig.title} (copy)`,
      bullets: orig.bullets.map(b => ({ ...b, id: `b-${Date.now()}-${Math.random()}` })),
    }
    const next = [...storyline]
    next.splice(idx + 1, 0, copy)
    setStoryline(next)
  }

  const deleteSection = (id: string) => {
    if (storyline.length <= 1) return
    setStoryline(storyline.filter(s => s.id !== id))
  }

  const addSectionBelow = (id: string) => {
    const idx = storyline.findIndex(s => s.id === id)
    const newSection: StorylineSection = {
      id: `s-${Date.now()}`,
      title: 'New Section',
      layout: 'key-points',
      bullets: [{ id: `b-${Date.now()}`, text: 'Add your key point here' }],
    }
    const next = [...storyline]
    next.splice(idx + 1, 0, newSection)
    setStoryline(next)
  }

  // ── Footer CTAs (shared) ────────────────────────────────────────────────
  const footerCTAs = (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 10, padding: '12px 28px',
        borderTop: '1px solid var(--divider)',
        background: isVL3 ? 'transparent' : 'var(--surface-panel, var(--surface))',
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => setStoryline(MOCK_STORYLINE)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 18px',
          borderRadius: 'var(--r-pill)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          cursor: 'pointer',
          fontSize: 14,
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
      >
        <RefreshCw size={13} />
        Retry Storyline
      </button>

      <button
        onClick={() => router.push('/create/generating')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 24px',
          borderRadius: 'var(--r-pill)',
          border: 'none',
          background: 'var(--primary)',
          color: 'var(--primary-fg)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Sparkles size={14} />
        Generate Deck
      </button>
    </div>
  )

  // ── VL3: Timeline spine layout ──────────────────────────────────────────
  if (isVL3) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex', alignItems: 'center',
              padding: '14px 24px',
              borderBottom: '1px solid var(--divider)',
              gap: 12, flexShrink: 0,
            }}
          >
            <button
              onClick={() => router.push('/create/input')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
            >
              <ArrowLeft size={14} />
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {deckTitle}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Review and edit your storyline
              </p>
            </div>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--accent-soft)',
                border: '1px solid rgba(192,119,85,0.2)',
                fontSize: 12, fontWeight: 600, color: 'var(--accent)',
              }}
            >
              {storyline.length} sections
            </span>
          </div>

          {/* Timeline scroll area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 0 24px' }}>
            {/* Centered column with dashed spine */}
            <div
              style={{
                maxWidth: 720,
                margin: '0 auto',
                paddingLeft: 56, // room for the spine + markers
                paddingRight: 28,
                position: 'relative',
              }}
            >
              {/* Dashed vertical spine line */}
              <div
                style={{
                  position: 'absolute',
                  left: 28, // aligns with center of the 28px marker circles
                  top: 0,
                  bottom: 0,
                  width: 2,
                  borderLeft: '2px dashed var(--spine)',
                  pointerEvents: 'none',
                }}
              />

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={storyline.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {storyline.map((section, i) => (
                    <SortableCard
                      key={section.id}
                      section={section}
                      index={i}
                      isVL3
                      onUpdate={updated => updateSection(section.id, updated)}
                      onDuplicate={() => duplicateSection(section.id)}
                      onDelete={() => deleteSection(section.id)}
                      onAddBelow={() => addSectionBelow(section.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add section — terminal spine node */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <button
                  onClick={() => {
                    const newSection: StorylineSection = {
                      id: `s-${Date.now()}`,
                      title: 'New Section',
                      layout: 'key-points',
                      bullets: [{ id: `b-${Date.now()}`, text: 'Add a point…' }],
                    }
                    setStoryline([...storyline, newSection])
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '1.5px dashed var(--spine)',
                    background: 'var(--surface)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: -14,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--accent)'
                    el.style.color = 'var(--accent)'
                    el.style.background = 'var(--accent-soft)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--spine)'
                    el.style.color = 'var(--text-muted)'
                    el.style.background = 'var(--surface)'
                  }}
                >
                  <Plus size={13} />
                </button>
                <span style={{ marginLeft: 22, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  Add a section
                </span>
              </div>
            </div>
          </div>

          {footerCTAs}
        </div>
      </AppLayout>
    )
  }

  // ── VL1 / VL2: original left-rail + stacked cards layout ────────────────
  return (
    <AppLayout>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* Left nav */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: '1px solid var(--divider)',
            background: 'var(--surface-panel, var(--surface))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 12px 8px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--divider)',
            }}
          >
            {storyline.length} Sections
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 8px' }}>
            {storyline.map((s, i) => (
              <a
                key={s.id}
                href={`#section-${s.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 'var(--r-sm)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontSize: 13,
                  lineHeight: 1.35,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', minWidth: 16, marginTop: 1 }}>
                  {i + 1}
                </span>
                <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {s.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              borderBottom: '1px solid var(--divider)',
              background: 'var(--surface-panel, var(--surface))',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => router.push('/create/input')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
            >
              <ArrowLeft size={14} />
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {deckTitle}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Review and edit your storyline before generating the full deck
              </p>
            </div>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              {storyline.length} sections
            </span>
          </div>

          {/* Drag-sortable card list */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={storyline.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {storyline.map((section, i) => (
                  <SortableCard
                    key={section.id}
                    section={section}
                    index={i}
                    onUpdate={updated => updateSection(section.id, updated)}
                    onDuplicate={() => duplicateSection(section.id)}
                    onDelete={() => deleteSection(section.id)}
                    onAddBelow={() => addSectionBelow(section.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add section button */}
            <button
              onClick={() => {
                const newSection: StorylineSection = {
                  id: `s-${Date.now()}`,
                  title: 'New Section',
                  layout: 'key-points',
                  bullets: [{ id: `b-${Date.now()}`, text: 'Add a point…' }],
                }
                setStoryline([...storyline, newSection])
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 7, padding: '12px',
                borderRadius: 'var(--r-lg)',
                border: '1.5px dashed var(--border)',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--accent)'
                el.style.color = 'var(--accent)'
                el.style.background = 'var(--accent-soft)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--border)'
                el.style.color = 'var(--text-muted)'
                el.style.background = 'transparent'
              }}
            >
              <Plus size={15} />
              Add a section
            </button>
          </div>

          {footerCTAs}
        </div>
      </div>
    </AppLayout>
  )
}
