#!/usr/bin/env node
/**
 * build-market-data.mjs — generates the ZIP-level market data the lookup reads.
 *
 * Source is Realtor.com's public Data Library file, which is ~822 MB and grows
 * with every month of history. Two things keep that manageable:
 *
 *   1. We stream it. The file is never held in memory or written to disk.
 *   2. We stop early. Rows arrive newest-month-first, so once we read past the
 *      24-month window we abort the download — about a quarter of the bytes.
 *      Ordering is verified as we go; if it isn't descending we fall back to
 *      reading the whole file rather than silently truncating history.
 *
 * Output is ~900 shards keyed by 3-digit ZIP prefix, so the browser fetches
 * one ~25 KB file for the ZIP typed instead of anything resembling 822 MB.
 *
 * Runs as a prebuild step. Output is gitignored — it is regenerated, not stored.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { fileURLToPath } from 'node:url'

import { parse } from 'csv-parse'

const SOURCE_URL =
  'https://econdata.s3-us-west-2.amazonaws.com/Reports/Core/RDC_Inventory_Core_Metrics_Zip_History.csv'
const SOURCE_PAGE = 'https://www.realtor.com/research/data/'

const MONTHS = 24
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')

/** Minimum ZIPs we expect. Far below the real count (~26k) — this only catches
 *  a truncated or restructured source, not normal month-to-month variation. */
const MIN_EXPECTED_ZIPS = 5000

/**
 * Metrics we keep, mapped to the short keys used in the JSON. Each also has
 * `_mm` and `_yy` columns in the source; we carry those through rather than
 * recomputing deltas, so our numbers match Realtor.com's published figures
 * exactly and survive an agent checking them.
 */
const METRICS = {
  price: 'median_listing_price',
  dom: 'median_days_on_market',
  active: 'active_listing_count',
  new: 'new_listing_count',
  cuts: 'price_reduced_share',
  ppsf: 'median_listing_price_per_square_foot',
}

/** Metrics that get a 24-month sparkline. Kept short to hold shard size down. */
const SERIES_METRICS = ['price', 'dom']

// ---------------------------------------------------------------------------
// helpers

/** yyyymm arithmetic, e.g. shiftMonths(202601, -2) === 202511 */
function shiftMonths(yyyymm, delta) {
  const year = Math.floor(yyyymm / 100)
  const month = yyyymm % 100
  const total = year * 12 + (month - 1) + delta
  return Math.floor(total / 12) * 100 + (total % 12) + 1
}

function monthLabel(yyyymm) {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${names[(yyyymm % 100) - 1]} ${Math.floor(yyyymm / 100)}`
}

/** Blank cells are common in this file (small ZIPs, first month of a series).
 *  They must stay null all the way to the UI — never coerce to 0, which would
 *  read as "zero listings" rather than "no data". */
function num(value, decimals) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  const factor = 10 ** decimals
  return Math.round(parsed * factor) / factor
}

/** "cohasset, ma" -> "Cohasset, MA" */
function formatZipName(raw) {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase())
  const comma = trimmed.lastIndexOf(',')
  if (comma === -1) return titleCase(trimmed)
  return `${titleCase(trimmed.slice(0, comma).trim())}, ${trimmed.slice(comma + 1).trim().toUpperCase()}`
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`
}

// ---------------------------------------------------------------------------
// extract

async function fetchAndReduce() {
  const startedAt = Date.now()
  const controller = new AbortController()

  console.log(`  fetching ${SOURCE_URL}`)
  const response = await fetch(SOURCE_URL, { signal: controller.signal })
  if (!response.ok) {
    throw new Error(`source returned HTTP ${response.status} ${response.statusText}`)
  }
  if (!response.body) throw new Error('source returned an empty body')

  const totalBytes = Number(response.headers.get('content-length')) || 0
  let bytesRead = 0
  let rowsRead = 0

  const source = Readable.fromWeb(response.body)
  // Aborting mid-body tears down the stream; that error is expected, not a fault.
  source.on('error', () => {})

  // Count bytes with a pass-through rather than a 'data' listener: attaching
  // one would switch the source to flowing mode, which defeats backpressure and
  // lets the parser's buffer grow without bound on a file this size.
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      bytesRead += chunk.length
      callback(null, chunk)
    },
  })
  meter.on('error', () => {})

  const parser = source
    .pipe(meter)
    .pipe(parse({ columns: true, skip_empty_lines: true, relax_column_count: true }))

  /** postal_code -> { name, rows: Map<yyyymm, record> } */
  const zips = new Map()

  let latestMonth = null
  let cutoffMonth = null
  let previousMonth = null
  let descending = true
  let abortedEarly = false

  try {
    for await (const row of parser) {
      rowsRead += 1

      // Logged before any `continue` below, so a skipped row can't swallow the
      // milestone and make a working run look stalled.
      if (rowsRead % 250_000 === 0) {
        const pct = totalBytes ? ` (${((bytesRead / totalBytes) * 100).toFixed(1)}% of file)` : ''
        const elapsed = (Date.now() - startedAt) / 1000
        console.log(
          `  ${rowsRead.toLocaleString()} rows · ${formatBytes(bytesRead)}${pct} · ` +
            `${zips.size.toLocaleString()} ZIPs · ${elapsed.toFixed(0)}s ` +
            `(${(bytesRead / 1024 / elapsed).toFixed(0)} KB/s)`,
        )
      }

      const month = Number(row.month_date_yyyymm)
      if (!Number.isFinite(month)) continue

      if (latestMonth === null) {
        latestMonth = month
        cutoffMonth = shiftMonths(latestMonth, -(MONTHS - 1))
        console.log(`  latest month ${latestMonth}, keeping back to ${cutoffMonth}`)
      }

      // Verify the newest-first ordering the early abort depends on. If the
      // source ever changes, we read the whole file instead of losing history.
      if (previousMonth !== null && month > previousMonth && descending) {
        descending = false
        console.warn('  ! source is not ordered newest-first — reading the full file')
      }
      previousMonth = month

      if (month < cutoffMonth) {
        if (descending) {
          abortedEarly = true
          break
        }
        continue // unordered fallback: skip old rows, keep reading
      }

      const zip = String(row.postal_code ?? '').trim()
      if (!/^\d{5}$/.test(zip)) continue

      let entry = zips.get(zip)
      if (!entry) {
        entry = { name: formatZipName(row.zip_name), rows: new Map() }
        zips.set(zip, entry)
      } else if (!entry.name) {
        entry.name = formatZipName(row.zip_name)
      }

      const record = { flag: num(row.quality_flag, 0) }
      for (const [key, column] of Object.entries(METRICS)) {
        // Prices and counts read as whole numbers; shares and deltas are
        // fractions where 4 decimals is ~0.01 of a percentage point.
        const decimals = key === 'cuts' ? 4 : 2
        record[key] = num(row[column], decimals)
        record[`${key}_mm`] = num(row[`${column}_mm`], 4)
        record[`${key}_yy`] = num(row[`${column}_yy`], 4)
      }
      entry.rows.set(month, record)
    }
  } finally {
    controller.abort()
  }

  if (latestMonth === null) throw new Error('no parseable rows in source')

  console.log(
    `  read ${rowsRead.toLocaleString()} rows · ${formatBytes(bytesRead)}` +
      (abortedEarly && totalBytes
        ? ` · stopped at ${((bytesRead / totalBytes) * 100).toFixed(0)}% of the file`
        : ''),
  )

  return { zips, latestMonth, cutoffMonth, abortedEarly, bytesRead, rowsRead }
}

// ---------------------------------------------------------------------------
// transform

/** Shape one ZIP for the client: latest-month values with deltas, plus the
 *  sparkline series in ascending month order. */
function buildZipRecord(zip, entry, latestMonth, cutoffMonth) {
  const months = []
  for (let m = cutoffMonth; m <= latestMonth; m = shiftMonths(m, 1)) months.push(m)

  const current = entry.rows.get(latestMonth)
  // A ZIP with no row in the newest month has stopped reporting; fall back to
  // its most recent month so the UI can say when the data is from.
  const availableMonths = months.filter((m) => entry.rows.has(m))
  if (availableMonths.length === 0) return null
  const asOf = current ? latestMonth : availableMonths[availableMonths.length - 1]
  const latest = entry.rows.get(asOf)

  const cur = {}
  for (const key of Object.keys(METRICS)) {
    cur[key] = [latest[key], latest[`${key}_mm`], latest[`${key}_yy`]]
  }

  // Emit the full 24-month frame with nulls for months this ZIP didn't report.
  // Emitting only the months present would space them evenly and quietly
  // compress the time axis — a ZIP missing half a year would look continuous.
  const series = { months }
  for (const key of SERIES_METRICS) {
    series[key] = months.map((m) => entry.rows.get(m)?.[key] ?? null)
  }

  return {
    zip,
    name: entry.name,
    asOf,
    // 1 flags a small-sample month in the source. Surfaced so the UI can warn
    // rather than present a thin rural ZIP with false confidence.
    lowSample: latest.flag === 1 ? 1 : 0,
    cur,
    series,
  }
}

// ---------------------------------------------------------------------------
// load

async function writeShards(records) {
  const shards = new Map()
  for (const record of records) {
    const prefix = record.zip.slice(0, 3)
    let shard = shards.get(prefix)
    if (!shard) {
      shard = {}
      shards.set(prefix, shard)
    }
    shard[record.zip] = record
  }

  const zipDir = join(OUT_DIR, 'zip')
  await mkdir(zipDir, { recursive: true })

  let bytes = 0
  for (const [prefix, shard] of shards) {
    const json = JSON.stringify(shard)
    bytes += Buffer.byteLength(json)
    await writeFile(join(zipDir, `${prefix}.json`), json)
  }

  return { shardCount: shards.size, bytes }
}

// ---------------------------------------------------------------------------

async function main() {
  const startedAt = Date.now()
  console.log('building ZIP market data')

  const { zips, latestMonth, cutoffMonth, abortedEarly, rowsRead } = await fetchAndReduce()

  const records = []
  for (const [zip, entry] of zips) {
    const record = buildZipRecord(zip, entry, latestMonth, cutoffMonth)
    if (record) records.push(record)
  }

  if (records.length < MIN_EXPECTED_ZIPS) {
    throw new Error(
      `only ${records.length} ZIPs parsed, expected at least ${MIN_EXPECTED_ZIPS} — ` +
        'the source file has likely changed shape',
    )
  }

  // Rewrite cleanly so ZIPs dropped by the source don't linger as stale shards.
  await rm(OUT_DIR, { recursive: true, force: true })
  const { shardCount, bytes } = await writeShards(records)

  const meta = {
    dataMonth: latestMonth,
    dataMonthLabel: monthLabel(latestMonth),
    generatedAt: new Date().toISOString(),
    months: MONTHS,
    zipCount: records.length,
    shardCount,
    source: {
      name: 'Realtor.com Data Library',
      page: SOURCE_PAGE,
      file: SOURCE_URL,
    },
  }
  await writeFile(join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2))

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(0)
  console.log(
    `done in ${seconds}s — ${records.length.toLocaleString()} ZIPs across ${shardCount} shards ` +
      `(${formatBytes(bytes)}, avg ${(bytes / shardCount / 1024).toFixed(0)} KB/shard)`,
  )
  console.log(`  data month ${meta.dataMonthLabel} · ${rowsRead.toLocaleString()} rows read` +
    (abortedEarly ? ' · early abort' : ''))
}

// A silent failure here ships a lookup that returns nothing for every ZIP,
// which is worse than shipping no lookup at all. Fail the build instead.
main().catch((error) => {
  console.error(`\nmarket data build FAILED: ${error.message}`)
  console.error(error.stack)
  process.exit(1)
})
