'use client'

import { Plus, GripVertical } from 'lucide-react'
import {
  DndContext, DragEndEvent, PointerSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DeckSection } from '@/lib/fixtures'

// ─── Sortable card wrapper ───────────────────────────────────────────────────
function SortableSectionCard({
  section,
  index,
  isActive,
  onSelect,
}: {
  section: DeckSection
  index: number
  isActive: boolean
  onSelect: () => void
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: section.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        marginBottom: 4,
        position: 'relative',
      }}
    >
      {/* Drag handle — absolute on left edge */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          left: -18,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'var(--text-disabled)',
          display: 'flex',
          alignItems: 'center',
          opacity: 0,
          transition: 'opacity 0.12s',
          zIndex: 2,
          padding: '2px',
        }}
        className="drag-handle"
      >
        <GripVertical size={12} />
      </div>

      {/* Card */}
      <div
        onClick={onSelect}
        style={{
          borderRadius: 'var(--r-sm)',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1.5px solid',
          borderColor: isActive ? 'var(--accent)' : 'transparent',
          transition: 'border-color 0.12s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          if (!isActive) el.style.borderColor = 'var(--border)'
          // show drag handle
          const handle = el.parentElement?.querySelector('.drag-handle') as HTMLElement | null
          if (handle) handle.style.opacity = '1'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          if (!isActive) el.style.borderColor = 'transparent'
          const handle = el.parentElement?.querySelector('.drag-handle') as HTMLElement | null
          if (handle) handle.style.opacity = '0'
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            height: 54,
            background: section.thumbnailColor,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '6px 8px',
            position: 'relative',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(0,0,0,0.35)',
              letterSpacing: '0.03em',
            }}
          >
            {index + 1}
          </span>
          {/* Mock content lines */}
          <div style={{ position: 'absolute', top: 8, left: 8, right: 8 }}>
            <div style={{ height: 5, background: 'rgba(0,0,0,0.12)', borderRadius: 2, marginBottom: 3, width: '70%' }} />
            <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, marginBottom: 2, width: '55%' }} />
            <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, width: '45%' }} />
          </div>
        </div>

        {/* Label */}
        <div
          style={{
            padding: '4px 6px',
            background: isActive ? 'var(--accent-soft)' : 'var(--surface-muted)',
            fontSize: 12,
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {section.title}
        </div>
      </div>
    </div>
  )
}

// ─── Main navigator ──────────────────────────────────────────────────────────
interface SectionNavigatorProps {
  sections: DeckSection[]
  activeSectionId: string
  onSelect: (id: string) => void
  onAddSection: () => void
  onReorder: (newSections: DeckSection[]) => void
}

export function SectionNavigator({
  sections,
  activeSectionId,
  onSelect,
  onAddSection,
  onReorder,
}: SectionNavigatorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIdx = sections.findIndex(s => s.id === active.id)
      const newIdx = sections.findIndex(s => s.id === over.id)
      onReorder(arrayMove(sections, oldIdx, newIdx))
    }
  }

  return (
    <div
      style={{
        width: 'var(--section-nav-w)',
        flexShrink: 0,
        height: '100%',
        background: 'var(--surface)',
        borderRight: '1px solid var(--divider)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 6px',
          borderBottom: '1px solid var(--divider)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Sections
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '6px 6px 6px 22px' }}>
        {/* Cover card (not sortable — always first) */}
        <div
          onClick={() => onSelect('cover')}
          style={{
            marginBottom: 4,
            borderRadius: 'var(--r-sm)',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '1.5px solid',
            borderColor: activeSectionId === 'cover' ? 'var(--accent)' : 'transparent',
            transition: 'border-color 0.12s',
          }}
          onMouseEnter={e => {
            if (activeSectionId !== 'cover')
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          }}
          onMouseLeave={e => {
            if (activeSectionId !== 'cover')
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent'
          }}
        >
          <div
            style={{
              height: 60,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Cover</span>
          </div>
          <div
            style={{
              padding: '4px 6px',
              background: activeSectionId === 'cover' ? 'var(--accent-soft)' : 'var(--surface-muted)',
              fontSize: 12,
              color: activeSectionId === 'cover' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Cover slide
          </div>
        </div>

        {/* Sortable section cards */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section, i) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                index={i}
                isActive={activeSectionId === section.id}
                onSelect={() => onSelect(section.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add section */}
      <div style={{ padding: '8px 8px 10px', borderTop: '1px solid var(--divider)', flexShrink: 0 }}>
        <button
          onClick={onAddSection}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '6px',
            borderRadius: 'var(--r-sm)',
            border: '1px dashed var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.12s',
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
          <Plus size={13} />
          Add section
        </button>
      </div>
    </div>
  )
}
