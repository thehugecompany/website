import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/**
 * Stands in for the native scrollbar (hidden in index.css): a beaded rail on
 * the right, one bead per page section. Pages opt in by tagging their sections
 * `data-rail="<label>"`; without any, it falls back to a plain progress rail.
 *
 * It stays hidden until the page can actually scroll. `overflow: hidden` alone
 * can't tell us that — a locked document still reports its full scrollHeight —
 * so the `scroll-locked` class Home sets is the real signal.
 */

const RAIL_H = 240
const THUMB = 14
/** Bead hit area. Much larger than the 8px dot it draws, so a click near a
 *  bead still counts as that bead rather than a scrub. */
const HIT = 22
const FALLBACK_BEADS = 4
/** Pointer travel before a press stops being a click and becomes a drag. */
const DRAG_SLOP = 4

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Distance from the top of the rail to bead `i`'s centre. */
const beadCentre = (i: number, count: number) =>
  THUMB / 2 + (count > 1 ? i / (count - 1) : 0) * (RAIL_H - THUMB)

function ScrollRail() {
  const [visible, setVisible] = useState(false)
  const [labels, setLabels] = useState<string[]>([])
  /** Scroll position expressed as a continuous bead index. */
  const [pos, setPos] = useState(0)

  const tops = useRef<number[]>([])
  const maxScroll = useRef(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const press = useRef<{ y: number; dragging: boolean } | null>(null)

  const count = labels.length > 1 ? labels.length : FALLBACK_BEADS

  const readPos = useCallback(() => {
    const y = window.scrollY
    const t = tops.current
    if (t.length > 1) {
      if (y <= t[0]) return setPos(0)
      for (let i = 0; i < t.length - 1; i++) {
        if (y < t[i + 1]) return setPos(i + (y - t[i]) / (t[i + 1] - t[i] || 1))
      }
      return setPos(t.length - 1)
    }
    setPos(maxScroll.current > 0 ? (y / maxScroll.current) * (FALLBACK_BEADS - 1) : 0)
  }, [])

  useEffect(() => {
    /* Measuring hits layout, so it only runs when the page itself changes —
       plain scrolling just re-reads the cached offsets. */
    const measure = () => {
      const root = document.documentElement
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-rail]'))
      // The first bead means the very top of the page, navbar included.
      tops.current = els.map((el, i) =>
        i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY,
      )
      setLabels(els.map((el) => el.dataset.rail ?? ''))
      maxScroll.current = root.scrollHeight - window.innerHeight
      setVisible(!root.classList.contains('scroll-locked') && maxScroll.current > 8)
      readPos()
    }
    measure()

    window.addEventListener('scroll', readPos, { passive: true })
    window.addEventListener('resize', measure)
    // The lock toggles via a class on <html>, and sections come and go as the
    // page changes phase or route — both need a fresh measurement.
    const classes = new MutationObserver(measure)
    classes.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const size = new ResizeObserver(measure)
    size.observe(document.body)

    return () => {
      window.removeEventListener('scroll', readPos)
      window.removeEventListener('resize', measure)
      classes.disconnect()
      size.disconnect()
    }
  }, [readPos])

  /** Where a given bead index sits in the document. */
  const offsetFor = useCallback((p: number) => {
    const t = tops.current
    if (t.length < 2) return (p / (FALLBACK_BEADS - 1)) * maxScroll.current
    const i = clamp(Math.floor(p), 0, t.length - 2)
    return t[i] + (t[i + 1] - t[i]) * (p - i)
  }, [])

  /** Pointer position → continuous bead index, matching the thumb's geometry. */
  const indexAt = useCallback(
    (clientY: number) => {
      const el = trackRef.current
      if (!el) return 0
      const rect = el.getBoundingClientRect()
      const f = clamp((clientY - rect.top - THUMB / 2) / (RAIL_H - THUMB), 0, 1)
      return f * (count - 1)
    },
    [count],
  )

  const goTo = useCallback(
    (i: number) => window.scrollTo({ top: offsetFor(i), behavior: 'smooth' }),
    [offsetFor],
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="rail"
          aria-label="Page sections"
          className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 md:block"
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 14 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div
            ref={trackRef}
            className="relative w-6 cursor-pointer touch-none"
            style={{ height: RAIL_H }}
            /* A press is a click until the pointer actually moves: tapping
               anywhere on the rail eases to the nearest bead, while dragging
               scrubs live. Scrubbing on pointer-down instead would make every
               near-miss of a bead jump without a transition. */
            onPointerDown={(e) => {
              press.current = { y: e.clientY, dragging: false }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              const p = press.current
              if (!p) return
              if (!p.dragging && Math.abs(e.clientY - p.y) < DRAG_SLOP) return
              p.dragging = true
              window.scrollTo(0, offsetFor(indexAt(e.clientY)))
            }}
            onPointerUp={(e) => {
              const p = press.current
              press.current = null
              e.currentTarget.releasePointerCapture(e.pointerId)
              if (p && !p.dragging) goTo(Math.round(indexAt(e.clientY)))
            }}
            onPointerCancel={() => (press.current = null)}
          >
            {/* the thread the beads sit on */}
            <span
              aria-hidden
              className="absolute left-1/2 w-px -translate-x-1/2 bg-paper/15"
              style={{ top: THUMB / 2, bottom: THUMB / 2 }}
            />

            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                title={labels[i] || undefined}
                aria-label={labels[i] ? `Go to ${labels[i]}` : `Go to section ${i + 1}`}
                onClick={() => goTo(i)}
                className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center"
                style={{ top: beadCentre(i, count) - HIT / 2, height: HIT, width: HIT }}
              >
                <span
                  className={`h-2 w-2 rounded-full border bg-ink transition-colors ${
                    i <= pos + 0.001 ? 'border-paper/60' : 'border-paper/25'
                  }`}
                />
              </button>
            ))}

            {/* the lit dot that follows the scroll */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute left-1/2 rounded-full bg-brand"
              style={{
                height: THUMB,
                width: THUMB,
                marginLeft: -THUMB / 2,
                boxShadow: '0 0 14px rgba(242,163,60,0.55)',
              }}
              animate={{ top: (pos / (count - 1)) * (RAIL_H - THUMB) }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            />
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

export default ScrollRail
