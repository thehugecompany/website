/**
 * The /solutions route — the problem areas we can build into.
 *
 * Entries live in the SOLUTIONS array below rather than in the markup, so
 * adding or reordering an offering is a single object edit and every card
 * stays structurally identical.
 *
 * Each entry is deliberately a *gap* rather than a feature: the problem line
 * is what the agent already feels, the build line is what we would put against
 * it. Deriving the list from observed pain is what keeps this page honest with
 * the promise the About page makes.
 *
 * No statistics here on purpose. The research these entries come from marks
 * most of its numbers as vendor-sourced and directional, so the page describes
 * the problems qualitatively and leaves the figures out.
 */

import { Link } from 'react-router'

type Solution = {
  title: string
  /** The gap in the agent's own terms — what is broken today. */
  problem: string
  /** What we would build against it. */
  build: string
}

const SOLUTIONS: Solution[] = [
  {
    title: 'Lead qualification',
    problem: 'Auto-texts stop at "sent". A lead who replies with a real question waits hours for a human.',
    build:
      'Conversational follow-up that qualifies budget, timeline and motivation, routes with the context attached, and flags leads going cold.',
  },
  {
    title: 'Transaction coordination',
    problem: 'The incumbents are document storage with AI bolted on, not a coordination engine.',
    build:
      'Read the contract, extract dates, parties and contingencies, build the deadline timeline, draft the status emails.',
  },
  {
    title: 'Compliance & paperwork',
    problem:
      'Since the NAR practice changes of August 2024, written buyer agreements are a recurring burden that tools handle badly.',
    build:
      'Agreement generation, versioning and audit trails tuned to each state’s forms, with missing signatures caught before an auditor sees them.',
  },
  {
    title: 'Commission & splits',
    problem:
      'Tiered caps, team overrides, franchise royalties, E&O deductions, referral and co-broker splits — all in a spreadsheet until a payout goes wrong.',
    build:
      'Real-time calculation straight off the transaction record, and agents who can see their own cap progress without asking.',
  },
  {
    title: 'Back office',
    problem: 'Bookkeeping, onboarding, document organisation, CRM hygiene — the work nobody wants to hire for.',
    build:
      'Brokerage-grade automation for shops too small to justify an operations department.',
  },
  {
    title: 'Data portability',
    problem:
      'Your CRM is owned by your largest competitor, your website will not leave with you, and the glue between tools breaks quietly.',
    build:
      'Guaranteed clean export of your data and your site, and direct integrations instead of automation glue that drops leads when it fails.',
  },
  {
    title: 'Database mining',
    problem: 'A large book of past clients and sphere sits dormant with no system for who to call today.',
    build:
      'Timing signals — life events, equity, dormancy — surfaced as a ranked list, with the outreach already drafted.',
  },
  {
    title: 'Showings & marketing',
    problem:
      'Scheduling confirms the appointment and stops. Newsletters and social live somewhere your CRM cannot see.',
    build:
      'Confirmations and post-showing feedback looped back into follow-up, with real campaigns running natively.',
  },
  {
    title: 'Niche verticals',
    problem:
      'Commercial deals, agent-side leasing and hundreds of fragmented MLS systems fall outside what generic tools cover.',
    build:
      'Staged multi-party commission logic, leasing funnels that do not leak at the application, one login across every market you work.',
  },
]

function Solutions() {
  return (
    <section className="px-6 py-20 md:px-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center font-logo text-4xl md:text-6xl">
          What we <span className="text-brand">build.</span>
        </h1>
        <p className="mt-4 text-center text-paper/60">
          <span className="text-brand">$</span> ls ./solutions
          <span className="animate-pulse text-brand">_</span>
        </p>

        <p className="mx-auto mt-10 max-w-2xl text-center leading-relaxed text-paper/70">
          These are the places real estate software keeps leaving agents
          stranded. Think of them as starting points, not a catalogue — we pick
          the one that is actually costing you, and build around that.
        </p>

        <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((solution) => (
            <li
              key={solution.title}
              className="rounded-xl border border-paper/10 p-6 transition-colors hover:border-brand/40"
            >
              <h2 className="font-logo text-xl">{solution.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-paper/50">
                {solution.problem}
              </p>
              <p className="mt-4 leading-relaxed text-paper/70">
                <span aria-hidden="true" className="mr-2 text-brand">
                  &rarr;
                </span>
                {solution.build}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-16 text-center text-paper/60">
          Something here sounds like your week?{' '}
          <Link to="/contact" className="text-brand underline-offset-4 hover:underline">
            Tell us about it.
          </Link>
        </p>
      </div>
    </section>
  )
}

export default Solutions
