import type { Transition } from 'motion/react'

// One source of truth for Studio motion. Short, consistent, no bounce:
//   control feedback 100–160ms · compact overlays 180–240ms ·
//   content swaps ~180ms · chat → compact prompt morph 240–300ms.
// Mirrored as CSS custom properties in app/globals.css (--dk-*) for the
// plain-CSS transitions on buttons/pills.

export const DUR = {
  control: 0.14,
  menu: 0.16,
  content: 0.18,
  overlay: 0.2,
  morph: 0.27,
} as const

/** Standard "decelerate" curve — quick start, soft settle, never overshoots. */
export const EASE_OUT: [number, number, number, number] = [0.2, 0, 0, 1]
/** Exits accelerate away. */
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1]

/** Small positional travel for arrivals (px). Reduced motion drops it to 0. */
export const RISE = 4

/**
 * Transition presets. With `reduce` true every preset collapses to a very
 * short opacity-only change: state still reads instantly, nothing travels
 * or scales. Pair with <MotionConfig reducedMotion="user">, which already
 * strips transform/layout animation for Motion components.
 */
export function motionPresets(reduce: boolean | null) {
  const r = !!reduce
  const t = (duration: number, ease = EASE_OUT): Transition => (r ? { duration: 0 } : { duration, ease })
  const rise = r ? 0 : RISE
  return {
    reduce: r,
    rise,
    control: t(DUR.control),
    menu: t(DUR.menu),
    content: t(DUR.content),
    overlay: t(DUR.overlay),
    morph: t(DUR.morph),
    exit: t(DUR.menu, EASE_IN),
    /** Fade + small rise, for things arriving in place. */
    arrive: {
      initial: { opacity: 0, y: rise },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: r ? 0 : -2 },
    },
    /** Pure crossfade, for content swapping in the same box. */
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  }
}
