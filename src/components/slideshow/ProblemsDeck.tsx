import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { EASE_OUT_EXPO, EASE_SLIDE, REDUCED } from './deck-motion'
import { SLIDES, type SlideData } from './slides'
import './deck.css'

/* ---- slide component ---- */
const textVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: REDUCED ? 0 : 0.3 + i * 0.13, duration: 0.6, ease: EASE_OUT_EXPO },
  }),
}

function Slide({ data }: { data: SlideData }) {
  const Art = data.art
  return (
    <div className="slide">
      <div className={'slide-inner' + (data.center ? ' center' : '')}>
        <div>
          <motion.h1 className="display" custom={0} variants={textVariants} initial="hidden" animate="show">
            {data.title}
          </motion.h1>
          <motion.p className="body" custom={1} variants={textVariants} initial="hidden" animate="show">
            {data.body}
          </motion.p>
          {data.extra && (
            <motion.div custom={2} variants={textVariants} initial="hidden" animate="show">
              {data.extra}
            </motion.div>
          )}
        </div>
        <motion.div
          className="art"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: REDUCED ? 0 : 0.2, duration: 0.6, ease: 'easeOut' }}
        >
          <Art />
        </motion.div>
      </div>
    </div>
  )
}

const slideVariants: Variants = {
  enter: (d: number) => ({ x: REDUCED ? 0 : d > 0 ? '55%' : '-55%', opacity: 0, scale: 0.97 }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: EASE_SLIDE },
  },
  exit: (d: number) => ({
    x: REDUCED ? 0 : d > 0 ? '-55%' : '55%',
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.7, ease: EASE_SLIDE },
  }),
}

const NEXT_KEYS = ['ArrowRight', 'ArrowDown', ' ', 'PageDown']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp']

/** How long to swallow input after mounting, so momentum from the hero
 *  hand-off doesn't fling the viewer straight past the first slide. */
const ARM_DELAY = 700

type Props = {
  /** Stepping back off slide 1. */
  onBack: () => void
  /** Stepping forward off the last slide — hands the page its scroll back. */
  onForward: () => void
  /** While false the deck stops hijacking input and just sits there. */
  locked: boolean
}

/* ---- deck ---- */
function ProblemsDeck({ onBack, onForward, locked }: Props) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0])
  const [hovered, setHovered] = useState(false)
  const deckRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const total = SLIDES.length

  // Once unlocked the deck is just another block on the page, so it only takes
  // scroll and arrow keys back while the pointer is actually over it.
  const active = locked || hovered

  const go = useCallback(
    (next: number) => {
      setState(([i]) => {
        const clamped = Math.max(0, Math.min(total - 1, next))
        return [clamped, clamped > i ? 1 : -1]
      })
    },
    [total],
  )

  /* Stepping off either end hands control back to the page. */
  const armed = useRef(false)
  const step = useCallback(
    (delta: number) => {
      if (!armed.current) return
      const leaving = (delta < 0 && index === 0) || (delta > 0 && index === total - 1)
      if (leaving) {
        armed.current = false
        ;(delta < 0 ? onBack : onForward)()
        return
      }
      go(index + delta)
    },
    [index, total, go, onBack, onForward],
  )

  const atEdge = useCallback(
    (delta: number) => (delta < 0 && index === 0) || (delta > 0 && index === total - 1),
    [index, total],
  )

  /** Locked, the ends hand off to the page; hovering, they simply stop so the
   *  page can scroll past instead of trapping the pointer. */
  const nudge = useCallback(
    (delta: number) => (locked ? step(delta) : go(index + delta)),
    [locked, step, go, index],
  )

  // Re-arms on mount and every time the deck takes control back, so the
  // gesture that got us here can't carry straight through.
  useEffect(() => {
    if (!locked) return
    armed.current = false
    const t = setTimeout(() => (armed.current = true), ARM_DELAY)
    return () => clearTimeout(t)
  }, [locked])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const delta = NEXT_KEYS.includes(e.key) ? 1 : PREV_KEYS.includes(e.key) ? -1 : 0
      if (delta) {
        if (!locked && atEdge(delta)) return // let the key scroll the page on
        e.preventDefault()
        nudge(delta)
        return
      }
      if (e.key === 'Home') go(0)
      if (e.key === 'End') go(total - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, locked, atEdge, nudge, go, total])

  /* scroll → change slides */
  const wheelLock = useRef(false)
  const wheelAcc = useRef(0)
  const lastWheel = useRef(0)
  useEffect(() => {
    const el = deckRef.current
    if (!el || !active) return
    const onWheel = (e: WheelEvent) => {
      // Hovering past either end, give the wheel back so the page scrolls on.
      if (!locked && atEdge(e.deltaY > 0 ? 1 : -1)) return
      e.preventDefault() // nothing behind the deck scrolls

      const now = performance.now()
      if (wheelLock.current) {
        lastWheel.current = now // absorb trackpad momentum during transition
        return
      }
      if (now - lastWheel.current > 150) wheelAcc.current = 0 // new gesture
      lastWheel.current = now
      wheelAcc.current += e.deltaY
      if (Math.abs(wheelAcc.current) < 40) return
      const delta = wheelAcc.current > 0 ? 1 : -1
      wheelAcc.current = 0
      wheelLock.current = true
      nudge(delta)
      const release = () => {
        // wait until the momentum tail has gone quiet before re-arming
        if (performance.now() - lastWheel.current < 120) {
          setTimeout(release, 120)
        } else {
          wheelLock.current = false
          wheelAcc.current = 0
        }
      }
      setTimeout(release, 750)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [active, locked, atEdge, nudge])

  return (
    <div
      ref={deckRef}
      id="problems"
      className="deck"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onTouchStart={(e) => (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return
        const dx = e.changedTouches[0].clientX - touchStart.current.x
        const dy = e.changedTouches[0].clientY - touchStart.current.y
        const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx
        if (Math.abs(d) > 50) nudge(d < 0 ? 1 : -1)
        touchStart.current = null
      }}
    >
      <motion.div
        className="progress"
        initial={false}
        animate={{ width: ((index + 1) / total) * 100 + '%' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />

      {/* The deck's own wordmark is gone: nothing scrolls away any more, so it
          would sit directly under the site navbar's logo. */}
      <header className="topbar">
        <div className="counter">
          [<b>{String(index + 1).padStart(2, '0')}</b>/{String(total).padStart(2, '0')}]
        </div>
      </header>

      <main className="stage" aria-live="polite">
        <AnimatePresence custom={dir} initial={false}>
          <motion.div
            key={index}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ position: 'absolute', inset: 0 }}
          >
            <Slide data={SLIDES[index]} />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="controls">
        <div className="navbtns">
          <button className="navbtn" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide">
            ‹
          </button>
          <button
            className="navbtn"
            onClick={() => go(index + 1)}
            disabled={index === total - 1}
            aria-label="Next slide"
          >
            ›
          </button>
        </div>
        <div className="dots" role="tablist" aria-label="Slides">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={'dot' + (i === index ? ' active' : '')}
              onClick={() => go(i)}
              role="tab"
              aria-selected={i === index}
              aria-label={'Go to slide ' + (i + 1)}
            />
          ))}
        </div>
        <div className="hint">scroll · ← → · swipe</div>
      </footer>
    </div>
  )
}

export default ProblemsDeck
