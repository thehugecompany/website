import { formatMonth, formatValue, METRICS, type Meta, type ZipRecord } from './types'

/**
 * Provenance, and the table view behind it.
 *
 * This is not boilerplate at the bottom of a chart. The lookup's entire job is
 * to be checkable by someone who already knows their own market, so naming the
 * source, linking the actual file, and exposing every plotted number as text is
 * the feature — a number you can verify is worth more than a claim we write.
 */
function SourceNote({ meta, record }: { meta: Meta | null; record: ZipRecord | null }) {
  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-paper/10 pt-6 text-sm text-paper/50">
      {record && (
        <details className="group">
          <summary className="cursor-pointer text-paper/60 transition-colors hover:text-brand">
            Show every month as a table
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left tabular-nums">
              <caption className="sr-only">
                Monthly median list price and days on market for ZIP {record.zip}
              </caption>
              <thead className="text-xs text-paper/40">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-normal">Month</th>
                  <th scope="col" className="py-2 pr-4 font-normal">Median list price</th>
                  <th scope="col" className="py-2 font-normal">Days on market</th>
                </tr>
              </thead>
              <tbody className="text-paper/70">
                {/* newest first — the month an agent checks first */}
                {Array.from({ length: record.series.months.length }, (_, i) => record.series.months.length - 1 - i).map((index) => {
                  const month = record.series.months[index]
                  return (
                    <tr key={month} className="border-t border-paper/5">
                      <th scope="row" className="py-1.5 pr-4 font-normal text-paper/50">
                        {formatMonth(month)}
                      </th>
                      <td className="py-1.5 pr-4">{formatValue(record.series.price[index], 'price')}</td>
                      <td className="py-1.5">{formatValue(record.series.dom[index], 'days')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {meta && (
        <p className="leading-relaxed">
          Every figure comes from the{' '}
          <a
            href={meta.source.page}
            target="_blank"
            rel="noreferrer noopener"
            className="text-paper/70 underline underline-offset-2 transition-colors hover:text-brand"
          >
            {meta.source.name}
          </a>
          , covering {meta.months} months through {meta.dataMonthLabel} across{' '}
          {meta.zipCount.toLocaleString('en-US')} ZIP codes. Month-over-month and year-over-year
          changes are the source's own published figures, not our arithmetic. Check us against{' '}
          <a
            href={meta.source.file}
            target="_blank"
            rel="noreferrer noopener"
            className="text-paper/70 underline underline-offset-2 transition-colors hover:text-brand"
          >
            the raw file
          </a>
          .
        </p>
      )}

      <p className="text-xs text-paper/35">
        {METRICS.length} metrics per ZIP
        {meta && ` · data refreshed ${new Date(meta.generatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`}
      </p>
    </div>
  )
}

export default SourceNote
