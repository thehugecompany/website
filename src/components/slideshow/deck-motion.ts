import type { MotionProps } from 'motion/react'

// Shared motion helpers and palette for the problems deck.

export const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const BRAND = '#f2a33c'
export const PAPER = '#fdfcfa'
export const DIM = 'rgba(253,252,250,0.4)'

// Cubic-bezier eases need to be 4-tuples, not number[], to satisfy motion's types.
export const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const EASE_SLIDE: [number, number, number, number] = [0.32, 0.72, 0, 1]

/** Strokes a path on as if it were being drawn by hand. */
export const draw = (delay = 0): MotionProps => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    pathLength: { delay, duration: 1.4, ease: 'easeInOut' },
    opacity: { delay, duration: 0.3 },
  },
})

/** Slow vertical bob for whole illustrations. */
export const floaty = (delay = 0): MotionProps =>
  REDUCED
    ? {}
    : {
        animate: { y: [0, -8, 0] },
        transition: { delay, duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
      }
