import { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from './gsapSetup'
import { prefersReducedMotion } from './useReducedMotion'

/**
 * Generic scroll-choreography pass for a section. Scans the given scope for
 * three declarative data-attributes and wires them up with GSAP, so section
 * components stay plain markup instead of each hand-rolling ScrollTrigger
 * calls:
 *
 *  - `data-reveal` [+ `data-reveal-delay="0.1"`]: fades/slides up into place
 *    once, as it enters the viewport (batched so staggered groups animate
 *    together rather than one-by-one).
 *  - `data-parallax="0.4"`: drifts vertically at the given speed (fraction of
 *    scroll distance) as the section scrolls through, scrubbed.
 *  - `data-clip-reveal`: wipes in via `clip-path` inset, scrubbed to scroll —
 *    the mask-reveal effect used for the "chaos → clean slide" turn and
 *    template/image reveals.
 *
 * Call once per section component: `useScrollReveals(sectionRef)`.
 * Under `prefers-reduced-motion`, everything is set to its resting state
 * immediately and no ScrollTriggers are created.
 */
export function useScrollReveals(scope: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const root = scope.current
    if (!root) return

    const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
    const parallaxEls = gsap.utils.toArray<HTMLElement>('[data-parallax]', root)
    const clipEls = gsap.utils.toArray<HTMLElement>('[data-clip-reveal]', root)

    const isD2 = !!root.closest('.d2-page')

    if (prefersReducedMotion()) {
      gsap.set(reveals, { opacity: 1, y: 0, filter: 'blur(0px)' })
      gsap.set(clipEls, { clipPath: 'inset(0% 0% 0% 0%)' })
      return
    }

    if (reveals.length) {
      gsap.set(reveals, {
        opacity: 0,
        y: isD2 ? 12 : 28,
        ...(isD2 ? { filter: 'blur(5px)' } : {}),
      })
      ScrollTrigger.batch(reveals, {
        start: 'top 85%',
        once: true,
        onEnter: batch => {
          const sorted = [...batch].sort((a, b) => {
            const da = parseFloat((a as HTMLElement).dataset.revealStagger || '0')
            const db = parseFloat((b as HTMLElement).dataset.revealStagger || '0')
            return da - db
          })
          gsap.to(sorted, {
            opacity: 1,
            y: 0,
            ...(isD2 ? { filter: 'blur(0px)' } : {}),
            duration: isD2 ? 0.9 : 0.8,
            ease: isD2 ? 'power2.out' : 'power3.out',
            stagger: isD2 ? 0.1 : 0.08,
            delay: 0,
            overwrite: true,
          })
        },
      })
    }

    parallaxEls.forEach(el => {
      const speed = parseFloat(el.dataset.parallax || '0.3')
      gsap.to(el, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    })

    clipEls.forEach(el => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'top 30%',
            scrub: 0.5,
          },
        }
      )
    })
  }, { scope })
}
