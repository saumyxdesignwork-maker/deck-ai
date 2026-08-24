'use client'

import { useState } from 'react'

interface CoverBlockProps {
  title: string
  subtitle: string
  author: string
  coverColor: string
}

export function CoverBlock({ title, subtitle, author, coverColor }: CoverBlockProps) {
  const [editTitle, setEditTitle] = useState(title)
  const [editSubtitle, setEditSubtitle] = useState(subtitle)

  return (
    <div
      style={{
        background: coverColor,
        borderRadius: 'var(--r-xl)',
        padding: '64px 56px',
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Background pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%, rgba(0,0,0,0.2) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Cover type badge */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '3px 10px',
          borderRadius: 'var(--r-pill)',
          background: 'rgba(255,255,255,0.2)',
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Cover
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-heading)',
            fontSize: 32,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.2,
            marginBottom: 12,
            padding: 0,
          }}
          placeholder="Deck title"
        />
        <input
          value={editSubtitle}
          onChange={(e) => setEditSubtitle(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'rgba(255,255,255,0.8)',
            padding: 0,
            marginBottom: 24,
          }}
          placeholder="Subtitle…"
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {author.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}>
            {author}
          </span>
        </div>
      </div>
    </div>
  )
}
