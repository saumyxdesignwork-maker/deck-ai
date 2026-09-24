'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Sparkles, ListChecks, Plus } from 'lucide-react'
import {
  DndContext, DragEndEvent, PointerSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { OutlineSection } from '@/lib/studioScript'
import { StorylineSection, LayoutType } from '@/lib/fixtures'
import { StorylineSectionCard } from '@/components/storyline/StorylineSectionCard'

const DEFAULT_LAYOUT_CYCLE: LayoutType[] = ['statement', 'key-points', 'heading-media', 'media-text', 'bento', 'data']

function toEditable(sections: OutlineSection[]): StorylineSection[] {
  return sections.map((s, i) => ({
    id: `outline-${i}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: s.title,
    layout: s.layout ?? DEFAULT_LAYOUT_CYCLE[i % DEFAULT_LAYOUT_CYCLE.length],
    bullets: s.bullets.map((text, bi) => ({ id: `b-${i}-${bi}-${Date.now()}`, text })),
  }))
}

function toOutline(sections: StorylineSection[]): OutlineSection[] {
  return sections.map(s => ({
    title: s.title,
    bullets: s.bullets.map(b => b.text),
    layout: s.layout,
  }))
}

interface OutlineReviewPanelProps {
  sections: OutlineSection[]
  onApprove: (sections: OutlineSection[]) => void
  onRegenerate: () => void
}

interface SortableCardProps {
  section: StorylineSection
  index: number
  onUpdate: (s: StorylineSection) => void
  onDuplicate: () => void
  onDelete: () => void
  onAddBelow: () => void
}

function SortableCard({ section, index, onUpdate, onDuplicate, onDelete, onAddBelow }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  return (
    <div
      ref={setNodeRef}
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

// The interactive storyline review — lives in the preview pane (not the
// chat) so there's room to actually read the section flow before slides
// get built. Reuses the same editable-card + layout-selector design as
// Classic's storyline page (components/storyline/StorylineSectionCard)
// for visual and interaction parity between the two flows: editable
// title/bullets, per-section layout choice, drag-to-reorder, duplicate/
// delete/add. No inner scroll on the section list on purpose: it sits
// inside the canvas's own scroll container, so nesting a second
// scrollable box here would trap scrolling and hide the CTA row below.
export function OutlineReviewPanel({ sections, onApprove, onRegenerate }: OutlineReviewPanelProps) {
  const [local, setLocal] = useState<StorylineSection[]>(() => toEditable(sections))

  // Reset local edits whenever a genuinely new outline arrives (the
  // initial draft, or a fresh one after "Rethink Storyline") — `sections`
  // is a new array from the backend each time, so this only fires then,
  // not on every local edit (those mutate `local` directly).
  useEffect(() => {
    setLocal(toEditable(sections))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      setLocal(prev => {
        const oldIdx = prev.findIndex(s => s.id === active.id)
        const newIdx = prev.findIndex(s => s.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  const updateSection = (id: string, updated: StorylineSection) =>
    setLocal(prev => prev.map(s => (s.id === id ? updated : s)))

  const duplicateSection = (id: string) => {
    setLocal(prev => {
      const idx = prev.findIndex(s => s.id === id)
      const orig = prev[idx]
      const copy: StorylineSection = {
        ...orig,
        id: `s-${Date.now()}`,
        title: `${orig.title} (copy)`,
        bullets: orig.bullets.map(b => ({ ...b, id: `b-${Date.now()}-${Math.random()}` })),
      }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }

  const deleteSection = (id: string) => {
    setLocal(prev => (prev.length <= 1 ? prev : prev.filter(s => s.id !== id)))
  }

  const addSectionBelow = (id: string) => {
    setLocal(prev => {
      const idx = prev.findIndex(s => s.id === id)
      const newSection: StorylineSection = {
        id: `s-${Date.now()}`,
        title: 'New Section',
        layout: 'key-points',
        bullets: [{ id: `b-${Date.now()}`, text: 'Add your key point here' }],
      }
      const next = [...prev]
      next.splice(idx + 1, 0, newSection)
      return next
    })
  }

  const addSection = () => {
    setLocal(prev => [
      ...prev,
      { id: `s-${Date.now()}`, title: 'New Section', layout: 'key-points', bullets: [{ id: `b-${Date.now()}`, text: 'Add a point…' }] },
    ])
  }

  return (
    <div
      style={{
        width: '100%',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        background: 'var(--surface)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ListChecks size={17} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
              Review the storyline
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
              Edit titles, points, and layouts directly, or ask for changes in the chat.
            </p>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: '4px 11px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          {local.length} sections
        </span>
      </div>

      {/* Editable, drag-sortable section cards — matches Classic's storyline page */}
      <div style={{ margin: '0 24px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={local.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {local.map((section, i) => (
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

        <button
          onClick={addSection}
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

      {/* CTA row — always the last thing in the panel, directly below the list */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--divider)', background: 'var(--surface-muted)' }}>
        <button
          type="button"
          onClick={onRegenerate}
          className="dk-press dk-focus-ring"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px 18px', borderRadius: 'var(--r-pill)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            fontSize: 13.5, color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', flexShrink: 0,
          }}
        >
          <RefreshCw size={14} />
          Rethink Storyline
        </button>
        <button
          type="button"
          onClick={() => onApprove(toOutline(local))}
          className="dk-press dk-focus-ring"
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px 18px', borderRadius: 'var(--r-pill)',
            border: 'none', background: 'var(--primary)', color: 'var(--primary-fg)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', boxShadow: 'var(--sh-1)',
          }}
        >
          <Sparkles size={14} />
          Generate Slides
        </button>
      </div>
    </div>
  )
}
