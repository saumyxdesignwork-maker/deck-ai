'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ClipboardPaste, Upload, Sheet, FileText, MessageSquare, Mail, ChevronLeft, Loader2, Check } from 'lucide-react'
import { DeckDataset, DeckDatasetColumn, DeckDatasetRow, MAX_DATASET_ROWS, parseDelimitedTable } from '@/lib/dataset'
import { SERVICE_BASE_URL } from '@/lib/deckStream'

const COMING_SOON_PROVIDERS = [
  { key: 'google-docs', label: 'Google Docs', icon: FileText },
  { key: 'notion', label: 'Notion', icon: FileText },
  { key: 'slack', label: 'Slack', icon: MessageSquare },
  { key: 'email', label: 'Email', icon: Mail },
] as const

/** The connector entry points a caller can jump straight into (skipping the
 * provider list) — e.g. from DataNudgeCard's per-connector buttons. */
export type ConnectStep = 'providers' | 'paste' | 'sheets'

type Step =
  | { kind: 'providers' }
  | { kind: 'paste' }
  | { kind: 'sheets' }
  | { kind: 'preview'; source: string; columns: string[]; rows: DeckDatasetRow[] }

interface DataConnectPanelProps {
  sessionId: string | null
  initialStep?: ConnectStep
  onClose: () => void
  onAttach: (dataset: DeckDataset) => void
}

export function DataConnectPanel({ sessionId, initialStep = 'providers', onClose, onAttach }: DataConnectPanelProps) {
  const [step, setStep] = useState<Step>({ kind: initialStep })
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    return () => previouslyFocusedRef.current?.focus?.()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect data"
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: 460, maxWidth: 'calc(100% - 48px)', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--divider)' }}>
          {step.kind !== 'providers' && (
            <button onClick={() => setStep({ kind: 'providers' })} aria-label="Back" style={iconBtnStyle}>
              <ChevronLeft size={16} />
            </button>
          )}
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            {step.kind === 'providers' && 'Connect data'}
            {step.kind === 'paste' && 'Paste or upload a table'}
            {step.kind === 'sheets' && 'Google Sheets'}
            {step.kind === 'preview' && 'Review before attaching'}
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtnStyle}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {step.kind === 'providers' && <ProvidersStep onPickPaste={() => setStep({ kind: 'paste' })} onPickSheets={() => setStep({ kind: 'sheets' })} />}
          {step.kind === 'paste' && <PasteStep onParsed={(source, columns, rows) => setStep({ kind: 'preview', source, columns, rows })} />}
          {step.kind === 'sheets' && (
            <SheetsStep sessionId={sessionId} onImported={(source, columns, rows) => setStep({ kind: 'preview', source, columns, rows })} />
          )}
          {step.kind === 'preview' && (
            <PreviewStep
              source={step.source}
              columns={step.columns}
              rows={step.rows}
              onConfirm={dataset => onAttach(dataset)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ProvidersStep({ onPickPaste, onPickSheets }: { onPickPaste: () => void; onPickSheets: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>
        Ground this deck in real data. We only send the rows you choose to map — never a whole sheet or file.
      </p>

      <ProviderTile icon={ClipboardPaste} label="Paste or upload a table" desc="CSV, TSV, or a table pasted from a spreadsheet" onClick={onPickPaste} />
      <ProviderTile icon={Sheet} label="Google Sheets" desc="Connect your account and pick a sheet" onClick={onPickSheets} />

      <div style={{ margin: '8px 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Coming soon
      </div>
      {COMING_SOON_PROVIDERS.map(({ key, label, icon: Icon }) => (
        <ProviderTile key={key} icon={Icon} label={label} desc="Not connected yet" disabled />
      ))}
    </div>
  )
}

function ProviderTile({ icon: Icon, label, desc, onClick, disabled }: { icon: React.ElementType; label: string; desc: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        background: disabled ? 'var(--surface)' : 'var(--surface-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left', width: '100%',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{desc}</div>
      </div>
    </button>
  )
}

function PasteStep({ onParsed }: { onParsed: (source: string, columns: string[], rows: DeckDatasetRow[]) => void }) {
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setSource(file.name)
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const handleParse = () => {
    const result = parseDelimitedTable(text)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setError(null)
    onParsed(source || 'Pasted table', result.columns, result.rows)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        value={source}
        onChange={e => setSource(e.target.value)}
        placeholder="Source name (optional) — e.g. Q3 sales export"
        style={inputStyle}
      />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={'Paste a table here — e.g.\nRegion, Revenue, Growth\nWest, $1.2M, 18%\nEast, $890K, 9%'}
        rows={8}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => fileInputRef.current?.click()} style={secondaryBtnStyle}>
          <Upload size={13} /> Upload .csv / .tsv
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>
      {error && <div style={{ fontSize: 12, color: '#E8515A', fontFamily: 'var(--font-body)' }}>{error}</div>}
      <button onClick={handleParse} disabled={!text.trim()} style={primaryBtnStyle(Boolean(text.trim()))}>
        Preview table
      </button>
    </div>
  )
}

function SheetsStep({ sessionId, onImported }: { sessionId: string | null; onImported: (source: string, columns: string[], rows: DeckDatasetRow[]) => void }) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [link, setLink] = useState('')
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [tabs, setTabs] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!sessionId) return
    fetch(`${SERVICE_BASE_URL}/connectors/google/status?sessionId=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(data => setConnected(Boolean(data.connected)))
      .catch(() => setConnected(false))
  }, [sessionId])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const handleConnect = async () => {
    if (!sessionId) return
    setError(null)
    setIsConnecting(true)
    try {
      const res = await fetch(`${SERVICE_BASE_URL}/connectors/google/auth-url?sessionId=${encodeURIComponent(sessionId)}`)
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'NOT_CONFIGURED') setNotConfigured(true)
        else setError(data.error ?? 'Could not start Google sign-in')
        setIsConnecting(false)
        return
      }
      window.open(data.url, '_blank', 'width=480,height=640')
      const startedAt = Date.now()
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > 120_000) {
          if (pollRef.current) clearInterval(pollRef.current)
          setIsConnecting(false)
          setError('Sign-in timed out — try again.')
          return
        }
        try {
          const statusRes = await fetch(`${SERVICE_BASE_URL}/connectors/google/status?sessionId=${encodeURIComponent(sessionId)}`)
          const statusData = await statusRes.json()
          if (statusData.connected) {
            if (pollRef.current) clearInterval(pollRef.current)
            setConnected(true)
            setIsConnecting(false)
          }
        } catch {
          // keep polling — a transient network hiccup shouldn't abort the wait
        }
      }, 2000)
    } catch {
      setError('Could not reach Decks AI Service — is it running?')
      setIsConnecting(false)
    }
  }

  const handleListTabs = async () => {
    if (!sessionId || !link.trim()) return
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch(`${SERVICE_BASE_URL}/connectors/google/sheets/tabs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, sheetUrlOrId: link.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not read that spreadsheet')
        return
      }
      setSpreadsheetId(data.spreadsheetId)
      setTabs(data.tabs)
    } catch {
      setError('Could not reach Decks AI Service — is it running?')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportTab = async (tabName: string) => {
    if (!sessionId || !spreadsheetId) return
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch(`${SERVICE_BASE_URL}/connectors/google/sheets/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, spreadsheetId, tabName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not import that sheet')
        return
      }
      const dataset = data.dataset as DeckDataset
      onImported(dataset.source, dataset.columns.map(c => c.name), dataset.rows)
    } catch {
      setError('Could not reach Decks AI Service — is it running?')
    } finally {
      setIsLoading(false)
    }
  }

  if (notConfigured) {
    return (
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        Google Sheets isn't set up on this server yet — it needs a Google OAuth client added to the backend's
        configuration. Use "Paste or upload a table" in the meantime.
      </p>
    )
  }

  if (connected === null) {
    return <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Checking connection…</div>
  }

  if (!connected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
          Connect a Google account with read-only access to Sheets. We only ever read the specific sheet and tab you pick.
        </p>
        <button onClick={handleConnect} disabled={isConnecting} style={primaryBtnStyle(!isConnecting)}>
          {isConnecting ? <Loader2 size={13} className="animate-spin" /> : <Sheet size={13} />}
          {isConnecting ? 'Waiting for sign-in…' : 'Connect Google Sheets'}
        </button>
        {error && <div style={{ fontSize: 12, color: '#E8515A', fontFamily: 'var(--font-body)' }}>{error}</div>}
      </div>
    )
  }

  if (!tabs) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
          <Check size={13} /> Google account connected
        </div>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="Paste a Google Sheets link" style={inputStyle} />
        <button onClick={handleListTabs} disabled={!link.trim() || isLoading} style={primaryBtnStyle(Boolean(link.trim()) && !isLoading)}>
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : null}
          {isLoading ? 'Loading…' : 'Find tabs'}
        </button>
        {error && <div style={{ fontSize: 12, color: '#E8515A', fontFamily: 'var(--font-body)' }}>{error}</div>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>Choose a tab to import:</p>
      {tabs.map(tab => (
        <button key={tab} onClick={() => handleImportTab(tab)} disabled={isLoading} style={secondaryBtnStyle}>
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Sheet size={13} />} {tab}
        </button>
      ))}
      {error && <div style={{ fontSize: 12, color: '#E8515A', fontFamily: 'var(--font-body)' }}>{error}</div>}
    </div>
  )
}

function PreviewStep({ source, columns, rows, onConfirm }: { source: string; columns: string[]; rows: DeckDatasetRow[]; onConfirm: (dataset: DeckDataset) => void }) {
  const [roles, setRoles] = useState<Record<string, DeckDatasetColumn['role']>>(() =>
    Object.fromEntries(columns.map((name, i) => [name, i === 0 ? 'label' : 'value'])),
  )
  const truncated = rows.length > MAX_DATASET_ROWS
  const capped = rows.slice(0, MAX_DATASET_ROWS)

  const handleConfirm = () => {
    onConfirm({
      source,
      capturedAt: new Date().toISOString(),
      columns: columns.map(name => ({ name, role: roles[name] })),
      rows: capped,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        {source} · {capped.length} row{capped.length === 1 ? '' : 's'}{truncated ? ` (of ${rows.length} — capped at ${MAX_DATASET_ROWS})` : ''}
      </div>

      <div style={{ overflow: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12, fontFamily: 'var(--font-body)' }}>
          <thead>
            <tr>
              {columns.map(name => (
                <th key={name} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid var(--divider)', background: 'var(--surface-muted)', whiteSpace: 'nowrap' }}>
                  <div style={{ marginBottom: 4, color: 'var(--text)', fontWeight: 600 }}>{name}</div>
                  <select
                    value={roles[name]}
                    onChange={e => setRoles(prev => ({ ...prev, [name]: e.target.value as DeckDatasetColumn['role'] }))}
                    style={{ fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <option value="label">Label</option>
                    <option value="value">Value</option>
                    <option value="ignore">Ignore</option>
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capped.slice(0, 5).map((row, i) => (
              <tr key={i}>
                {columns.map(name => (
                  <td key={name} style={{ padding: '6px 8px', borderBottom: '1px solid var(--divider)', color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row[name]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {capped.length > 5 && (
        <div style={{ fontSize: 11.5, color: 'var(--text-disabled)', fontFamily: 'var(--font-body)' }}>
          Showing first 5 of {capped.length} rows.
        </div>
      )}

      <button onClick={handleConfirm} style={primaryBtnStyle(true)}>
        <Check size={13} /> Attach this data
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--border)', background: 'var(--surface-muted)',
  color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)',
  outline: 'none', boxSizing: 'border-box',
}

const iconBtnStyle: React.CSSProperties = {
  width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0,
}

const secondaryBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
  padding: '8px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
  background: 'var(--surface-muted)', color: 'var(--text)', fontSize: 12.5, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%',
}

function primaryBtnStyle(enabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    padding: '9px 14px', borderRadius: 'var(--r-pill)', border: 'none',
    background: enabled ? 'var(--primary)' : 'var(--surface-muted)',
    color: enabled ? 'var(--primary-fg)' : 'var(--text-disabled)',
    fontSize: 13, fontWeight: 600, cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'var(--font-body)',
  }
}
