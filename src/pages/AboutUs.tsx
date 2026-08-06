/**
 * The /about-us route — who is behind the company.
 *
 * Founder details live in the FOUNDERS array below rather than in the markup,
 * so adding or removing a person is a single object edit and every card stays
 * structurally identical.
 *
 * Avatars are initials rather than photographs: nothing to source, nothing to
 * commit, and no layout shift while an image loads. Swapping in real headshots
 * later means replacing the monogram <div> with an <img> — the card geometry
 * already reserves the space.
 */

type Founder = {
  name: string
  role: string
  bio: string
  /** Full profile URL, including https:// — these open off-site. */
  linkedin: string
  /** Rendered in the monogram box; kept explicit so it is never derived wrong. */
  initials: string
}

const FOUNDERS: Founder[] = [
  {
    name: 'Uthkarsh Pai',
    role: 'Founder',
    bio: 'Solving huge things for huge money.',
    linkedin: 'https://www.linkedin.com/in/uthkarsh-pai/',
    initials: 'UP',
  },
  {
    name: 'Gopu Nagasai Vallabh',
    role: 'Founder',
    bio: 'Solving huge things for big money.',
    linkedin: 'https://www.linkedin.com/in/vallabh-gopu/',
    initials: 'GV',
  },
]

/** Inline because public/icons.svg has no LinkedIn glyph and nothing imports it. */
function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  )
}

function AboutUs() {
  return (
    <section className="px-6 py-20 md:px-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center font-logo text-4xl md:text-6xl">
          About <span className="text-brand">us.</span>
        </h1>
        <p className="mt-4 text-center text-paper/60">
          <span className="text-brand">$</span> whoami
          <span className="animate-pulse text-brand">_</span>
        </p>

        <p className="mx-auto mt-10 max-w-2xl text-center leading-relaxed text-paper/70">
          Agents don&apos;t have generic problems — so we don&apos;t ship generic
          solutions. We start with the specific shape of what&apos;s slowing you
          down, then build the answer around it. One problem, understood properly,
          solved properly.
        </p>

        <ul className="mt-16 grid gap-8 sm:grid-cols-2">
          {FOUNDERS.map((founder) => (
            <li
              key={founder.name}
              className="rounded-xl border border-paper/10 p-6 transition-colors hover:border-brand/40"
            >
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-paper/10 font-logo text-xl text-brand"
                >
                  {founder.initials}
                </div>
                <div className="min-w-0">
                  <h2 className="font-logo text-xl md:text-2xl">{founder.name}</h2>
                  <p className="text-sm text-brand">{founder.role}</p>
                </div>
              </div>

              <p className="mt-5 leading-relaxed text-paper/70">{founder.bio}</p>

              <a
                href={founder.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${founder.name} on LinkedIn`}
                className="mt-5 inline-flex items-center gap-2 text-sm text-paper/60 transition-colors hover:text-brand"
              >
                <LinkedInIcon />
                LinkedIn
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default AboutUs
