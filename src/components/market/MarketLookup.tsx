import { useEffect, useRef, useState } from 'react'

import MetricTiles from './MetricTiles'
import SourceNote from './SourceNote'
import { formatMonth, type Meta, type Shard, type ZipRecord } from './types'

const DATA_BASE = `${import.meta.env.BASE_URL}data/`

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; record: ZipRecord }
  | { status: 'missing'; zip: string }
  | { status: 'error' }

function MarketLookup() {
  const [input, setInput] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const [meta, setMeta] = useState<Meta | null>(null)
  /** Shards are ~25 KB and a visitor checks a handful of ZIPs at most, so
   *  keeping fetched ones makes repeat lookups instant. */
  const shards = useRef(new Map<string, Shard>())

  useEffect(() => {
    let active = true
    fetch(`${DATA_BASE}meta.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((value: Meta | null) => {
        if (active) setMeta(value)
      })
      .catch(() => {
        // Provenance is supplementary; the lookup still works without it.
      })
    return () => {
      active = false
    }
  }, [])

  const lookup = async (raw: string) => {
    const zip = raw.trim()
    if (!/^\d{5}$/.test(zip)) return

    setState({ status: 'loading' })
    const prefix = zip.slice(0, 3)

    try {
      let shard = shards.current.get(prefix)
      if (!shard) {
        const response = await fetch(`${DATA_BASE}zip/${prefix}.json`)

        // A missing shard means no ZIP in this range reports data. Detect it by
        // content-type, not status: only 889 of the 1000 possible prefixes
        // exist, and a static host with SPA fallback answers the other 111 with
        // 200 + index.html rather than a 404.
        const isJson = response.headers.get('content-type')?.includes('json') ?? false
        if (response.status === 404 || (response.ok && !isJson)) {
          setState({ status: 'missing', zip })
          return
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        shard = (await response.json()) as Shard
        shards.current.set(prefix, shard)
      }

      const record = shard[zip]
      setState(record ? { status: 'found', record } : { status: 'missing', zip })
    } catch {
      // A failed fetch is not the same as an unknown ZIP, and saying so keeps
      // us from telling an agent their real market doesn't exist.
      setState({ status: 'error' })
    }
  }

  const valid = /^\d{5}$/.test(input.trim())

  return (
    <section id="market" className="w-full px-6 py-20 md:px-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <h2 className="font-logo text-3xl md:text-5xl">
          What&apos;s happening in <span className="text-brand">your</span> market?
        </h2>
        <p className="mt-4 max-w-2xl text-paper/60">
          Enter any US ZIP code. These are live figures from the Realtor.com Data Library
          {meta ? ` through ${meta.dataMonthLabel}` : ''} — the same numbers you can pull yourself,
          which is the point. We built this to show you what we do.
        </p>

        <form
          className="mt-8 flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void lookup(input)
          }}
        >
          <label htmlFor="zip" className="sr-only">
            ZIP code
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="43004"
            maxLength={5}
            value={input}
            onChange={(event) => setInput(event.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-40 rounded-xl border border-paper/20 bg-transparent px-5 py-3 text-lg tabular-nums text-paper placeholder:text-paper/25 focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={!valid || state.status === 'loading'}
            className="rounded-xl bg-paper px-7 py-3 text-lg font-bold text-brand transition-colors hover:bg-brand hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-paper disabled:hover:text-brand"
          >
            {state.status === 'loading' ? 'Looking…' : 'Look up'}
          </button>
        </form>

        <div className="mt-10" aria-live="polite">
          {state.status === 'idle' && (
            <p className="text-paper/40">
              Enter a ZIP code to see the latest numbers.
            </p>
          )}

          {state.status === 'loading' && <p className="text-paper/40">Loading market data…</p>}

          {state.status === 'missing' && (
            <p className="text-paper/60">
              No listing data published for{' '}
              <span className="tabular-nums text-paper">{state.zip}</span>. The source only covers
              ZIPs with enough market activity to report, so many rural and PO-box ZIPs are absent.
              Try a neighbouring ZIP.
            </p>
          )}

          {state.status === 'error' && (
            <div className="text-paper/60">
              <p>Couldn&apos;t load that data — the request failed.</p>
              <button
                type="button"
                onClick={() => void lookup(input)}
                className="mt-2 text-brand underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          )}

          {state.status === 'found' && (
            <>
              <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="text-2xl text-paper">
                  {state.record.name ?? `ZIP ${state.record.zip}`}
                </h3>
                <span className="tabular-nums text-paper/40">{state.record.zip}</span>
                <span className="text-paper/40">· {formatMonth(state.record.asOf)}</span>
              </div>

              {meta && state.record.asOf !== meta.dataMonth && (
                <p className="mb-6 rounded-xl border border-paper/15 px-4 py-3 text-sm text-paper/60">
                  This ZIP hasn&apos;t reported since {formatMonth(state.record.asOf)}, so these are
                  its most recent figures rather than {meta.dataMonthLabel}.
                </p>
              )}

              {state.record.lowSample === 1 && (
                <p className="mb-6 rounded-xl border border-paper/15 px-4 py-3 text-sm text-paper/60">
                  The source flags this ZIP as a small sample this month — few enough listings that
                  the month-to-month swings are noisy. Read the direction, not the decimal.
                </p>
              )}

              <MetricTiles record={state.record} />
            </>
          )}
        </div>

        <SourceNote meta={meta} record={state.status === 'found' ? state.record : null} />
      </div>
    </section>
  )
}

export default MarketLookup
