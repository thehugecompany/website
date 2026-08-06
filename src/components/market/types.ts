/** Shapes emitted by scripts/build-market-data.mjs. */

/** [value, month-over-month delta, year-over-year delta] — any may be null. */
export type MetricTriple = [number | null, number | null, number | null]

export type MetricKey = 'price' | 'dom' | 'active' | 'new' | 'cuts' | 'ppsf'

export type ZipRecord = {
  zip: string
  name: string | null
  /** yyyymm the values describe. Usually the dataset's latest month, but a ZIP
   *  that stopped reporting falls back to its own most recent month. */
  asOf: number
  /** 1 when the source flags the month as a small sample. */
  lowSample: 0 | 1
  cur: Record<MetricKey, MetricTriple>
  series: {
    months: number[]
    price: (number | null)[]
    dom: (number | null)[]
  }
}

export type Shard = Record<string, ZipRecord>

export type Meta = {
  dataMonth: number
  dataMonthLabel: string
  generatedAt: string
  months: number
  zipCount: number
  shardCount: number
  source: { name: string; page: string; file: string }
}

export type ValueFormat = 'price' | 'days' | 'int' | 'pct'

/**
 * How each delta column in the source is expressed.
 *
 * `relative` — a fraction of the previous value (0.0253 = +2.53%). Used by
 *   prices, counts, and days on market.
 * `points`   — a percentage-POINT difference. The share metrics use this: a ZIP
 *   whose price-cut share fell to 0.0 carries mm = -0.1667, which can only be a
 *   point difference (a relative change to zero would be -1.0). Rendering it as
 *   a percentage would misstate the number.
 */
export type DeltaKind = 'relative' | 'points'

export type MetricSpec = {
  key: MetricKey
  label: string
  format: ValueFormat
  delta: DeltaKind
  /** Which sparkline series backs this tile, if any. */
  series?: 'price' | 'dom'
  /** Shown under the tile to explain what the number actually measures. */
  note: string
}

export const METRICS: MetricSpec[] = [
  {
    key: 'price',
    label: 'Median list price',
    format: 'price',
    delta: 'relative',
    series: 'price',
    note: 'Midpoint asking price of active listings',
  },
  {
    key: 'dom',
    label: 'Days on market',
    format: 'days',
    delta: 'relative',
    series: 'dom',
    note: 'Median days a listing sits before going pending',
  },
  {
    key: 'active',
    label: 'Active listings',
    format: 'int',
    delta: 'relative',
    note: 'Listings available at month end',
  },
  {
    key: 'new',
    label: 'New listings',
    format: 'int',
    delta: 'relative',
    note: 'Came on the market this month',
  },
  {
    key: 'cuts',
    label: 'Listings with a price cut',
    format: 'pct',
    delta: 'points',
    note: 'Share of active listings that dropped price',
  },
  {
    key: 'ppsf',
    label: 'Price per sq ft',
    format: 'price',
    delta: 'relative',
    note: 'Median asking price per square foot',
  },
]

// ---------------------------------------------------------------------------
// formatting

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatMonth(yyyymm: number): string {
  const month = MONTH_NAMES[(yyyymm % 100) - 1]
  return month ? `${month} ${Math.floor(yyyymm / 100)}` : String(yyyymm)
}

/** Null renders as an em dash everywhere — never 0, never NaN. Sparse rural
 *  ZIPs genuinely have missing months, and "no data" must not read as "zero". */
export const NO_VALUE = '—'

export function formatValue(value: number | null, format: ValueFormat): string {
  if (value === null || !Number.isFinite(value)) return NO_VALUE
  switch (format) {
    case 'price':
      return `$${Math.round(value).toLocaleString('en-US')}`
    case 'days':
      return `${Math.round(value)}`
    case 'int':
      return Math.round(value).toLocaleString('en-US')
    case 'pct':
      return `${(value * 100).toFixed(1)}%`
  }
}

export function formatDelta(value: number | null, kind: DeltaKind): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const magnitude = Math.abs(value) * 100
  return kind === 'points' ? `${magnitude.toFixed(1)} pts` : `${magnitude.toFixed(1)}%`
}

/** -1 | 0 | 1. Direction only — deliberately not valence. Whether "up" is good
 *  depends on which side of the deal the reader is on, so nothing here maps a
 *  direction to a good/bad color. */
export function direction(value: number | null): -1 | 0 | 1 {
  if (value === null || !Number.isFinite(value) || value === 0) return 0
  return value > 0 ? 1 : -1
}
