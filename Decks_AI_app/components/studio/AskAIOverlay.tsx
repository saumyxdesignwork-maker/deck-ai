'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Heading1, AlignLeft, Flame, LayoutGrid, Image as ImageIcon, Sparkles, Send, Loader2 } from 'lucide-react'
import { DeckSection, LayoutType, LAYOUT_OPTIONS } from '@/lib/fixtures'

const INSERT_OPTIONS = [
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
  { type: 'callout', label: 'Callout', icon: Flame },
  { type: 'card-group', label: 'Cards', icon: LayoutGrid },
  { type: 'image', label: 'Image', icon: ImageIcon },
] as const

interface LogItem {
  id: string
  role: 'user' | 'ai'
  text: string
}

let logUid = 0
function nextLogId() {
  logUid += 1
  return `log-${logUid}`
}

interface AskAIOverlayProps {
  section: DeckSection | null
  onClose: () => void
  onInsertBlock: (blockType: string) => void
  onSetLayout: (layout: LayoutType) => void
  onRemixSection: (instruction: string) => Promise<void>
  isRemixing: boolean
}

/**
 * Dedicated focused conversation surface — opened via ⌘⌘ or the visible
 * "Ask AI" button once a first draft exists. Renders as an opaque layer on
 * top of the canvas (not a JSX swap) so the canvas underneath keeps its
 * scroll position and state, ready to reappear exactly as it was on close.
 */
export function AskAIOverlay({ section, onClose, onInsertBlock, onSetLayout, onRemixSection, isRemixing }: AskAIOverlayProps) {
  const [log, setLog] = useState<LogItem[]>(() => [
    {
      id: nextLogId(),
      role: 'ai',
      text: section
        ? `What should change on "${section.title}"? Insert a block, switch its layout, or describe an edit below.`
        : 'Select a slide, then tell me what should change.',
    },
  ])
  const [instruction, setInstruction] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // Focus management: remember what had focus before opening, move focus
  // into the dialog, restore it on close — plus a lightweight Tab trap and
  // Esc-to-close, matching standard dialog a11y expectations.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    return () => {
      previouslyFocusedRef.current?.focus?.()
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea:not(:disabled), [href], input:not(:disabled)',
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const pushLog = (role: LogItem['role'], text: string) => setLog(prev => [...prev, { id: nextLogId(), role, text }])

  const handleInsert = (blockType: string, label: string) => {
    onInsertBlock(blockType)
    pushLog('user', `Insert a ${label} block`)
    pushLog('ai', `Added a ${label} block to "${section?.title ?? 'this slide'}".`)
  }

  const handleLayout = (layout: LayoutType, label: string) => {
    onSetLayout(layout)
    pushLog('user', `Switch layout to ${label}`)
    pushLog('ai', `Set the layout to "${label}" — undo any time with Cmd+Z.`)
  }

  const handleSend = async () => {
    const text = instruction.trim()
    if (!text || isRemixing || !section) return
    setInstruction('')
    pushLog('user', text)
    await onRemixSection(text)
    pushLog('ai', `Updated "${section.title}" per your note.`)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask AI"
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: 440,
          maxWidth: 'calc(100% - 48px)',
          height: '80%',
          maxHeight: 640,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--sh-3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--divider)' }}>
          <Sparkles size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>Ask AI</div>
            {section && (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {section.title}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 26, height: 26, borderRadius: '50%',
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Transcript */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {log.map(item => (
            <div
              key={item.id}
              style={{
                alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                background: item.role === 'user' ? 'var(--primary)' : 'var(--surface-muted)',
                color: item.role === 'user' ? 'var(--primary-fg)' : 'var(--text)',
                fontSize: 13, lineHeight: 1.5, fontFamily: 'var(--font-body)',
              }}
            >
              {item.text}
            </div>
          ))}
          {isRemixing && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12.5, fontFamily: 'var(--font-body)' }}>
              <Loader2 size={13} className="animate-spin" /> Working on it…
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        {/* Quick actions */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Insert</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {INSERT_OPTIONS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => handleInsert(type, label)}
                  disabled={!section || isRemixing}
                  style={chipStyle}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Layout</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LAYOUT_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleLayout(id, label)}
                  disabled={!section || isRemixing}
                  style={chipStyle}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 2 }}>
            <textarea
              ref={inputRef}
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Describe a change for this slide…"
              rows={2}
              disabled={isRemixing}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '8px 10px',
                background: 'var(--surface-muted)',
                color: 'var(--text)',
                fontSize: 13, fontFamily: 'var(--font-body)',
                resize: 'none', outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!instruction.trim() || isRemixing || !section}
              title="Send"
              style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                border: 'none',
                background: instruction.trim() && !isRemixing ? 'var(--primary)' : 'var(--surface-muted)',
                color: instruction.trim() && !isRemixing ? 'var(--primary-fg)' : 'var(--text-disabled)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: instruction.trim() && !isRemixing ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const chipStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 10px',
  borderRadius: 'var(--r-pill)',
  border: '1px solid var(--border)',
  background: 'var(--surface-muted)',
  color: 'var(--text)',
  fontSize: 12, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-body)',
  whiteSpace: 'nowrap',
}
