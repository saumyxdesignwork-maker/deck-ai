'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../motion/gsapSetup'
import { prefersReducedMotion } from '../motion/useReducedMotion'

/** Paper.design's signature "portal" transition: a dark circle expands from
 * the center-bottom of the wrapped section as the user scrolls through it,
 * scrubbed (not timed) so scroll speed drives reveal speed directly. Wraps
 * the first bordered feature section after the hero/social-proof area. */
export function D2CircularReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return
      gsap.fromTo(
        ref.current,
        { clipPath: 'circle(0% at 50% 0%)' },
        {
          clipPath: 'circle(150% at 50% 0%)',
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 90%',
            end: 'top 20%',
            scrub: 0.4,
          },
        }
      )
      return () => {
        ScrollTrigger.getAll().forEach(t => t.trigger === ref.current && t.kill())
      }
    },
    { scope: ref }
  )

  return (
    <div ref={ref} className="d2-circle-reveal">
      {children}
    </div>
  )
}
