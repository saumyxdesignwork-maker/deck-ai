'use client'

import { useEffect, useState } from 'react'

/** True when the OS asks for reduced motion. Starts `false` on the server and
 * first client render (so markup matches), then flips on mount if the user
 * opted out. Every marketing animation reads this and renders a static
 * fallback instead of running. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    // Deliberately starts at the `false` default above, even on the client's
    // first render — matching the server-rendered value avoids a hydration
    // mismatch, at the cost of one frame before this flips to the real value.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe initial read, see comment above
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/** Non-reactive one-shot read for use inside effects/animation setup where a
 * hook can't go. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
