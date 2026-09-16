'use client'

import { Loader2, CheckCircle2, FileSearch, ShieldCheck } from 'lucide-react'

interface ToolChipProps {
  label: string
  detail: string
  status: 'running' | 'done'
  variant?: 'tool' | 'verify'
}

export function ToolChip({ label, detail, status, variant = 'tool' }: ToolChipProps) {
  const Icon = variant === 'verify' ? ShieldCheck : FileSearch

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 'var(--r-sm)',
        background: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        fontSize: 12,
        fontFamily: 'var(--font-body)',
      }}
    >
      <Icon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>{label}</span>
      <span style={{
        color: 'var(--text-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {detail}
      </span>
      {status === 'running' ? (
        <Loader2 size={13} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
      ) : (
        <CheckCircle2 size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
      )}
    </div>
  )
}
