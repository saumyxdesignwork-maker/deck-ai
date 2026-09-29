'use client'

import { useEffect, useId, useRef, useState, KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Download, FileText, Presentation, Globe, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import { motionPresets } from '@/lib/motion'
import { captureSlides, exportToPdf, exportToPptx, exportToHtml } from '@/lib/deckExport'
import type { AspectRatio } from '@/lib/fixtures'

type ExportFormat = 'pdf' | 'pptx' | 'html'
/** The full lifecycle a format can be in. */
type ExportStatus = 'ready' | 'exporting' | 'success' | 'failed' | 'unavailable'

// All three formats export for real now (see lib/deckExport.ts) — client
// side, by rasterizing each rendered slide and assembling it into the
// target file, rather than a backend rendering pipeline. 'unavailable'
// stays a reachable status (via `initialStatus`) for a format that isn't
// ready, but nothing sets it by default anymore.
const INITIAL_STATUS: Record<ExportFormat, ExportStatus> = {
  pdf: 'ready',
  pptx: 'ready',
  html: 'ready',
}

// How long a success checkmark stays up before the item resets to 'ready' —
// long enough to register, short enough that exporting the same format
// twice in a row doesn't feel stuck.
const SUCCESS_RESET_MS = 2200

const FORMAT_META: Record<ExportFormat, { icon: typeof FileText; label: string; sublabel?: string }> = {
  pdf: { icon: FileText, label: 'Export as PDF' },
  pptx: { icon: Presentation, label: 'Export as PowerPoint' },
  html: { icon: Globe, label: 'Export as HTML', sublabel: 'Standalone interactive web page' },
}

const FORMAT_ORDER: ExportFormat[] = ['pdf', 'pptx', 'html']

/**
 * The deck's primary export entry point — a visible top-bar action (not
 * buried in an overflow/"More" menu) that opens a small menu of format
 * choices. Every format is a real, working download: each rasterizes the
 * deck's own already-rendered slide DOM (the same pixels the customer is
 * looking at, template and all) via html-to-image, then assembles that into
 * a PDF (jsPDF), a PowerPoint (pptxgenjs, one full-bleed image per slide —
 * not editable text boxes; faithful to what's on screen was judged more
 * valuable than an editable-but-drifted recreation), or a self-contained
 * HTML slideshow.
 */
interface ExportMenuProps {
  /** Every currently-rendered slide's root element, cover first, in order —
   * PreviewPane already keeps exactly this in `slideRefs` for scroll/verify
   * purposes, so export reuses it rather than re-deriving its own DOM query. */
  getSlideNodes: () => HTMLElement[]
  title: string
  aspectRatio?: AspectRatio
  /** Test-only seam for exercising the exporting/success/failed states
   * without driving a real capture — the real call site never passes this. */
  initialStatus?: Partial<Record<ExportFormat, ExportStatus>>
}

export function ExportMenu({ getSlideNodes, title, aspectRatio, initialStatus }: ExportMenuProps) {
  const [status, setStatus] = useState({ ...INITIAL_STATUS, ...initialStatus })
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const m = motionPresets(useReducedMotion())
  const resetTimers = useRef<Partial<Record<ExportFormat, ReturnType<typeof setTimeout>>>>({})

  useEffect(() => {
    const timers = resetTimers.current
    return () => { Object.values(timers).forEach(t => t && clearTimeout(t)) }
  }, [])

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

  const requestExport = async (format: ExportFormat) => {
    setStatus(s => ({ ...s, [format]: 'exporting' }))
    // Exporting closes the menu so the user sees the canvas (a large,
    // multi-second DOM rasterization can otherwise look like the menu is
    // just frozen) — the trigger button's own status badge (added below)
    // keeps the in-progress state visible without the panel open.
    closeMenu(false)
    try {
      const nodes = getSlideNodes()
      if (nodes.length === 0) throw new Error('No slides to export')
      const images = await captureSlides(nodes)
      if (format === 'pdf') await exportToPdf(images, title, aspectRatio)
      else if (format === 'pptx') await exportToPptx(images, title, aspectRatio)
      else exportToHtml(images, title)
      setStatus(s => ({ ...s, [format]: 'success' }))
      resetTimers.current[format] = setTimeout(() => {
        setStatus(s => ({ ...s, [format]: 'ready' }))
      }, SUCCESS_RESET_MS)
    } catch (err) {
      console.error(`Export (${format}) failed`, err)
      setStatus(s => ({ ...s, [format]: 'failed' }))
    }
  }

  const anyExporting = Object.values(status).includes('exporting')

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-busy={anyExporting || undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-sm)',
          border: '1px solid transparent',
          // Inverted, on purpose — this is the deck's primary/first action
          // now, promoted above Present/History, and a solid white pill on
          // the app's dark chrome reads as the one action that isn't
          // optional, the way the other mini-bar buttons (outlined/muted) do
          // not.
          background: open ? '#EDEDED' : '#FFFFFF',
          fontSize: 11.5, color: '#0A0A0A', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        {anyExporting ? <Loader2 size={12} className="studio-spin" aria-hidden /> : <Download size={12} aria-hidden />}
        Export
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
              // Covers this item's own 'exporting' too — anyExporting is
              // derived from `status`, so it's already true whenever this
              // format is the one in flight.
              const isDisabled = formatStatus === 'unavailable' || anyExporting
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
