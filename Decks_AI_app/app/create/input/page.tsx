'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, ClipboardType, Link } from 'lucide-react'
import { AppLayout } from '@/components/shell/AppLayout'
import { InputPanel } from '@/components/creation/InputPanel'
import { PreferencesBar } from '@/components/creation/PreferencesBar'
import { useCreate } from '@/lib/createContext'

const METHOD_META = {
  prompt: { icon: Sparkles, label: 'Generate from Prompt' },
  paste: { icon: ClipboardType, label: 'Paste Text / Notes' },
  import: { icon: Link, label: 'Import URL or File' },
}

export default function InputPage() {
  const router = useRouter()
  const { method, input, setInput, preferences, setPreferences } = useCreate()
  const meta = METHOD_META[method]

  const canGenerate = input.trim().length > 0

  const handleGenerate = () => {
    router.push('/create/storyline')
  }

  return (
    <AppLayout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '28px 40px 16px',
            gap: 16,
            overflow: 'auto',
            maxWidth: 760,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Back + method label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button
              onClick={() => router.push('/create')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-muted)',
                padding: '4px 0',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <span style={{ color: 'var(--divider)' }}>·</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <meta.icon size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                {meta.label}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 6,
              }}
            >
              {method === 'prompt' && 'What deck do you want to create?'}
              {method === 'paste' && 'Paste your content'}
              {method === 'import' && 'Import from a URL or file'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {method === 'prompt' && 'Be as specific or brief as you like — DeckAI handles the structure.'}
              {method === 'paste' && 'Up to 50,000 characters. DeckAI will detect the content type automatically.'}
              {method === 'import' && 'Paste a URL or drop a file below. Supported: PDF, DOCX, MD, TXT, PPTX.'}
            </p>
          </div>

          {/* Input panel */}
          <InputPanel method={method} value={input} onChange={setInput} />

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 22px',
                borderRadius: 'var(--r-pill)',
                border: 'none',
                background: canGenerate ? 'var(--primary)' : 'var(--surface-muted)',
                color: canGenerate ? 'var(--primary-fg)' : 'var(--text-disabled)',
                fontSize: 13,
                fontWeight: 600,
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => {
                if (canGenerate)
                  (e.currentTarget as HTMLElement).style.background = 'var(--primary-hover)'
              }}
              onMouseLeave={e => {
                if (canGenerate)
                  (e.currentTarget as HTMLElement).style.background = 'var(--primary)'
              }}
            >
              <Sparkles size={14} />
              Generate Storyline
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {!canGenerate && 'Add some content to continue'}
            </span>
          </div>
        </div>

        {/* Preferences bar */}
        <PreferencesBar prefs={preferences} onChange={setPreferences} />
      </div>
    </AppLayout>
  )
}
