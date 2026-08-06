import Sparkline from './Sparkline'
import {
  direction,
  formatDelta,
  formatValue,
  METRICS,
  NO_VALUE,
  type MetricSpec,
  type ZipRecord,
} from './types'

/**
 * Direction glyph. Deliberately monochrome: this is the one place a dashboard
 * usually reaches for red/green, but "up" has no fixed valence in a housing
 * market — rising prices favour a seller, rising days-on-market favours a
 * buyer. Coloring the arrow would assert a judgment the data doesn't make.
 */
function Delta({ value, spec, period }: { value: number | null; spec: MetricSpec; period: string }) {
  const text = formatDelta(value, spec.delta)
  if (text === null) {
    return (
      <span className="text-paper/30">
        {NO_VALUE} <span className="text-paper/25">{period}</span>
      </span>
    )
  }
  const dir = direction(value)
  const glyph = dir === 0 ? '=' : dir > 0 ? '▲' : '▼'
  return (
    <span className="text-paper/60">
      <span aria-hidden="true">{glyph}</span>
      <span className="sr-only">{dir === 0 ? 'unchanged' : dir > 0 ? 'up' : 'down'}</span>{' '}
      <span className="tabular-nums">{text}</span> <span className="text-paper/40">{period}</span>
    </span>
  )
}

function Tile({ spec, record }: { spec: MetricSpec; record: ZipRecord }) {
  const [value, mm, yy] = record.cur[spec.key]
  const series = spec.series ? record.series[spec.series] : null
  const hasSeries = series?.some((v) => v !== null && Number.isFinite(v)) ?? false

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-paper/10 p-5">
      <div>
        <h4 className="text-sm text-paper/60">{spec.label}</h4>
        {/* The unit rides on the value's line — on its own line it pushed this
            tile's deltas out of alignment with the rest of the row. */}
        <p className="mt-1 text-3xl font-bold text-paper">
          {formatValue(value, spec.format)}
          {spec.format === 'days' && value !== null && (
            <span className="ml-1.5 text-sm font-normal text-paper/40">days</span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <Delta value={mm} spec={spec} period="vs. last month" />
        <Delta value={yy} spec={spec} period="vs. last year" />
      </div>

      {spec.series && hasSeries && series && (
        <Sparkline
          months={record.series.months}
          values={series}
          format={spec.format}
          label={spec.label}
        />
      )}

      <p className="mt-auto text-xs leading-snug text-paper/35">{spec.note}</p>
    </div>
  )
}

function MetricTiles({ record }: { record: ZipRecord }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {METRICS.map((spec) => (
        <Tile key={spec.key} spec={spec} record={record} />
      ))}
    </div>
  )
}

export default MetricTiles
