'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsapSetup'
import { prefersReducedMotion } from './useReducedMotion'

/** Drives the whole marketing page's momentum scroll and keeps GSAP
 * ScrollTrigger in sync with it. Wrap the page content in this once, near
 * the root — everything below reads real window scroll position as usual,
 * Lenis just smooths how it gets there.
 *
 * Skips itself entirely under reduced-motion: native scroll, no Lenis
 * instance, ScrollTrigger still works off the browser's own scroll. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    // ScrollTrigger must recompute from Lenis's virtual scroll position, not
    // the (unmoving) native scrollTop, or every trigger would be stuck at 0.
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    // Lenis already runs inside a rAF loop driven by gsap.ticker above —
    // disabling GSAP's own internal lag smoothing avoids the two rAF-timed
    // systems fighting each other during a long paint/GC pause.
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
