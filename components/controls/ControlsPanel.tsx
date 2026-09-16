'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SwatchBook, Type, ChevronUp, ChevronDown, ImageIcon, Wand2 } from 'lucide-react'
import { useTheme } from './ThemeProvider'

// All images available in /public for VL2 background testing
const BG_IMAGES = [
  { file: 'Bg-image.webp', label: 'Meadow' },
  { file: 'Bgimg1.png',    label: 'Img 1'  },
  { file: 'bg-img3 .png',  label: 'Img 3'  },
  { file: 'bg-img4.png',   label: 'Img 4'  },
  { file: 'bg-img5.png',   label: 'Img 5'  },
  { file: 'download.png',  label: 'Alt'    },
]

export function ControlsPanel() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { vl, font, bgImg, flow, setVL, setFont, setBgImg, setFlow } = useTheme()
  const isVL2 = vl === '2'
  const isVL3 = vl === '3'
  const isGlassPanel = isVL2 || isVL3

  const handleFlowChange = (f: 'classic' | 'studio') => {
    setFlow(f)
    router.push(f === 'studio' ? '/create/studio' : '/create')
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      {/* Toggle pill */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 'var(--r-pill)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: 'var(--sh-2)',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text)',
          transition: 'box-shadow 0.15s',
          fontFamily: 'var(--font-body)',
          backdropFilter: isGlassPanel ? 'var(--backdrop-blur)' : undefined,
          WebkitBackdropFilter: isGlassPanel ? 'var(--backdrop-blur)' : undefined,
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--sh-3)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--sh-2)')}
      >
        <SwatchBook size={14} style={{ color: 'var(--accent)' }} />
        <span>Style</span>
        {open ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {/* Expanded panel */}
      {open && (
        <div
          className="animate-slide-up"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--sh-3)',
            padding: '12px 14px',
            minWidth: 220,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            backdropFilter: isGlassPanel ? 'var(--backdrop-blur)' : undefined,
            WebkitBackdropFilter: isGlassPanel ? 'var(--backdrop-blur)' : undefined,
          }}
        >
          {/* Visual Language row */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <SwatchBook size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Visual Language
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['1','Craft'],['2','Night'],['3','Warm']] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setVL(v)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--r-pill)',
                    border: '1px solid',
                    borderColor: vl === v ? 'var(--accent)' : 'var(--border)',
                    background: vl === v ? 'var(--accent-soft)' : 'var(--surface-muted)',
                    color: vl === v ? 'var(--accent)' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--divider)' }} />

          {/* Create Flow row */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Wand2 size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Create Flow
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['classic','Classic'],['studio','Studio']] as const).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => handleFlowChange(f)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--r-pill)',
                    border: '1px solid',
                    borderColor: flow === f ? 'var(--accent)' : 'var(--border)',
                    background: flow === f ? 'var(--accent-soft)' : 'var(--surface-muted)',
                    color: flow === f ? 'var(--accent)' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--divider)' }} />

          {/* Font preset row */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Type size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Font
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                ['a', 'Hedvig',     'var(--font-hedvig-sans), ui-sans-serif'],
                ['b', 'Geist',      'var(--font-geist), ui-sans-serif'],
                ['c', 'Instrument', 'var(--font-instrument-serif), ui-serif'],
                ['d', 'Tiffin',     "'tiffin-latin-variable', ui-serif"],
              ] as const).map(([f, label, fontFamily]) => (
                <button
                  key={f}
                  onClick={() => setFont(f)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--r-pill)',
                    border: '1px solid',
                    borderColor: font === f ? 'var(--accent)' : 'var(--border)',
                    background: font === f ? 'var(--accent-soft)' : 'var(--surface-muted)',
                    color: font === f ? 'var(--accent)' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Background image row — only in VL2 */}
          {isVL2 && (
            <>
              <div style={{ height: 1, background: 'var(--divider)' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <ImageIcon size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Background
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {BG_IMAGES.map(({ file, label }) => {
                    const isActive = bgImg === file
                    return (
                      <button
                        key={file}
                        onClick={() => setBgImg(file)}
                        title={file}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px',
                          borderRadius: 'var(--r-sm)',
                          border: '2px solid',
                          borderColor: isActive ? 'var(--accent)' : 'transparent',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: 52,
                            height: 36,
                            borderRadius: 5,
                            backgroundImage: `url('/${file}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            boxShadow: isActive ? '0 0 0 0px transparent' : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                          }}
                        />
                        {/* Label */}
                        <span style={{
                          fontSize: 9,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                          letterSpacing: '0.02em',
                          fontFamily: 'var(--font-body)',
                          lineHeight: 1,
                        }}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
