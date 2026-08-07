import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChecklistArt, FragmentsArt, HouseClockArt, LockedArt, SkylineArt } from './art'

export type SlideData = {
  id: string
  center: boolean
  art: () => ReactNode
  title: ReactNode
  body: ReactNode
  extra?: ReactNode
}

/* ---- copy for the five slides ---- */
export const SLIDES: SlideData[] = [
  {
    id: 'hook',
    center: false,
    art: SkylineArt,
    title: (
      <>
        Your software stack is <span className="hl">working against</span> you.
      </>
    ),
    body: (
      <>
        Real estate runs on great agents — and on a pile of tools that were never
        designed to work together. Here are five problems almost every agency
        knows too well.
      </>
    ),
  },
  {
    id: 'fragmentation',
    center: false,
    art: FragmentsArt,
    title: (
      <>
        Twenty tools. <span className="hl">Zero</span> glue.
      </>
    ),
    body: (
      <>
        CRM, transactions, showings, e-signatures, commissions, marketing — the
        average brokerage now juggles <b>20+ separate tools</b>, held together by
        spreadsheets and automations that break without warning. <b>Every
        integration point is a failure point</b>: missed leads, duplicate
        contacts, deals slipping through the cracks.
      </>
    ),
    extra: (
      <div className="stat-row">
        <span className="stat ghost">12.4</span>
        <span className="stat-arrow">→</span>
        <span className="stat">20+</span>
        <span className="stat-label">avg. tools per brokerage, 2020 → 2026</span>
      </div>
    ),
  },
  {
    id: 'admin',
    center: false,
    art: HouseClockArt,
    title: (
      <>
        Paperwork is eating your <span className="hl">selling hours</span>.
      </>
    ),
    body: (
      <>
        Re-typing the same client data into three systems. Chasing signatures.
        Copy-pasting between apps that refuse to talk. Agents lose <b>10+ hours a
        week</b> to admin that earns nothing — while &quot;automated&quot; follow-up stops
        at <b>sent</b>, so a real buyer with a real question waits hours for a
        human to notice.
      </>
    ),
  },
  {
    id: 'lockin',
    center: false,
    art: LockedArt,
    title: (
      <>
        Locked <span className="hl">in</span>. Left <span className="hl">on hold</span>.
      </>
    ),
    body: (
      <>
        Your database and website live on someone else&apos;s platform — so leaving
        means starting over. The mobile app can&apos;t do half of what desktop can.
        And when something breaks, support tickets can sit unanswered <b>for
        months</b>.
      </>
    ),
    extra: (
      <div className="chips">
        <span className="chip">data &amp; website lock-in</span>
        <span className="chip">mobile ≠ desktop</span>
        <span className="chip">support black holes</span>
      </div>
    ),
  },
  {
    id: 'compliance',
    center: false,
    art: ChecklistArt,
    title: (
      <>
        New rules. <span className="hl">Old</span> tools.
      </>
    ),
    body: (
      <>
        Written buyer agreements before every tour. Audit trails. Forms that
        change state by state. The compliance burden on agents keeps growing —
        but the software they rely on was <b>never built for it</b>, leaving
        agencies to carry the risk by hand.
      </>
    ),
    extra: (
      // The standalone deck linked out to thehugecompany.net; on the site itself
      // that would be a link to nowhere, so it points at the contact page.
      <div className="cta-line" style={{ justifyContent: 'flex-start' }}>
        <Link className="cta" to="/contact">
          It doesn&apos;t have to be this way
        </Link>
      </div>
    ),
  },
]
