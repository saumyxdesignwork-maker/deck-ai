'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Shuffle, Image, LayoutPanelTop, MoreHorizontal, Heading1, AlignLeft, Flame, Quote, BarChart3, Table2, Grid2x2, Columns2, LayoutList, Download, Printer, Copy, Archive, X } from 'lucide-react'
import { useTheme } from '@/components/controls/ThemeProvider'

type DrawerKey = 'insert' | 'remix' | 'media' | 'layout' | 'more' | null

const QUICK_BLOCKS = [
  { icon: Heading1,  label: 'Heading',   desc: 'Large section title' },
  { icon: AlignLeft, label: 'Paragraph', desc: 'Body text block' },
  { icon: Flame,     label: 'Callout',   desc: 'Highlighted note' },
  { icon: Quote,     label: 'Quote',     desc: 'Block quotation' },
  { icon: BarChart3, label: 'Chart',     desc: 'Data visualisation' },
  { icon: Table2,    label: 'Table',     desc: 'Rows and columns' },
]

const REMIX_OPTIONS = [
  { emoji: '✨', label: 'Rewrite',      desc: 'Rephrase this section' },
  { emoji: '📋', label: 'Summarise',   desc: 'Condense key points' },
  { emoji: '🔄', label: 'Make concise', desc: 'Remove filler content' },
  { emoji: '💡', label: 'Add examples', desc: 'Illustrate with cases' },
  { emoji: '📈', label: 'Add data',    desc: 'Insert stats & numbers' },
  { emoji: '🎯', label: 'Sharpen CTA', desc: 'Strengthen call-to-action' },
]

const MEDIA_OPTIONS = [
  { emoji: '📷', label: 'Image',   desc: 'Upload or search photos' },
  { emoji: '🎥', label: 'Video',   desc: 'Embed YouTube / Vimeo' },
  { emoji: '🔗', label: 'Embed',   desc: 'Any URL or iframe' },
  { emoji: '📊', label: 'Chart',   desc: 'Bar, line, pie & more' },
  { emoji: '🖼️', label: 'Mockup',  desc: 'Device frame template' },
  { emoji: '🗺️', label: 'Map',     desc: 'Embed a location' },
]

const LAYOUTS = [
  { icon: LayoutList,   label: 'Key Points',   id: 'key-points' },
  { icon: Columns2,     label: 'Two Column',   id: 'two-col' },
  { icon: Grid2x2,      label: 'Four Grid',    id: 'four-grid' },
  { icon: Image,        label: 'Image Left',   id: 'image-left' },
  { icon: Image,        label: 'Image Right',  id: 'image-right' },
  { icon: LayoutPanelTop, label: 'Full Width', id: 'full-width' },
]

const MORE_ITEMS = [
  { icon: Download, label: 'Export as PDF',  action: 'pdf' },
  { icon: Download, label: 'Export as PPTX', action: 'pptx' },
  { icon: Printer,  label: 'Print',          action: 'print' },
  { icon: Copy,     label: 'Duplicate deck', action: 'duplicate' },
  { icon: Archive,  label: 'Archive',        action: 'archive' },
]

const TOOLS = [
  { key: 'insert' as DrawerKey, icon: Plus,            label: 'Insert' },
  { key: 'remix'  as DrawerKey, icon: Shuffle,         label: 'AI Remix' },
  { key: 'media'  as DrawerKey, icon: Image,           label: 'Media' },
  { key: 'layout' as DrawerKey, icon: LayoutPanelTop,  label: 'Layout' },
  { key: 'more'   as DrawerKey, icon: MoreHorizontal,  label: 'More' },
]

// Pill button shared style
function ToolBtn({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: 'var(--r-pill)',
        border: 'none',
        background: active ? 'var(--surface)' : 'transparent',
        cursor: 'pointer',
        fontSize: 12,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        transition: 'all 0.12s',
        fontWeight: active ? 600 : 500,
        boxShadow: active ? 'var(--sh-1)' : 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'var(--surface)'
          el.style.color = 'var(--text)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'transparent'
          el.style.color = 'var(--text-muted)'
        }
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function DrawerShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 8,
        background: 'var(--surface-panel, var(--surface))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--sh-3)',
        width: 380,
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{title}</span>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
          <X size={14} />
        </button>
      </div>
      {children}
    </div>
  )
}

function InsertDrawer({ onClose }: { onClose: () => void }) {
  return (
    <DrawerShell title="Insert block" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)' }}>
        {QUICK_BLOCKS.map(({ icon: Icon, label, desc }) => (
          <button
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--surface)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.1s',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
            onClick={onClose}
          >
            <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </DrawerShell>
  )
}

function RemixDrawer({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleClick = (label: string) => {
    setLoading(label)
    setTimeout(() => { setLoading(null); onClose() }, 1800)
  }

  return (
    <DrawerShell title="AI Remix" onClose={onClose}>
      <div style={{ padding: '6px 8px' }}>
        {REMIX_OPTIONS.map(({ emoji, label, desc }) => (
          <button
            key={label}
            onClick={() => handleClick(label)}
            disabled={loading !== null}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 8px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              background: loading === label ? 'var(--accent-soft)' : 'transparent',
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-body)',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: loading === label ? 'var(--accent)' : 'var(--text)' }}>
                {loading === label ? 'Rewriting…' : label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </DrawerShell>
  )
}

function MediaDrawer({ onClose }: { onClose: () => void }) {
  return (
    <DrawerShell title="Add media" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)' }}>
        {MEDIA_OPTIONS.map(({ emoji, label, desc }) => (
          <button
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--surface)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.1s',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
            onClick={onClose}
          >
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </DrawerShell>
  )
}

function LayoutDrawer({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState('key-points')
  return (
    <DrawerShell title="Section layout" onClose={onClose}>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {LAYOUTS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => { setSelected(id); setTimeout(onClose, 200) }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '10px 8px',
                borderRadius: 'var(--r-md)',
                border: '1.5px solid',
                borderColor: selected === id ? 'var(--accent)' : 'var(--border)',
                background: selected === id ? 'var(--accent-soft)' : 'var(--surface-muted)',
                cursor: 'pointer',
                transition: 'all 0.12s',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Icon size={18} style={{ color: selected === id ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: selected === id ? 'var(--accent)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </DrawerShell>
  )
}

function MoreDrawer({ onClose }: { onClose: () => void }) {
  return (
    <DrawerShell title="More options" onClose={onClose}>
      <div style={{ padding: '6px 8px' }}>
        {MORE_ITEMS.map(({ icon: Icon, label, action }) => (
          <button
            key={action}
            onClick={() => { if (action === 'print') window.print(); onClose() }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 8px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <Icon size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
          </button>
        ))}
      </div>
    </DrawerShell>
  )
}

export function BottomToolbar() {
  const [activeDrawer, setActiveDrawer] = useState<DrawerKey>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { vl } = useTheme()
  const isVL3 = vl === '3'

  const toggle = (key: DrawerKey) => setActiveDrawer(prev => prev === key ? null : key)

  // Close on outside click
  useEffect(() => {
    if (!activeDrawer) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setActiveDrawer(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activeDrawer])

  const pillContent = (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: 'var(--surface-muted)',
        borderRadius: 'var(--r-pill)',
        padding: '3px',
        border: '1px solid var(--border)',
        boxShadow: isVL3 ? 'var(--sh-2)' : 'var(--sh-1)',
        position: 'relative',
        backdropFilter: isVL3 ? 'blur(16px) saturate(140%)' : undefined,
        WebkitBackdropFilter: isVL3 ? 'blur(16px) saturate(140%)' : undefined,
      }}
    >
      {TOOLS.map(({ key, icon: Icon, label }) => (
        <ToolBtn
          key={key}
          active={activeDrawer === key}
          onClick={() => toggle(key)}
          Icon={Icon}
          label={label}
        />
      ))}

      {/* Drawers — rendered above the toolbar */}
      {activeDrawer === 'insert' && <InsertDrawer onClose={() => setActiveDrawer(null)} />}
      {activeDrawer === 'remix'  && <RemixDrawer  onClose={() => setActiveDrawer(null)} />}
      {activeDrawer === 'media'  && <MediaDrawer  onClose={() => setActiveDrawer(null)} />}
      {activeDrawer === 'layout' && <LayoutDrawer onClose={() => setActiveDrawer(null)} />}
      {activeDrawer === 'more'   && <MoreDrawer   onClose={() => setActiveDrawer(null)} />}
    </div>
  )

  // VL3: floating centered pill (detached, absolute over canvas)
  if (isVL3) {
    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {pillContent}
      </div>
    )
  }

  // VL1 / VL2: docked full-width bar (unchanged)
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '10px 16px',
        borderTop: '1px solid var(--divider)',
        background: 'var(--surface-panel, var(--surface))',
        flexShrink: 0,
        gap: 4,
        position: 'relative',
      }}
    >
      {pillContent}
    </div>
  )
}
