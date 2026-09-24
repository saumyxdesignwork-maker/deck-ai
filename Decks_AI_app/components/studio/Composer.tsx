'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState, KeyboardEvent, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Plus, Mic, ArrowUp, ChevronDown, Upload, FolderOpenDot, Plug, Loader2, Square } from 'lucide-react'
import { useAutosizeTextarea } from '@/lib/useAutosizeTextarea'
import { useSpeechInput } from '@/lib/useSpeechInput'
import { motionPresets } from '@/lib/motion'

// Simple three-tone Drive mark — no brand asset dependency, just a recognizable shape.
// Accepts the same size/style props as the lucide icons it sits alongside in ATTACH_OPTIONS.
function GoogleDriveIcon({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      <path d="M8.1 2.5 1 14.6l3.1 5.4h6.4l-3.1-5.4z" fill="#4285F4" />
      <path d="M15.9 2.5H8.1l6.4 11.1h7.8z" fill="#FBBC04" />
      <path d="M17.2 20h6.4l-3.1-5.4h-6.4z" fill="#34A853" />
    </svg>
  )
}

const ATTACH_OPTIONS = [
  { key: 'local', icon: Upload, label: 'Browse Local Files' },
  { key: 'ai-drive', icon: FolderOpenDot, label: 'Choose from AI Drive' },
  { key: 'google-drive', icon: GoogleDriveIcon, label: 'Choose from Google Drive' },
  { key: 'connectors', icon: Plug, label: 'Connectors' },
] as const

interface ComposerProps {
  /**
   * Called with the trimmed text. Return (or resolve) `false` to keep the
   * text in the field — e.g. the request failed and the user should retry.
   * A returned promise puts the composer in its pending state until it settles.
   */
  onSubmit: (text: string) => void | boolean | Promise<void | boolean>
  placeholder?: string
  /** Accessible name for the textarea, if it needs to differ from the
   * placeholder (e.g. the placeholder changes with state but the name
   * shouldn't). Defaults to `placeholder`. */
  ariaLabel?: string
  variant?: 'hero' | 'session'
  disabled?: boolean
  /** Controlled input — pass both to let a parent (e.g. a template click) fill the field. */
  value?: string
  onChange?: (value: string) => void
  /** Opens the data-connectors panel. Only wired in the Studio session
   * composer (there's a live session to attach data to); the other Attach
   * options stay cosmetic stubs everywhere, per the existing design. */
  onOpenConnectors?: () => void
  /** Inline error shown under the field (e.g. the service couldn't be reached). */
  errorMessage?: string | null
  /** Label announced/shown while a returned promise is pending. */
  pendingLabel?: string
  /** Blocks sending without disabling the field — unlike `disabled`, typing
   * (and editing a draft) stays live; only Send (click or Enter) is a no-op.
   * For e.g. "you can draft your next ask, but not send it yet". */
  sendDisabled?: boolean
  /** aria-label/title for the Send button while `sendDisabled` is true. */
  sendDisabledLabel?: string
  inputRef?: Ref<HTMLTextAreaElement>
}

export function Composer({
  onSubmit, placeholder = 'Enter your slides request here', ariaLabel, variant = 'session', disabled,
  value: controlledValue, onChange: controlledOnChange, onOpenConnectors, errorMessage, pendingLabel = 'Sending…',
  sendDisabled, sendDisabledLabel, inputRef,
}: ComposerProps) {
  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  const setValue = (v: string) => {
    if (isControlled) controlledOnChange?.(v)
    else setInternalValue(v)
  }
  const [model, setModel] = useState<'Standard' | 'Ultra'>('Standard')
  const [attachOpen, setAttachOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const attachRef = useRef<HTMLDivElement>(null)
  const attachButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const menuId = useId()
  const statusId = useId()
  const isHero = variant === 'hero'
  const m = motionPresets(useReducedMotion())

  useAutosizeTextarea(textareaRef, value, isHero ? 220 : 160)

  // Voice input — words stream into the field as they're recognized, after
  // whatever was already typed.
  const voiceBaseRef = useRef('')
  const speech = useSpeechInput((finalText, interim) => {
    const spoken = (finalText + interim).trim()
    setValue(voiceBaseRef.current + spoken)
  })
  const toggleVoice = () => {
    if (!speech.listening) voiceBaseRef.current = value.trim() ? `${value.trim()} ` : ''
    speech.toggle()
  }

  useEffect(() => {
    if (!attachOpen) return
    const handler = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setAttachOpen(false)
    }
    document.addEventListener('mousedown', handler)
    // Keyboard: focus the first item when the menu opens.
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => document.removeEventListener('mousedown', handler)
  }, [attachOpen])

  const closeMenu = (restoreFocus: boolean) => {
    setAttachOpen(false)
    if (restoreFocus) attachButtonRef.current?.focus()
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

  const busy = disabled || pending
  const canSend = !!value.trim() && !busy && !sendDisabled

  const submit = async () => {
    if (!canSend) return
    if (speech.listening) speech.stop()
    const result = onSubmit(value.trim())
    if (result instanceof Promise) {
      setPending(true)
      try {
        const ok = await result
        if (ok !== false) setValue('')
      } finally {
        setPending(false)
      }
    } else if (result !== false) {
      setValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape' && speech.listening) {
      e.preventDefault()
      speech.stop()
    }
  }

  useImperativeHandle(inputRef, () => textareaRef.current as HTMLTextAreaElement, [])

  const message = errorMessage ?? speech.error

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        className="dk-composer"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: isHero ? 'var(--r-xl)' : 'var(--r-lg)',
          boxShadow: isHero ? 'var(--sh-2)' : 'var(--sh-1)',
          padding: isHero ? '16px 18px 12px' : '10px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <textarea
          ref={textareaRef}
          className="dk-autosize"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={speech.listening ? 'Listening…' : placeholder}
          disabled={disabled}
          readOnly={pending}
          aria-label={ariaLabel ?? placeholder}
          aria-describedby={message || pending ? statusId : undefined}
          aria-invalid={errorMessage ? true : undefined}
          rows={isHero ? 2 : 1}
          style={{
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-body)',
            fontSize: isHero ? 15 : 13,
            color: 'var(--text)',
            lineHeight: 1.5,
            opacity: pending ? 0.7 : 1,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={attachRef} style={{ position: 'relative' }}>
            <button
              ref={attachButtonRef}
              type="button"
              onClick={() => setAttachOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={attachOpen}
              aria-controls={attachOpen ? menuId : undefined}
              aria-label="Attach"
              className="dk-select dk-focus-ring"
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid var(--border)',
                background: attachOpen ? 'var(--accent-soft)' : 'var(--surface-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: attachOpen ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0,
              }}
              title="Attach"
            >
              <Plus size={14} style={{ transform: attachOpen ? 'rotate(45deg)' : 'none', transition: m.reduce ? 'none' : 'transform 0.14s' }} />
            </button>

            <AnimatePresence>
              {attachOpen && (
                <motion.div
                  ref={menuRef}
                  id={menuId}
                  role="menu"
                  aria-label="Attach"
                  onKeyDown={onMenuKeyDown}
                  initial={{ opacity: 0, y: m.reduce ? 0 : 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: m.exit }}
                  transition={m.menu}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: 8,
                    minWidth: 210,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--sh-3)',
                    padding: 4,
                    zIndex: 20,
                    transformOrigin: 'bottom left',
                  }}
                >
                  {ATTACH_OPTIONS.map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenu(true)
                        if (key === 'connectors') onOpenConnectors?.()
                      }}
                      className="dk-focus-ring"
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px',
                        borderRadius: 'var(--r-sm)',
                        border: 'none', background: 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                        fontSize: 13, color: 'var(--text)',
                        fontFamily: 'var(--font-body)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setModel(m => (m === 'Standard' ? 'Ultra' : 'Standard'))}
            className="dk-focus-ring"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--border)', background: 'var(--surface-muted)',
              fontSize: 12, fontWeight: 500, color: 'var(--text)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            {model}
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </button>

          <div style={{ flex: 1 }} />

          {/* Voice input: a clear, static "listening" state (filled pill +
              label + stop icon) — no continuous pulsing. */}
          <button
            type="button"
            onClick={toggleVoice}
            disabled={!speech.supported || busy}
            aria-pressed={speech.listening}
            aria-label={
              !speech.supported ? 'Voice input is not supported in this browser'
                : speech.listening ? 'Stop voice input' : 'Start voice input'
            }
            title={!speech.supported ? 'Voice input is not supported in this browser' : speech.listening ? 'Stop voice input' : 'Voice input'}
            className="dk-select dk-focus-ring"
            style={{
              height: 28, minWidth: 28, borderRadius: 'var(--r-pill)',
              padding: speech.listening ? '0 10px 0 8px' : 0,
              border: '1px solid',
              borderColor: speech.listening ? 'var(--accent)' : 'transparent',
              background: speech.listening ? 'var(--accent-soft)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: speech.supported && !busy ? 'pointer' : 'not-allowed',
              color: speech.listening ? 'var(--accent)' : speech.supported ? 'var(--text-muted)' : 'var(--text-disabled)',
              flexShrink: 0, fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
            }}
          >
            {speech.listening ? <Square size={11} fill="currentColor" aria-hidden /> : <Mic size={15} aria-hidden />}
            {speech.listening && <span>Listening</span>}
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label={sendDisabled ? (sendDisabledLabel ?? 'Send') : pending ? pendingLabel : 'Send'}
            aria-busy={pending || undefined}
            className="dk-press dk-focus-ring"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: 'none',
              background: canSend || pending ? 'var(--primary)' : 'var(--surface-muted)',
              color: canSend || pending ? 'var(--primary-fg)' : 'var(--text-disabled)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canSend ? 'pointer' : pending ? 'wait' : 'not-allowed',
              flexShrink: 0,
            }}
            title={sendDisabled ? (sendDisabledLabel ?? 'Send') : pending ? pendingLabel : 'Send'}
          >
            {pending ? <Loader2 size={15} className="studio-spin" aria-hidden /> : <ArrowUp size={15} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Inline progress / error — stays in place under the field, never
          blocks the page. role=alert only for errors; progress is polite. */}
      <div id={statusId} aria-live="polite" style={{ minHeight: isHero ? 18 : 0 }}>
        <AnimatePresence initial={false} mode="wait">
          {pending ? (
            <motion.p key="pending" {...m.fade} transition={m.content} style={statusTextStyle('var(--text-muted)')}>
              {pendingLabel}
            </motion.p>
          ) : message ? (
            <motion.p key={message} role="alert" {...m.fade} transition={m.content} style={statusTextStyle('var(--danger, #C2410C)')}>
              {message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

function statusTextStyle(color: string): React.CSSProperties {
  return { margin: 0, padding: '0 6px', fontSize: 12.5, lineHeight: 1.4, color, fontFamily: 'var(--font-body)' }
}
