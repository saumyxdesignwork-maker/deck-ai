'use client'

import { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useGlassCard } from '@/lib/useGlassCard'
import { useTheme } from '@/components/controls/ThemeProvider'

interface MethodCardProps {
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  disabled?: boolean
  onClick?: () => void
}

export function MethodCard({ icon: Icon, title, description, badge, disabled, onClick }: MethodCardProps) {
  const [hovered, setHovered] = useState(false)
  const glassClass = useGlassCard()
  const { vl } = useTheme()
  const isGlass = vl === '2'

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={glassClass}
      style={{
        width: 200,
        padding: '20px 18px',
        borderRadius: 'var(--r-lg)',
        // VL2: let glass classes handle border, bg, shadow
        border: isGlass ? 'none' : '1px solid',
        borderColor: isGlass ? undefined : (hovered && !disabled ? 'var(--accent)' : 'var(--border)'),
        background: isGlass ? undefined : 'var(--surface)',
        boxShadow: isGlass ? undefined : (hovered && !disabled ? 'var(--sh-2)' : 'var(--sh-1)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.55 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Badge */}
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            letterSpacing: '0.02em',
          }}
        >
          {badge}
        </span>
      )}

      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--r-sm)',
          background: disabled ? 'var(--border)' : hovered ? 'var(--accent-soft)' : 'var(--surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
        }}
      >
        <Icon size={20} style={{ color: disabled ? 'var(--text-disabled)' : hovered ? 'var(--accent)' : 'var(--text-muted)' }} />
      </div>

      {/* Text */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: disabled ? 'var(--text-disabled)' : 'var(--text)',
            marginBottom: 4,
            fontFamily: 'var(--font-body)',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {description}
        </div>
      </div>
    </button>
  )
}
