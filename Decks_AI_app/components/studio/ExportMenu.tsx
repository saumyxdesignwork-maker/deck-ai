'use client'

import { useEffect, useId, useRef, useState, KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Download, FileText, Presentation, Globe, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import { motionPresets } from '@/lib/motion'

type ExportFormat = 'pdf' | 'pptx' | 'html'
/** The full lifecycle a format can be in — modeled up front (per the
 * product spec) even though no format is wired to a real backend yet, so
 * turning one on later is a status change at the single call site below,
 * not a rewrite of this menu. */
type ExportStatus = 'ready' | 'exporting' | 'success' | 'failed' | 'unavailable'

// No backend export route exists yet for any format (see the /export
// investigation this was built from) — every format is honestly
// 'unavailable' today. This is the one place to flip a format to 'ready'
// once it's actually implemented; nothing else in this component assumes
// a particular format is or isn't real.
const INITIAL_STATUS: Record<ExportFormat, ExportStatus> = {
  pdf: 'unavailable',
  pptx: 'unavailable',
  html: 'unavailable',
}

const FORMAT_META: Record<ExportFormat, { icon: typeof FileText; label: string; sublabel?: string }> = {
  pdf: { icon: FileText, label: 'Export as PDF' },
  pptx: { icon: Presentation, label: 'Export as PowerPoint' },
  html: { icon: Globe, label: 'Export as HTML', sublabel: 'Standalone interactive web page' },
}

const FORMAT_ORDER: ExportFormat[] = ['pdf', 'pptx', 'html']

/**
 * The deck's primary export entry point — a visible top-bar action (not
 * buried in an overflow/"More" menu) that opens a small menu of format
 * choices. Every format currently renders as honestly 'unavailable': no
 * PDF/PPTX/HTML export exists on the backend today, so this never claims a
 * download happened. The exporting/success/failed states are real,
 * reachable UI once a format is wired — not speculative decoration — they
 * just have no live caller yet.
 */
interface ExportMenuProps {
  /** Test-only seam for exercising the exporting/success/failed states,
   * which nothing in the app can reach yet (see INITIAL_STATUS) — the real
   * call site below never passes this. */
  initialStatus?: Partial<Record<ExportFormat, ExportStatus>>
}

export function ExportMenu({ initialStatus }: ExportMenuProps = {}) {
  const [status, setStatus] = useState({ ...INITIAL_STATUS, ...initialStatus })
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const m = motionPresets(useReducedMotion())

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    // Escape closes regardless of exactly what has focus inside the menu —
    // relying only on the menu div's own onKeyDown would miss it if focus
    // never lands inside (e.g. every item is disabled, as they all are
    // today).
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu(true)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKeyDown)
    // Disabled menu items stay focusable (aria-disabled, not the native
    // `disabled` attribute) so arrow-key navigation still works even when
    // every item is currently unavailable.
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const closeMenu = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const idx = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closeMenu(true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Tab') {
      closeMenu(false)
    }
  }

  // Placeholder — there's nothing real to call yet (see INITIAL_STATUS).
  // Kept as a named handler rather than inlined so wiring a real export
  // later means replacing this function's body, not the menu's structure.
  const requestExport = (_format: ExportFormat) => {}

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-sm)',
          // Accent, not the plain muted border every other mini-bar button
          // uses — visibly promoted without matching the full-strength
          // gradient CTA style reserved for the outline's "Generate Slides".
          border: '1px solid var(--accent)',
          background: open ? 'var(--accent-soft)' : 'transparent',
          fontSize: 11.5, color: 'var(--accent)', fontWeight: 500,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        <Download size={12} /> Export
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Export deck"
            onKeyDown={onMenuKeyDown}
            initial={{ opacity: 0, y: m.reduce ? 0 : -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: m.exit }}
            transition={m.menu}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              minWidth: 240,
              background: 'var(--surface-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--sh-3)',
              padding: 4,
              zIndex: 20,
            }}
          >
            {FORMAT_ORDER.map(format => {
              const { icon: Icon, label, sublabel } = FORMAT_META[format]
              const formatStatus = status[format]
              const isFailed = formatStatus === 'failed'
              const isDisabled = formatStatus === 'unavailable' || formatStatus === 'exporting'
              return (
                <button
                  key={format}
                  type="button"
                  role="menuitem"
                  aria-disabled={isDisabled || undefined}
                  onClick={() => {
                    if (isDisabled) return
                    if (isFailed) setStatus(s => ({ ...s, [format]: 'ready' }))
                    requestExport(format)
                  }}
                  className="dk-focus-ring"
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px',
                    borderRadius: 'var(--r-sm)',
                    border: 'none', background: 'transparent',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left', fontFamily: 'var(--font-body)',
                    transition: 'background 0.1s',
                    opacity: formatStatus === 'unavailable' ? 0.65 : 1,
                  }}
                  onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)' }}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <Icon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: sublabel ? 1 : 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{label}</div>
                    {sublabel && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{sublabel}</div>
                    )}
                    {isFailed && (
                      <div style={{ fontSize: 11.5, color: 'var(--danger, #E8515A)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} aria-hidden /> Export failed — click to retry
                      </div>
                    )}
                  </div>
                  <ExportStatusBadge status={formatStatus} />
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ExportStatusBadge({ status }: { status: ExportStatus }) {
  switch (status) {
    case 'exporting':
      return <Loader2 size={13} aria-hidden className="studio-spin" style={{ color: 'var(--accent)', flexShrink: 0 }} />
    case 'success':
      return <CheckCircle2 size={13} aria-hidden style={{ color: 'var(--success)', flexShrink: 0 }} />
    case 'failed':
      return <RotateCcw size={13} aria-hidden style={{ color: 'var(--danger, #E8515A)', flexShrink: 0 }} />
    case 'unavailable':
      return (
        <span
          style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
            padding: '2px 7px', borderRadius: 'var(--r-pill)',
            background: 'var(--surface-muted)', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          Soon
        </span>
      )
    case 'ready':
      return null
  }
}
