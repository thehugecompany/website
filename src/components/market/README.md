# ZIP market lookup

An agent types a US ZIP code and sees that market's current figures. The point is
that the numbers are checkable: they come from a public dataset, the deltas are
the source's own published figures rather than our arithmetic, and the UI links
back to the raw file so anyone can verify us.

Nothing here is mounted yet — this branch deliberately doesn't touch `App.tsx`
or any page, so it can't collide with routing work. See "Mounting it" below.

## Mounting it

The component is self-contained: it fetches its own data and owns its loading,
empty, and error states. Drop it anywhere.

```tsx
import MarketLookup from './components/market/MarketLookup'

<MarketLookup />
```

It renders as a full `<section id="market">` with its own padding and a
`max-w-5xl` inner container, so it expects to sit at page level rather than
inside another constrained wrapper.

## First run

```bash
npm install     # required: package-lock.json is intentionally NOT in this branch
npm run data    # fetch + build the data (~5 min, see below)
npm run dev
```

**`package-lock.json` is deliberately excluded.** This branch was cut before the
contact-form work landed, so committing its lock would have conflicted with
those dependencies. `package.json` adds one devDependency (`csv-parse`), so run
`npm install` after merging and commit the regenerated lock. Until that happens
`npm ci` will fail with a package.json/lock mismatch — which matters because
`deploy.yml` uses `npm ci`.

## The data

Source: [Realtor.com Data Library](https://www.realtor.com/research/data/) —
free, no API key, no signup.

```
econdata.s3-us-west-2.amazonaws.com/Reports/Core/RDC_Inventory_Core_Metrics_Zip_History.csv
```

822 MB, ~32,000 ZIPs. Realtor.com rebuilds it in the first week of each month.

`scripts/build-market-data.mjs` streams that file, stops once it has 24 months
(reading ~21% of it), and writes ~889 shards keyed by 3-digit ZIP prefix into
`public/data/zip/`, plus a `meta.json`. The browser fetches exactly one ~24 KB
shard for the ZIP typed.

- Wired as `prebuild`, so `npm run build` regenerates data automatically. No cron
  or scheduled workflow needed.
- `public/data/` is gitignored — it's generated, never committed.
- The script **fails the build** if the source is unreachable or changes shape,
  rather than shipping a lookup that silently returns nothing.
- Local runs take ~5 minutes on a slow connection; CI runners are much faster.

Not verified: Realtor.com's licensing terms for commercial use. The files are
public and keyless, and we publish only a reduced 24-month slice with prominent
attribution, but someone should read their terms before launch.

## Things that will look like bugs but aren't

- **Half of all ZIPs show a "small sample" warning.** 51% of ZIPs carry the
  source's `quality_flag`. That's real, not a bug.
- **Some ZIPs show `—` instead of a number.** Rural ZIPs genuinely have missing
  metrics. Null is rendered as an em dash everywhere and never coerced to `0`,
  because "no data" must not read as "zero listings."
- **A missing shard returns HTTP 200, not 404.** Only 889 of 1000 possible
  prefixes exist, and a static host with SPA fallback answers the rest with
  `index.html`. `MarketLookup` detects this by content-type — don't "simplify"
  that check back to a status check, or unknown ZIPs will report a network error.
- **Price-cut deltas say "pts", not "%".** Share metrics carry percentage-*point*
  differences in the source; the other metrics are relative. Rendering them the
  same way would misstate the number.
- **Deltas aren't colored green/red.** Whether "up" is good depends on which side
  of the deal the reader is on, so direction is carried by ▲/▼ glyphs instead of
  a valence color.

## Files

| File | Role |
|---|---|
| `MarketLookup.tsx` | Section, input, fetch + state machine |
| `MetricTiles.tsx` | The six stat tiles and their deltas |
| `Sparkline.tsx` | 24-month trend, hover/keyboard readout |
| `SourceNote.tsx` | Provenance + the full monthly table |
| `types.ts` | Shapes, metric config, formatting |
| `../../../scripts/build-market-data.mjs` | The data pipeline |

To add or remove a tile, edit `METRICS` in `types.ts`. Sparklines only exist for
the metrics listed in `SERIES_METRICS` in the build script — adding one there
increases shard size.
