'use client'

import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const Direction1 = lazy(() => import('./Direction1').then(m => ({ default: m.Direction1 })))
const Direction2 = lazy(() => import('./Direction2').then(m => ({ default: m.Direction2 })))
const Direction3 = lazy(() => import('./Direction3').then(m => ({ default: m.Direction3 })))

const SWITCHER_STYLE: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  right: 20,
  zIndex: 999,
  background: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  padding: '8px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  fontSize: 13,
  color: '#eee',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

/** Floating stakeholder toggle between the landing-page directions.
 * Reads/writes `?dir=` so each direction is linkable (e.g. `/?dir=2`), but
 * never navigates — the swap happens in React state so scroll position and
 * Lenis/GSAP setup for the newly active direction start clean. Each
 * direction is lazy-loaded so only the active one's JS bundle is fetched. */
export function DirectionSwitcher() {
  const searchParams = useSearchParams()
  const [direction, setDirection] = useState<1 | 2 | 3>(() => {
    const dir = searchParams.get('dir')
    return dir === '3' ? 3 : dir === '2' ? 2 : 1
  })

  const pick = (d: 1 | 2 | 3) => {
    setDirection(d)
    const url = d === 1 ? window.location.pathname : `?dir=${d}`
    window.history.replaceState(null, '', url)
  }

  return (
    <>
      <div style={SWITCHER_STYLE} data-direction-switcher>
        <span style={{ opacity: 0.6 }}>Direction</span>
        <button
          type="button"
          onClick={() => pick(1)}
          style={{
            background: direction === 1 ? '#fff' : 'transparent',
            color: direction === 1 ? '#111' : '#eee',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          1
        </button>
        <button
          type="button"
          onClick={() => pick(2)}
          style={{
            background: direction === 2 ? '#d4a05a' : 'transparent',
            color: direction === 2 ? '#111' : '#eee',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          2
        </button>
        <button
          type="button"
          onClick={() => pick(3)}
          style={{
            background: direction === 3 ? '#c8785a' : 'transparent',
            color: direction === 3 ? '#111' : '#eee',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          3
        </button>
      </div>

      <Suspense fallback={null}>
        {direction === 1 ? <Direction1 /> : direction === 2 ? <Direction2 /> : <Direction3 />}
      </Suspense>
    </>
  )
}
