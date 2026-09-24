'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, X, Undo2, RotateCcw } from 'lucide-react'
import { ChatItem } from '@/lib/studioScript'
import { DeckSection } from '@/lib/fixtures'
import { ChatItemView } from './ChatItem'

interface FloatingChatProps {
  isOpen: boolean
  onClose: () => void
  activeSection: DeckSection | null
  items: ChatItem[]
  isEditing: boolean
  editGroupId: string | null
  onSubmit: (instruction: string, activeSectionId?: string) => void
  canUndo: boolean
  onUndo: () => void
}

/**
 * Compact floating "talk to the deck" popup — bottom-center, no backdrop, so
 * the canvas stays visible and interactive behind it. Opened via ⌘⌘ or the
 * toolbar's "Ask AI" button. Renders the live agent run (Coordinator → Editor
 * → Reviewer) through the SAME chat-item components the persistent chat
 * uses (ChatItemView → ChainOfThoughtBlock/ToolChip/checklist/etc.) — these
 * are real progress events streamed from POST /edit, not a simulated effect.
 */
export function FloatingChat({ isOpen, onClose, activeSection, items, isEditing, editGroupId, onSubmit, canUndo, onUndo }: FloatingChatProps) {
  const [instruction, setInstruction] = useState('')
  const [viewMode, setViewMode] = useState<'compose' | 'run'>('compose')
  const [lastInstruction, setLastInstruction] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const scopeSectionRef = useRef<DeckSection | null>(null)

  // Fresh compose view every time the popup is (re)opened — a finished or
  // failed prior run stays visible in the persistent left chat's history,
  // it doesn't need to linger in the popup too.
  useEffect(() => {
    if (isOpen) {
      setViewMode('compose')
      setInstruction('')
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
    previouslyFocusedRef.current?.focus?.()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const groupIdx = editGroupId ? items.findIndex(i => i.id === editGroupId) : -1
  const includesLeadingUser = groupIdx > 0 && items[groupIdx - 1]?.type === 'user'
  const runItems = groupIdx === -1 ? [] : items.slice(includesLeadingUser ? groupIdx - 1 : groupIdx)
  const hasSummary = runItems.some(i => i.type === 'summary')
  const hasError = !isEditing && runItems.some(i => i.type === 'agent') && !hasSummary

  const handleSubmit = () => {
    const text = instruction.trim()
    if (!text || isEditing) return
    setLastInstruction(text)
    scopeSectionRef.current = activeSection
    setInstruction('')
    setViewMode('run')
    onSubmit(text, activeSection?.id)
  }

  const handleRetry = () => {
    if (!lastInstruction || isEditing) return
    onSubmit(lastInstruction, scopeSectionRef.current?.id)
  }

  const noop = () => {}

  return (
    <div
      role="dialog"
      aria-label="Ask AI"
      ref={containerRef}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 20,
        transform: 'translateX(-50%)',
        zIndex: 30,
        width: 420,
        maxWidth: 'calc(100% - 32px)',
        maxHeight: 'min(60vh, 560px)',
        display: 'flex',
        flexDirection: 'column',
        // Solid (not the translucent/glass --surface some visual languages
        // use) — this popup floats directly over live canvas content, so a
        // glassy background lets that text bleed through and turns
        // illegible fast.
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--sh-3)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: viewMode === 'run' ? '1px solid var(--divider)' : 'none' }}>
        <Sparkles size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', flex: 1 }}>Ask AI</span>
        <span
          title={activeSection ? `Editing: ${activeSection.title}` : 'Whole deck'}
          style={{
            fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
            padding: '2px 8px', borderRadius: 'var(--r-pill)', background: 'var(--surface-muted)',
            maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {activeSection ? activeSection.title : 'Whole deck'}
        </span>
        <button onClick={onClose} aria-label="Close" style={iconBtnStyle}>
          <X size={13} />
        </button>
      </div>

      {viewMode === 'run' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {runItems.map(item => (
            <ChatItemView key={item.id} item={item} onAnswerClarify={noop} onOpenConnectors={noop} />
          ))}
          {hasError && (
            <button onClick={handleRetry} style={retryBtnStyle}>
              <RotateCcw size={12} /> Retry
            </button>
          )}
        </div>
      )}

      {/* Composer */}
      <div style={{ padding: '10px 12px', borderTop: viewMode === 'compose' ? 'none' : '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {viewMode === 'run' && !isEditing && (canUndo || hasSummary) && (
          <button onClick={onUndo} disabled={!canUndo} style={{ ...retryBtnStyle, alignSelf: 'flex-start', opacity: canUndo ? 1 : 0.5, cursor: canUndo ? 'pointer' : 'not-allowed' }}>
            <Undo2 size={12} /> Undo this edit
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <textarea
            ref={inputRef}
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask AI to change this deck…"
            rows={1}
            disabled={isEditing}
            style={{
              flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: '8px 10px', background: 'var(--surface-muted)', color: 'var(--text)',
              fontSize: 13, fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', maxHeight: 100,
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!instruction.trim() || isEditing}
            title="Send"
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, border: 'none',
              background: instruction.trim() && !isEditing ? 'var(--primary)' : 'var(--surface-muted)',
              color: instruction.trim() && !isEditing ? 'var(--primary-fg)' : 'var(--text-disabled)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: instruction.trim() && !isEditing ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-muted)', flexShrink: 0,
}

const retryBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 10px', borderRadius: 'var(--r-pill)',
  border: '1px solid var(--border)', background: 'var(--surface-muted)',
  color: 'var(--text)', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
}
