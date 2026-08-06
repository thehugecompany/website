import { useId, useMemo, useState } from 'react'

import { formatMonth, formatValue, type ValueFormat } from './types'

const WIDTH = 220
const HEIGHT = 48
const PAD_Y = 7 // room for the end dot plus its surface ring

type Props = {
  months: number[]
  values: (number | null)[]
  format: ValueFormat
  /** Names what's plotted, for screen readers and the hover readout. */
  label: string
}

type Point = { x: number; y: number; month: number; value: number; index: number }

/**
 * 24-month trend for one metric. Single series, so no legend — the tile's label
 * says what it is. The line runs in the de-emphasis gray with the most recent
 * segment and end dot in the accent, per the stat-tile contract.
 *
 * Missing months break the line rather than interpolating across the gap:
 * drawing straight through absent data would invent numbers, and this whole
 * component exists to be checked against the source.
 */
function Sparkline({ months, values, format, label }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const tooltipId = useId()

  const { points, segments } = useMemo(() => {
    const real: Point[] = []
    const valid = values.filter((v): v is number => v !== null && Number.isFinite(v))
    if (valid.length === 0) return { points: [] as Point[], segments: [] as Point[][] }

    let min = Math.min(...valid)
    let max = Math.max(...valid)
    // A flat series would divide by zero; center it instead.
    if (min === max) {
      min -= 1
      max += 1
    }

    const span = Math.max(months.length - 1, 1)
    values.forEach((value, index) => {
      if (value === null || !Number.isFinite(value)) return
      real.push({
        x: (index / span) * WIDTH,
        y: PAD_Y + (1 - (value - min) / (max - min)) * (HEIGHT - PAD_Y * 2),
        month: months[index],
        value,
        index,
      })
    })

    // Split into runs of consecutive months so gaps stay gaps.
    const runs: Point[][] = []
    let run: Point[] = []
    for (const point of real) {
      if (run.length > 0 && point.index !== run[run.length - 1].index + 1) {
        runs.push(run)
        run = []
      }
      run.push(point)
    }
    if (run.length > 0) runs.push(run)

    return { points: real, segments: runs }
  }, [months, values])

  if (points.length < 2) {
    return (
      <div className="h-12 items-end pt-2 text-xs text-paper/40" aria-hidden="true">
        not enough history to chart
      </div>
    )
  }

  const path = (run: Point[]) => run.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const last = points[points.length - 1]
  const lastRun = segments[segments.length - 1]
  // The accent carries "most recent" — the final hop of the newest run.
  const recent = lastRun.length >= 2 ? lastRun.slice(-2) : null
  const shown = active !== null ? points.find((p) => p.index === active) ?? last : null

  const move = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect()
    if (rect.width === 0) return
    const fraction = (clientX - rect.left) / rect.width
    const approx = Math.round(fraction * (months.length - 1))
    // Snap to the nearest month that actually has a value, so hovering a gap
    // still reads out a real number rather than nothing.
    let nearest = points[0]
    for (const point of points) {
      if (Math.abs(point.index - approx) < Math.abs(nearest.index - approx)) nearest = point
    }
    setActive(nearest.index)
  }

  const step = (delta: number) => {
    const currentIndex = points.findIndex((p) => p.index === (active ?? last.index))
    const next = points[Math.min(points.length - 1, Math.max(0, currentIndex + delta))]
    if (next) setActive(next.index)
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full touch-none focus:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        role="img"
        aria-label={`${label}, ${points.length} reported months to ${formatMonth(last.month)}. Latest ${formatValue(last.value, format)}.`}
        tabIndex={0}
        aria-describedby={shown ? tooltipId : undefined}
        onPointerMove={(event) => move(event.clientX, event.currentTarget)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(last.index)}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            step(-1)
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            step(1)
          }
        }}
      >
        {segments.map((run, i) => (
          <path
            key={i}
            d={path(run)}
            fill="none"
            stroke="#898781"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {recent && (
          <path d={path(recent)} fill="none" stroke="#f2a33c" strokeWidth={2} strokeLinecap="round" />
        )}
        {shown && (
          <g>
            <line x1={shown.x} y1={0} x2={shown.x} y2={HEIGHT} stroke="#898781" strokeWidth={1} />
            {/* 2px surface ring keeps the marker legible where it crosses the line */}
            <circle cx={shown.x} cy={shown.y} r={5} fill="#f2a33c" stroke="#1e1d1b" strokeWidth={2} />
          </g>
        )}
        {!shown && <circle cx={last.x} cy={last.y} r={4} fill="#f2a33c" stroke="#1e1d1b" strokeWidth={2} />}
      </svg>
      {shown && (
        <div
          id={tooltipId}
          role="status"
          className="pointer-events-none absolute -top-1 left-0 flex w-full justify-center"
        >
          <span className="rounded border border-paper/15 bg-ink px-2 py-0.5 text-xs whitespace-nowrap text-paper">
            <span className="font-bold">{formatValue(shown.value, format)}</span>
            <span className="text-paper/50"> · {formatMonth(shown.month)}</span>
          </span>
        </div>
      )}
    </div>
  )
}

export default Sparkline
