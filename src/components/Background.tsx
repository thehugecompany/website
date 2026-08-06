import { motion, useReducedMotion, useTime, useTransform, type MotionValue } from 'motion/react'

// Fixed full-viewport backdrop: dark base with orange gradient blobs that swirl
// on their own, forever. Rendered once in App so every page sits on the same
// canvas.

type BlobDef = {
  /** Resting position and size */
  style: React.CSSProperties
  /** Alpha of the orange glow */
  opacity: number
  /** Where on its orbit the blob starts, in radians */
  phase: number
  /** Seconds for one full revolution; negative reverses the spin */
  period: number
  /** Orbit radius in px: the midpoint, and how far it breathes either side */
  radius: number
  swell: number
  /** Seconds for one breath. Deliberately not a factor of `period`, so the
   *  path never retraces itself and the drift stays organic. */
  swellPeriod: number
}

/* The top two overlap deliberately: the smaller one sits inside the larger as a
   brighter core rather than beside it as a second lobe. Their periods are close
   so they stay nested while they swirl. */
const BLOBS: BlobDef[] = [
  {
    style: { left: '28%', top: '-20%', width: '72vw', height: '72vh' },
    opacity: 0.26,
    phase: 0,
    period: 54,
    radius: 80,
    swell: 34,
    swellPeriod: 23,
  },
  {
    style: { left: '44%', top: '0%', width: '48vw', height: '52vh' },
    opacity: 0.17,
    phase: 0.7,
    period: 47,
    radius: 105,
    swell: 45,
    swellPeriod: 31,
  },
  {
    style: { left: '-2%', top: '56%', width: '58vw', height: '58vh' },
    opacity: 0.11,
    phase: 3.3,
    period: -68,
    radius: 95,
    swell: 40,
    swellPeriod: 19,
  },
]

const TAU = Math.PI * 2

/**
 * Position on a breathing orbit at time `ms`. The angle turns steadily while
 * the radius swells on its own cycle, so the blob spirals outward and back in
 * rather than tracing the same circle over and over.
 */
const swirl = (ms: number, b: BlobDef): [number, number] => {
  const seconds = ms / 1000
  const angle = b.phase + (seconds / b.period) * TAU
  const r = b.radius + b.swell * Math.sin(b.phase + (seconds / b.swellPeriod) * TAU)
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

function Blob({ blob, time }: { blob: BlobDef; time: MotionValue<number> }) {
  const x = useTransform(time, (ms) => swirl(ms, blob)[0])
  const y = useTransform(time, (ms) => swirl(ms, blob)[1])
  return (
    <motion.div
      className="absolute"
      style={{
        ...blob.style,
        x,
        y,
        // Falling off across the blob's full extent, rather than stopping short
        // at 70%, keeps neighbours melting into each other instead of reading
        // as separate shapes with a dark seam between them.
        background: `radial-gradient(closest-side, rgba(242,163,60,${blob.opacity}), rgba(242,163,60,0))`,
      }}
    />
  )
}

function Background() {
  const reduce = useReducedMotion()
  const time = useTime()
  const beamRotate = useTransform(time, (ms) =>
    reduce ? 20 : 20 + 12 * Math.sin((ms / 1000 / 41) * TAU),
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0d0c0a]">
      {BLOBS.map((blob, i) => (
        <Blob
          key={i}
          blob={reduce ? { ...blob, radius: 0, swell: 0 } : blob}
          time={time}
        />
      ))}
      {/* Soft diagonal beam, swinging with the swirl */}
      <motion.div
        className="absolute -top-1/4 left-1/2 h-[80%] w-1/3 bg-gradient-to-b from-brand/25 to-transparent blur-3xl"
        style={{ rotate: beamRotate, originY: 0 }}
      />
    </div>
  )
}

export default Background
