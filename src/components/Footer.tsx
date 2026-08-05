import { Link } from 'react-router'

function Footer() {
  return (
    <footer className="border-t border-paper/10 px-8 py-6 md:px-16">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <Link to="/" aria-label="thehugecompany home" className="font-logo text-xl">
          <span className="text-brand">./</span>thc
        </Link>
        <nav aria-label="Footer" className="flex items-center gap-6 text-sm">
          <a href="#about" className="text-paper/60 transition-colors hover:text-brand">
            About
          </a>
          <a href="#solutions" className="text-paper/60 transition-colors hover:text-brand">
            Solutions
          </a>
          <Link to="/contact" className="text-paper/60 transition-colors hover:text-brand">
            Contact
          </Link>
        </nav>
        <p className="text-sm text-paper/40">
          <span className="text-brand">$</span> © {new Date().getFullYear()} thehugecompany
          <span className="text-brand"> · exit 0</span>
        </p>
      </div>
    </footer>
  )
}

export default Footer
