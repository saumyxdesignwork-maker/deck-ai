'use client'

import { ListOrdered, AlignJustify, Wand2, Languages, Image } from 'lucide-react'
import { Preferences } from '@/lib/createContext'

interface PreferencesBarProps {
  prefs: Preferences
  onChange: (p: Preferences) => void
}

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--surface-muted)',
        borderRadius: 'var(--r-sm)',
        padding: 2,
        gap: 1,
        border: '1px solid var(--border)',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '3px 9px',
            borderRadius: 6,
            border: 'none',
            background: value === opt.value ? 'var(--surface)' : 'transparent',
            boxShadow: value === opt.value ? 'var(--sh-1)' : 'none',
            color: value === opt.value ? 'var(--text)' : 'var(--text-muted)',
            fontSize: 11,
            fontWeight: value === opt.value ? 500 : 400,
            cursor: 'pointer',
            transition: 'all 0.12s',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function PrefLabel({ icon: Icon, label }: { icon: typeof ListOrdered; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon size={13} style={{ color: 'var(--text-muted)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

export function PreferencesBar({ prefs, onChange }: PreferencesBarProps) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--divider)',
        background: 'var(--surface)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}
    >
      {/* Section count stepper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <PrefLabel icon={ListOrdered} label="Sections" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => onChange({ ...prefs, sections: Math.max(3, prefs.sections - 1) })}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            −
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', minWidth: 18, textAlign: 'center' }}>
            {prefs.sections}
          </span>
          <button
            onClick={() => onChange({ ...prefs, sections: Math.min(25, prefs.sections + 1) })}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ width: 1, height: 32, background: 'var(--divider)' }} />

      {/* Density */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <PrefLabel icon={AlignJustify} label="Density" />
        <SegmentControl
          options={[
            { label: 'Minimal', value: 'minimal' as const },
            { label: 'Balanced', value: 'balanced' as const },
            { label: 'Rich', value: 'rich' as const },
            { label: 'Dense', value: 'dense' as const },
          ]}
          value={prefs.density}
          onChange={(v) => onChange({ ...prefs, density: v })}
        />
      </div>

      <div style={{ width: 1, height: 32, background: 'var(--divider)' }} />

      {/* Rewrite intensity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <PrefLabel icon={Wand2} label="Rewrite" />
        <SegmentControl
          options={[
            { label: 'Subtle', value: 'subtle' as const },
            { label: 'Standard', value: 'standard' as const },
            { label: 'Creative', value: 'creative' as const },
          ]}
          value={prefs.rewrite}
          onChange={(v) => onChange({ ...prefs, rewrite: v })}
        />
      </div>

      <div style={{ width: 1, height: 32, background: 'var(--divider)' }} />

      {/* Language */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <PrefLabel icon={Languages} label="Language" />
        <select
          value={prefs.language}
          onChange={(e) => onChange({ ...prefs, language: e.target.value })}
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 12,
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          {['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'].map(l => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>

      <div style={{ width: 1, height: 32, background: 'var(--divider)' }} />

      {/* Image style */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <PrefLabel icon={Image} label="Image Style" />
        <select
          value={prefs.imageStyle}
          onChange={(e) => onChange({ ...prefs, imageStyle: e.target.value as Preferences['imageStyle'] })}
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 12,
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <option value="photo">Photo</option>
          <option value="illustration">Illustration</option>
          <option value="none">No Images</option>
        </select>
      </div>
    </div>
  )
}
