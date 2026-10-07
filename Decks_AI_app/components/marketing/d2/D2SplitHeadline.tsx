'use client'

import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '../motion/gsapSetup'
import { prefersReducedMotion } from '../motion/useReducedMotion'

interface D2SplitHeadlineProps {
  lines: string[]
  as?: 'h1' | 'h2' | 'h3'
  id?: string
  center?: boolean
}

export function D2SplitHeadline({ lines, as: Tag = 'h2', id, center }: D2SplitHeadlineProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const split = SplitText.create(el, { type: 'words' })
    gsap.set(split.words, { opacity: 0, y: 8, filter: 'blur(4px)' })

    gsap.to(split.words, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.04,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    })

    return () => split.revert()
  }, { scope: ref })

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} id={id} style={center ? { textAlign: 'center' } : undefined}>
      {lines.map((line, i) => (
        <span key={i} className={i === 0 ? 'd2-split-line1' : 'd2-split-line2'}>
          {line}{' '}
        </span>
      ))}
    </Tag>
  )
}
