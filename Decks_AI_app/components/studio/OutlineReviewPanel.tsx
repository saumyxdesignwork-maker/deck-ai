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
        slideLabel={`Slide ${index + 1}`}
        compactLayoutPicker
      />
    </div>
  )
}

interface PrimaryCTAProps {
  onClick: () => void
  children: React.ReactNode
  /** The small sticky-header copy vs. the full-width bottom-row copy —
   * same gradient/states, different size. */
  compact?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

// Shared "Generate Slides" button style for both CTA placements (sticky
// header + bottom row), so a fix here (or a future accent-color change)
// never has to be kept in sync by hand across two copies. Keeps
// `border: 'none'` on the gradient background deliberately — a real border
// on top of an inline gradient is what caused the white-hairline corner
// leak fixed elsewhere in this app (see FloatingChat's Send button); this
// button avoids that bug the same way. Hover/active/disabled are handled
// with a brightness filter rather than swapping the gradient itself, so
// the "visual color language" (the gradient) never changes, only its
// intensity — and it keeps working whether --primary is a gradient or a
// flat color, depending on visual language.
function PrimaryCTA({ onClick, children, compact, disabled, fullWidth }: PrimaryCTAProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="dk-press dk-focus-ring"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 7,
        flex: fullWidth ? 1 : undefined,
        padding: compact ? '7px 14px' : '11px 18px',
        borderRadius: 'var(--r-pill)',
        border: 'none', background: 'var(--primary)', color: 'var(--primary-fg)',
        fontSize: compact ? 12.5 : 13.5, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)', boxShadow: 'var(--sh-1)',
        opacity: disabled ? 0.55 : 1,
        filter: disabled ? 'none' : undefined,
        transition: 'filter 0.12s, opacity 0.12s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
    >
      {children}
    </button>
  )
}

// The interactive outline review — lives in the preview pane (not the
// chat) so there's room to actually read the section flow before slides
// get built. Reuses the same editable-card + layout-selector design as
// Classic's storyline page (components/storyline/StorylineSectionCard)
// for visual and interaction parity between the two flows: editable
// title/bullets, per-section layout choice, drag-to-reorder, duplicate/
// delete/add. No inner scroll on the section list on purpose: it sits
// inside the canvas's own scroll container, so nesting a second
// scrollable box here would trap scrolling and hide the CTA row below —
// the header above is sticky instead, so "Generate Slides" stays reachable.
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
        // Solid, not the translucent/glass --surface some visual languages
        // use — this panel floats over the canvas's own ambient background,
        // and a glassy fill let that bleed through and washed the header out.
        background: 'var(--surface-solid)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        // Not `overflow: hidden` — that would make this box (rather than
        // the canvas's own scroll container) the sticky header's containing
        // block, since overflow:hidden ancestors count as scroll containers
        // for position:sticky purposes even without a scrollbar. The header
        // and footer round their own corners instead (below) to keep the
        // same clipped look without breaking the sticky CTA.
        overflow: 'visible',
      }}
    >
      {/* Header — sticky, so the primary CTA on its right stays reachable
          while scrolling a long outline, without needing a second inner
          scroll box (see the note on the component above). */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 2,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
          padding: '20px 24px 16px',
          background: 'var(--surface-solid)',
          borderBottom: '1px solid var(--divider)',
          borderTopLeftRadius: 'var(--r-xl)',
          borderTopRightRadius: 'var(--r-xl)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ListChecks size={17} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
              Review the outline
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
              Edit titles, points, and layouts directly, or ask for changes in the chat.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span
            style={{
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
          <PrimaryCTA compact onClick={() => onApprove(toOutline(local))}>
            <Sparkles size={13} />
            Generate Slides
          </PrimaryCTA>
        </div>
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

      {/* CTA row — always the last thing in the panel, directly below the
          list. Kept alongside the sticky header's compact CTA (not replaced
          by it) so the primary action is available both while scrolling
          and, as before, right where the review naturally ends. */}
      <div
        style={{
          display: 'flex', gap: 10, padding: '16px 24px',
          borderTop: '1px solid var(--divider)', background: 'var(--surface-muted)',
          borderBottomLeftRadius: 'var(--r-xl)', borderBottomRightRadius: 'var(--r-xl)',
        }}
      >
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
          Rethink Outline
        </button>
        <PrimaryCTA fullWidth onClick={() => onApprove(toOutline(local))}>
          <Sparkles size={14} />
          Generate Slides
        </PrimaryCTA>
      </div>
    </div>
  )
}
