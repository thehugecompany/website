import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
// import { Link } from 'react-router'
import MarketLookup from '../components/market/MarketLookup'
import arrow from '../assets/images/arrow.svg'
import ProblemsDeck from '../components/slideshow/ProblemsDeck'
import ContactForm from '../components/ContactForm'

// arrow.svg ships with a black fill, and an <img> can't inherit currentColor,
// so each chevron is recolored with a filter. Both chains were solved against
// the source black: the first lands on #ffffff, the second on brand #f2a33c.
const WHITE = 'brightness(0) invert(1)'
const ORANGE =
  'brightness(0) saturate(100%) invert(81%) sepia(44%) saturate(2710%) hue-rotate(332deg) brightness(100%) contrast(90%)'

// The asset keeps its aspect ratio inside an <img>, so a wider box would just
// letterbox it — stretching horizontally takes a transform instead.
const CHEVRON_WIDTH = 1.9

// Scroll cue: three chevrons that cascade downward, middle one in brand orange.
const CHEVRONS = [
  { filter: WHITE, delay: 0 },
  { filter: ORANGE, delay: 0.18 },
  { filter: WHITE, delay: 0.36 },
]

// Floating "tool nodes" around the hero — examples of what we build to order.
// The last one is deliberately open-ended: the list isn't a menu.
const TOOLS = [
  { name: 'Deal Tracker', stat: 'your pipeline, your fields', pos: 'left-[7%] top-[24%]', delay: '0s' },
  { name: 'Commission Engine', stat: 'any split structure', pos: 'right-[8%] top-[21%]', delay: '1.4s' },
  { name: 'Client Portal', stat: 'under your brand', pos: 'left-[6%] bottom-[28%]', delay: '0.7s' },
  { name: 'Anything Else', stat: 'you name it, we build it', pos: 'right-[6%] bottom-[24%]', delay: '2.1s' },
]

/** Ignore window after a hand-off, so the gesture that got us here settles
 *  before the next layer starts listening. Matches the deck's own delay. */
const ARM_DELAY = 700

/** How far the deck pulls back once it gives the page its scroll. */
const DECK_SHRINK = 0.94

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]

/** One screen, minus whatever the navbar is currently occupying. */
const STAGE_H = 'calc(100svh - var(--nav-h, 6rem))'

/**
 * The page runs in three phases. `hero` and `deck` each own the whole viewport
 * as stacked layers with the document scroll locked. Stepping forward off the
 * last slide moves to `page`: the deck shrinks into a card, the hero rejoins the
 * document above it, and everything scrolls normally from then on — so you can
 * get back to the hero without stepping through the slides again.
 */
type Phase = 'hero' | 'deck' | 'page'

/** The hero's insides, shared by its locked layer and its in-flow section. */
function HeroContent({ onAdvance }: { onAdvance: () => void }) {
  return (
    <>
      {/* Traces running from the example builds back toward the centre */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M-20 185 C250 185 360 120 620 132" stroke="#fdfcfa" strokeOpacity="0.07" />
        <path d="M1220 165 C950 165 895 245 700 252" stroke="#f2a33c" strokeOpacity="0.14" />
        <path d="M-20 480 C260 480 330 545 545 550" stroke="#f2a33c" strokeOpacity="0.12" />
        <path d="M1220 505 C980 505 915 430 715 424" stroke="#fdfcfa" strokeOpacity="0.07" />
      </svg>

      {/* Vertical light streaks */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[46%] h-44 w-px bg-gradient-to-b from-transparent via-paper/25 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-[52%] h-56 w-px bg-gradient-to-b from-transparent via-paper/15 to-transparent"
      />

      {/* Floating tool nodes */}
      {TOOLS.map((tool) => (
        <div
          key={tool.name}
          className={`absolute hidden animate-float lg:block ${tool.pos}`}
          style={{ animationDelay: tool.delay }}
        >
          <p className="flex items-center gap-2 text-sm text-paper/80">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {tool.name}
          </p>
          <p className="pl-3.5 text-xs text-paper/40">{tool.stat}</p>
        </div>
      ))}

      {/* Center content */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 pt-16 pb-40 text-center">
        <button
          type="button"
          onClick={onAdvance}
          className="flex items-center gap-2 rounded-full border border-paper/15 bg-ink/40 px-4 py-1.5 text-xs text-paper/80 backdrop-blur transition-colors hover:border-brand/50 hover:text-paper md:text-sm"
        >
          <span className="text-brand">⌂</span> Custom software for real estate
          <span aria-hidden>→</span>
        </button>

        <h1 className="max-w-6xl bg-gradient-to-r from-paper via-paper to-paper/25 bg-clip-text font-logo leading-tight text-balance text-transparent md:text-6xl">
          The Tool You <span className="text-brand">Wish</span> Existed
        </h1>

        <p className="max-w-3xl text-base text-balance text-paper/60 md:text-lg">
          Off-the-shelf software makes you work its way. We build the opposite:
          tools shaped around how your business actually runs. One workflow or
          the whole platform, it&apos;s yours.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onAdvance}
            aria-label="See the problems we solve"
            className="flex flex-col items-center -space-y-1"
          >
            {CHEVRONS.map((chevron, i) => (
              <motion.img
                key={i}
                src={arrow}
                alt=""
                aria-hidden
                className="block h-4 w-4"
                style={{ filter: chevron.filter, scaleX: CHEVRON_WIDTH }}
                animate={{ opacity: [0.25, 1, 0.25], y: [0, 4, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: chevron.delay,
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </>
  )
}

function Home() {
  const [phase, setPhase] = useState<Phase>('hero')
  const heroRef = useRef<HTMLElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)
  const locked = phase !== 'page'

  const enterDeck = useCallback(() => setPhase('deck'), [])
  const scrollToDeck = useCallback(
    () => deckRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    [],
  )

  /* Only `page` lets the document scroll — ScrollRail and the navbar read the
     same class. Unlocking drops the hero back into the flow above the deck, so
     the scroll position has to be nudged to keep the deck where it already was
     on screen; without it the deck would appear to leap a full screen down. */
  useLayoutEffect(() => {
    const root = document.documentElement
    if (locked) {
      // Rewind before freezing: locking part-way down the page would strand the
      // viewer there with nothing to scroll.
      window.scrollTo(0, 0)
      root.classList.add('scroll-locked')
      return
    }
    root.classList.remove('scroll-locked')
    if (!deckRef.current) return
    const navH = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 0
    window.scrollTo(0, deckRef.current.getBoundingClientRect().top + window.scrollY - navH)
  }, [locked])

  useEffect(() => () => document.documentElement.classList.remove('scroll-locked'), [])

  /* The hero hands off to the deck on any downward intent. Input is ignored
     briefly after arriving so momentum from the deck can't bounce straight
     back in. */
  useEffect(() => {
    if (phase !== 'hero') return
    const el = heroRef.current
    if (!el) return

    let armed = false
    let acc = 0
    let last = 0
    const arm = setTimeout(() => (armed = true), ARM_DELAY)

    const onWheel = (e: WheelEvent) => {
      e.preventDefault() // the page itself never scrolls
      if (!armed) return
      const now = performance.now()
      if (now - last > 150) acc = 0 // new gesture
      last = now
      acc += e.deltaY
      if (acc < 40) return
      armed = false
      enterDeck()
    }

    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowRight', ' ', 'PageDown', 'End'].includes(e.key)) return
      e.preventDefault()
      if (!armed) return
      armed = false
      enterDeck()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(arm)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [phase, enterDeck])

  return (
    <>
      <div
        className={locked ? 'relative overflow-hidden' : undefined}
        style={locked ? { height: STAGE_H } : undefined}
      >
        {/* Once unlocked the hero is an ordinary section again, sitting above
            the deck so it's a plain scroll away. Rendered before the layers
            below so the document order stays hero → deck. */}
        {phase === 'page' && (
          <section
            data-rail="Home"
            className="relative flex flex-col overflow-hidden"
            style={{ height: STAGE_H }}
          >
            <HeroContent onAdvance={scrollToDeck} />
          </section>
        )}

        <AnimatePresence initial={false}>
          {phase === 'hero' && (
            <motion.section
              key="hero"
              ref={heroRef}
              className="absolute inset-0 flex flex-col overflow-hidden"
              initial={{ opacity: 0, y: '-8%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '-12%' }}
              transition={{ duration: 1, ease: EASE }}
              onTouchStart={(e) => (touchStart.current = e.touches[0].clientY)}
              onTouchEnd={(e) => {
                if (touchStart.current == null) return
                if (touchStart.current - e.changedTouches[0].clientY > 50) enterDeck()
                touchStart.current = null
              }}
            >
              <HeroContent onAdvance={enterDeck} />
            </motion.section>
          )}

          {phase !== 'hero' && (
            <motion.div
              key="deck"
              ref={deckRef}
              data-rail="The problem"
              className="overflow-hidden border border-transparent"
              // Absolute while it owns the viewport, in-flow once the page scrolls.
              style={locked ? { position: 'absolute', inset: 0 } : { position: 'relative', height: STAGE_H }}
              initial={{ opacity: 0, y: '6%' }}
              animate={{
                opacity: 1,
                y: 0,
                // Pulling back into a card is the cue that the page is free again.
                scale: locked ? 1 : DECK_SHRINK,
                borderRadius: locked ? 0 : 28,
                borderColor: locked ? 'rgba(253,252,250,0)' : 'rgba(253,252,250,0.12)',
              }}
              exit={{ opacity: 0, y: '6%' }}
              transition={{ duration: 1, ease: EASE }}
            >
              <ProblemsDeck
                locked={phase === 'deck'}
                onBack={() => setPhase('hero')}
                onForward={() => setPhase('page')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MarketLookup renders its own page-level <section id="market">, so the
          wrapper only exists to tag it for the scroll rail. */}
      <div data-rail="Market lookup">
        <MarketLookup />
      </div>

      <section id="contact" data-rail="Contact" className="scroll-mt-24 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-logo text-3xl md:text-5xl">
            Say <span className="text-brand">hello.</span>
          </h2>
          <p className="mt-4 mb-10 text-center text-paper/60">
            Tell us what you&apos;re building.
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  )
}

export default Home
