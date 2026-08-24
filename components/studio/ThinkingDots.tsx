'use client'

export function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
        Thinking
      </span>
      <span className="animate-pulse" style={{ display: 'flex', gap: 2 }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 3, height: 3, borderRadius: '50%',
              background: 'var(--text-muted)',
              animation: `studio-blink 1.2s ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </span>
      <style>{`
        @keyframes studio-blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
