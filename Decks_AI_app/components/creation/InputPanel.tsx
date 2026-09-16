'use client'

import { useState, useRef } from 'react'
import { Upload, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react'
import { CreationMethod } from '@/lib/createContext'
import { SUGGESTED_PROMPTS } from '@/lib/fixtures'

interface InputPanelProps {
  method: CreationMethod
  value: string
  onChange: (v: string) => void
}

export function InputPanel({ method, value, onChange }: InputPanelProps) {
  const [urlValue, setUrlValue] = useState('')
  const [dragging, setDragging] = useState(false)
  const [droppedFile, setDroppedFile] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (method === 'prompt') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your deck… e.g. 'Create a pitch deck for an AI-powered SaaS product targeting SMBs, showing market size, product demo, and pricing'"
          style={{
            flex: 1,
            minHeight: 180,
            padding: '14px 16px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 14,
            color: 'var(--text)',
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--sh-1)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {/* Suggested prompts */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Try a prompt
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onChange(prompt)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 12,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  fontFamily: 'var(--font-body)',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--accent)'
                  el.style.background = 'var(--accent-soft)'
                  el.style.color = 'var(--accent)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--border)'
                  el.style.background = 'var(--surface)'
                  el.style.color = 'var(--text)'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (method === 'paste') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your notes, PRD, article, or any text here… DeckAI will structure it into a deck automatically."
          style={{
            flex: 1,
            minHeight: 220,
            padding: '14px 16px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 13,
            color: 'var(--text)',
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--sh-1)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {/* Content-type indicator */}
        {value.length > 40 && (
          <div
            className="animate-fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--success-soft)',
              border: '1px solid var(--success)',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--success)',
              alignSelf: 'flex-start',
            }}
          >
            <CheckCircle2 size={12} />
            Detected: Product Requirements Document
          </div>
        )}
      </div>
    )
  }

  // Import
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
      {/* URL input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: 'var(--sh-1)',
        }}
      >
        <LinkIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="url"
          value={urlValue}
          onChange={(e) => {
            setUrlValue(e.target.value)
            onChange(e.target.value)
          }}
          placeholder="Paste a URL — article, Notion page, Google Doc, blog post…"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--text)',
            background: 'transparent',
            fontFamily: 'var(--font-body)',
          }}
        />
        {urlValue && (
          <button
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--accent)',
              border: 'none',
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            Fetch
          </button>
        )}
      </div>

      {/* Drag-and-drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) {
            setDroppedFile(file.name)
            onChange(file.name)
          }
        }}
        style={{
          flex: 1,
          minHeight: 180,
          borderRadius: 'var(--r-lg)',
          border: `2px dashed ${dragging ? 'var(--accent)' : droppedFile ? 'var(--success)' : 'var(--border)'}`,
          background: dragging ? 'var(--accent-soft)' : droppedFile ? 'var(--success-soft)' : 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
      >
        {droppedFile ? (
          <>
            <CheckCircle2 size={28} style={{ color: 'var(--success)' }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--success)', margin: 0 }}>{droppedFile}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>File ready to process</p>
          </>
        ) : (
          <>
            <Upload size={28} style={{ color: 'var(--text-muted)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: '0 0 4px' }}>
                Drop a file here
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>or click to browse</p>
            </div>
            {/* Format badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['PDF', 'DOCX', 'MD', 'TXT', 'PPTX'].map((fmt) => (
                <span
                  key={fmt}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {fmt}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
