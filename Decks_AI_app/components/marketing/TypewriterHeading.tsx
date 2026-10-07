'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from './motion/gsapSetup'
import { prefersReducedMotion } from './motion/useReducedMotion'

interface TypewriterHeadingProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'children'> {
  children: string
  as?: 'h1' | 'h2' | 'h3'
}

/** Henry's signature move: a heading reveals character-by-character as it
 * scrolls into view, each character sweeping from coral to the resting text
 * color — simulating a typing cursor passing over it. Plain static text
 * under `prefers-reduced-motion`, and the DOM always contains the real text
 * (SplitText only wraps characters, it doesn't replace content), so this
 * never regresses accessibility or SEO. */
export function TypewriterHeading({ children, as: Tag = 'h2', ...rest }: TypewriterHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return
      // Split by words AND chars — splitting by chars alone turns each
      // character (including the inter-word gaps) into its own
      // display:inline-block span, which breaks the browser's normal
      // word-boundary line-wrapping and can wrap mid-word.
      const split = new SplitText(ref.current, { type: 'words, chars', charsClass: 'm-type-char' })
      gsap.set(split.chars, { opacity: 0.18, color: 'var(--accent)' })
      gsap.to(split.chars, {
        opacity: 1,
        color: 'var(--text)',
        duration: 0.01,
        stagger: 0.018,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      })
      return () => {
        ScrollTrigger.getAll().forEach(t => t.trigger === ref.current && t.kill())
        split.revert()
      }
    },
    { scope: ref }
  )

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  )
}
