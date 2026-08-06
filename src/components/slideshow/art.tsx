import { motion } from 'motion/react'
import { BRAND, DIM, PAPER, REDUCED, draw, floaty } from './deck-motion'

/* ---- SVG art: abstract skyline ---- */
const ROOF_UP = 'M344 202 L380 160 L416 202'
const ROOF_WOB_L = 'M341 203 L377 161 L413 202'
const ROOF_WOB_R = 'M347 202 L383 161 L419 202'
const ROOF_MID = 'M372 150 L428 168 L420 224'
const ROOF_DOWN = 'M414 224 L458 252 L414 280'
const ROOF_BOUNCE = 'M418 218 L462 250 L414 280'

export function SkylineArt() {
  return (
    <motion.svg viewBox="0 0 480 320" fill="none" {...floaty(0.2)}>
      <motion.path {...draw(0.3)} d="M20 280 L20 170 L70 170 L70 280" stroke={DIM} strokeWidth="2" />
      <motion.path {...draw(0.5)} d="M90 280 L90 110 L150 110 L150 280" stroke={BRAND} strokeWidth="2.5" />
      <motion.path {...draw(0.7)} d="M170 280 L170 60 L250 60 L250 280" stroke={PAPER} strokeWidth="2" />
      <motion.path {...draw(0.9)} d="M270 280 L270 140 L330 140 L330 280" stroke={DIM} strokeWidth="2" />
      {/* little house — walls stand, roof topples onto the ground beside it */}
      <motion.path {...draw(1.1)} d="M352 280 L352 202 L408 202 L408 280" stroke={BRAND} strokeWidth="2.5" />
      <motion.rect
        x="372"
        y="242"
        width="16"
        height="38"
        stroke={BRAND}
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.4 }}
      />
      <motion.path
        stroke={BRAND}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0, d: ROOF_UP }}
        animate={{
          pathLength: 1,
          opacity: 1,
          ...(REDUCED
            ? { d: ROOF_UP }
            : {
                d: [
                  ROOF_UP,
                  ROOF_UP,
                  ROOF_WOB_L,
                  ROOF_WOB_R,
                  ROOF_WOB_L,
                  ROOF_MID,
                  ROOF_DOWN,
                  ROOF_BOUNCE,
                  ROOF_DOWN,
                ],
              }),
        }}
        transition={{
          pathLength: { delay: 1.3, duration: 1.4, ease: 'easeInOut' },
          opacity: { delay: 1.3, duration: 0.3 },
          d: {
            delay: 2.7,
            duration: 2.5,
            times: [0, 0.26, 0.36, 0.44, 0.52, 0.66, 0.78, 0.87, 1],
            ease: 'easeInOut',
          },
        }}
      />
      {/* impact puff where the roof lands */}
      {['M436 262 L446 256', 'M448 272 L460 270', 'M428 250 L434 240'].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={DIM}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={REDUCED ? { opacity: 0 } : { opacity: [0, 1, 0], x: [0, 5, 10] }}
          transition={{ delay: 4.6 + i * 0.05, duration: 0.55, ease: 'easeOut' }}
        />
      ))}
      {/* windows: brand dots */}
      {(
        [
          [110, 140],
          [130, 140],
          [110, 170],
          [130, 170],
          [195, 95],
          [225, 95],
          [195, 130],
          [225, 130],
          [195, 165],
          [225, 165],
          [295, 170],
          [310, 170],
        ] as const
      ).map(([x, y], i) => (
        <motion.rect
          key={i}
          x={x}
          y={y}
          width="10"
          height="12"
          fill={BRAND}
          opacity="0"
          initial={{ opacity: 0 }}
          animate={{ opacity: i % 3 === 0 ? 0.9 : 0.35 }}
          transition={{ delay: 1.5 + i * 0.07, duration: 0.4 }}
        />
      ))}
      <motion.line {...draw(0.2)} x1="10" y1="280" x2="470" y2="280" stroke={PAPER} strokeWidth="2" />
    </motion.svg>
  )
}

/* ---- SVG art: disconnected tool blocks ---- */
export function FragmentsArt() {
  const boxes = [
    [40, 40, 74],
    [200, 24, 60],
    [330, 60, 70],
    [80, 170, 62],
    [230, 150, 78],
    [350, 200, 58],
    [140, 250, 56],
  ] as const
  return (
    <motion.svg viewBox="0 0 440 340" fill="none" {...floaty(0.3)}>
      {/* broken dashed connectors */}
      <motion.path {...draw(0.9)} d="M114 78 C150 90, 165 70, 196 54" stroke={DIM} strokeWidth="2" strokeDasharray="6 8" />
      <motion.path {...draw(1.1)} d="M262 60 C290 70, 305 80, 328 88" stroke={DIM} strokeWidth="2" strokeDasharray="6 8" />
      <motion.path {...draw(1.3)} d="M120 200 C160 205, 190 195, 228 188" stroke={DIM} strokeWidth="2" strokeDasharray="6 8" />
      <motion.path {...draw(1.5)} d="M310 190 C325 200, 335 210, 348 222" stroke={DIM} strokeWidth="2" strokeDasharray="6 8" />
      {/* the one that snapped */}
      <motion.path {...draw(1.7)} d="M170 275 C190 270, 200 262, 212 252" stroke={BRAND} strokeWidth="2.5" strokeDasharray="6 8" />
      <motion.text
        x="222"
        y="248"
        fill={BRAND}
        fontSize="22"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.1, duration: 0.35 }}
      >
        ✕
      </motion.text>
      {boxes.map(([x, y, s], i) => (
        <motion.rect
          key={i}
          x={x}
          y={y}
          width={s}
          height={s * 0.72}
          rx="8"
          stroke={i === 4 ? BRAND : i % 2 ? PAPER : DIM}
          strokeWidth={i === 4 ? 2.5 : 2}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </motion.svg>
  )
}

/* ---- SVG art: house-clock ---- */
export function HouseClockArt() {
  return (
    <motion.svg viewBox="0 0 440 340" fill="none" {...floaty(0.25)}>
      {/* house outline */}
      <motion.path {...draw(0.3)} d="M110 170 L220 80 L330 170" stroke={BRAND} strokeWidth="2.5" />
      <motion.path {...draw(0.6)} d="M135 155 L135 290 L305 290 L305 155" stroke={PAPER} strokeWidth="2" />
      {/* clock face where the door would be */}
      <motion.circle
        cx="220"
        cy="210"
        r="52"
        stroke={PAPER}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 1.0, duration: 1.1, ease: 'easeInOut' }}
      />
      {[0, 90, 180, 270].map((a, i) => {
        const r1 = 44,
          r2 = 50,
          rad = (a * Math.PI) / 180
        return (
          <motion.line
            key={i}
            x1={220 + r1 * Math.sin(rad)}
            y1={210 - r1 * Math.cos(rad)}
            x2={220 + r2 * Math.sin(rad)}
            y2={210 - r2 * Math.cos(rad)}
            stroke={DIM}
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 + i * 0.08 }}
          />
        )
      })}
      {/* hands — minute hand sweeps.
          Pinning the pivot to the clock centre takes both halves: `view-box`
          measures the origin from the viewBox instead of the line's own bounding
          box, and originX/originY are the only route to the inline
          transform-origin motion writes for animated SVG children — a plain
          `transformOrigin` here is demoted to an attribute and loses to it. */}
      <motion.line
        x1="220"
        y1="210"
        x2="220"
        y2="178"
        stroke={BRAND}
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transformBox: 'view-box', originX: '220px', originY: '210px' }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={REDUCED ? { opacity: 1 } : { rotate: 360, opacity: 1 }}
        transition={{
          opacity: { delay: 1.8 },
          rotate: { delay: 1.8, duration: 9, repeat: Infinity, ease: 'linear' },
        }}
      />
      <motion.line
        x1="220"
        y1="210"
        x2="242"
        y2="216"
        stroke={PAPER}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      />
      {/* chimney */}
      <motion.path {...draw(0.9)} d="M280 118 L280 90 L300 90 L300 135" stroke={DIM} strokeWidth="2" />
    </motion.svg>
  )
}

/* ---- SVG art: key + keyhole house ---- */
export function LockedArt() {
  return (
    <motion.svg viewBox="0 0 440 340" fill="none" {...floaty(0.3)}>
      {/* house as a padlock body */}
      <motion.path {...draw(0.3)} d="M120 160 L220 85 L320 160 L320 290 L120 290 Z" stroke={PAPER} strokeWidth="2" />
      {/* shackle */}
      <motion.path {...draw(0.7)} d="M170 160 L170 120 C170 85, 270 85, 270 120 L270 160" stroke={BRAND} strokeWidth="2.5" />
      {/* keyhole */}
      <motion.circle
        cx="220"
        cy="205"
        r="20"
        stroke={BRAND}
        strokeWidth="2.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.9 }}
      />
      <motion.path {...draw(1.6)} d="M220 222 L210 258 L230 258 Z" stroke={BRAND} strokeWidth="2.5" />
      {/* the key floating outside, just out of reach */}
      <motion.g
        initial={{ opacity: 0, x: 30 }}
        animate={REDUCED ? { opacity: 1, x: 0 } : { opacity: 1, x: [0, -10, 0] }}
        transition={{
          opacity: { delay: 1.9 },
          x: { delay: 1.9, duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <circle cx="382" cy="200" r="16" stroke={DIM} strokeWidth="2" fill="none" />
        <line x1="370" y1="211" x2="344" y2="238" stroke={DIM} strokeWidth="2" />
        <line x1="352" y1="230" x2="360" y2="238" stroke={DIM} strokeWidth="2" />
        <line x1="346" y1="236" x2="352" y2="242" stroke={DIM} strokeWidth="2" />
      </motion.g>
    </motion.svg>
  )
}

/* ---- SVG art: growing compliance checklist ---- */
export function ChecklistArt() {
  const rows = [105, 141, 177, 213, 249]
  const check = (y: number, delay: number) => (
    <motion.path
      {...draw(delay)}
      d={`M164 ${y + 7} L169 ${y + 12} L178 ${y + 1}`}
      stroke={BRAND}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
  return (
    <motion.svg viewBox="0 0 440 340" fill="none" {...floaty(0.25)}>
      {/* clipboard */}
      <motion.rect {...draw(0.3)} x="130" y="58" width="180" height="236" rx="10" stroke={PAPER} strokeWidth="2" />
      <motion.path {...draw(0.6)} d="M200 58 L200 44 L240 44 L240 58" stroke={PAPER} strokeWidth="2" />
      <motion.circle
        cx="220"
        cy="51"
        r="3.5"
        stroke={DIM}
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      />
      {/* three original requirements, checked off */}
      {rows.slice(0, 3).map((y, i) => (
        <g key={i}>
          <motion.rect {...draw(0.8 + i * 0.15)} x="158" y={y} width="16" height="16" rx="3" stroke={DIM} strokeWidth="2" />
          <motion.line {...draw(0.95 + i * 0.15)} x1="188" y1={y + 8} x2="284" y2={y + 8} stroke={DIM} strokeWidth="2" />
          {check(y, 1.4 + i * 0.2)}
        </g>
      ))}
      {/* new rules keep arriving — slide in, orange, unchecked */}
      {rows.slice(3).map((y, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.2 + i * 0.45, duration: 0.5, ease: 'easeOut' }}
        >
          <rect x="158" y={y} width="16" height="16" rx="3" stroke={BRAND} strokeWidth="2.5" fill="none" />
          <line x1="188" y1={y + 8} x2={i === 0 ? 284 : 258} y2={y + 8} stroke={BRAND} strokeWidth="2" opacity="0.7" />
          <text x="296" y={y + 13} fill={BRAND} fontSize="15" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
            +
          </text>
        </motion.g>
      ))}
      {/* ...and more behind them */}
      <motion.text
        x="158"
        y="288"
        fill={DIM}
        fontSize="14"
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2, duration: 0.5 }}
      >
        ...
      </motion.text>
    </motion.svg>
  )
}
