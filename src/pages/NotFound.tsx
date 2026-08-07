import { Link } from 'react-router'

/**
 * Catch-all route. This is also what gets prerendered into dist/404.html, which
 * is what GitHub Pages serves for any URL with no file behind it — so a broken
 * or mistyped link lands here rather than on a blank screen.
 */
const ELSEWHERE = [
  { to: '/solutions', label: 'What we build', hint: 'the problems we take on' },
  { to: '/about-us', label: 'About us', hint: 'the people behind it' },
  { to: '/contact', label: 'Contact us', hint: 'tell us what you need' },
]

function NotFound() {
  return (
    <section className="px-6 py-20 md:px-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-center font-logo text-5xl text-brand md:text-7xl">404</p>
        <h1 className="mt-4 text-center font-logo text-3xl md:text-5xl">
          Nothing <span className="text-brand">here.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-center leading-relaxed text-paper/60">
          That page has either moved or never existed. Both are fixable — here is
          everywhere else.
        </p>

        <ul className="mt-12 grid gap-4">
          {ELSEWHERE.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center justify-between rounded-xl border border-paper/10 p-5 transition-colors hover:border-brand/40"
              >
                <span>
                  <span className="font-logo text-lg">{item.label}</span>
                  <span className="mt-1 block text-sm text-paper/50">{item.hint}</span>
                </span>
                <span aria-hidden="true" className="ml-4 text-brand">
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center text-paper/60">
          Or head back to the{' '}
          <Link to="/" className="text-brand underline-offset-4 hover:underline">
            home page
          </Link>
          .
        </p>
      </div>
    </section>
  )
}

export default NotFound
