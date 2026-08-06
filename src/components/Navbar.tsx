import { useAnimate } from "motion/react"
import { useEffect, useState } from "react";
import { Link } from "react-router";
import blinker from "../assets/images/blink1.svg";

const START = "thc";
const TARGET = "thehugecompany";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Breakpoint = "mobile" | "tablet" | "desktop";

const getBreakpoint = (): Breakpoint => {
  if (window.matchMedia("(min-width: 1024px)").matches) return "desktop";
  if (window.matchMedia("(min-width: 768px)").matches) return "tablet";
  return "mobile";
};

// The logo renders as: ./ pre [huge in orange] post <cursor> tail
type LogoText = { pre: string; huge: string; post: string; tail: string };

const IDLE: LogoText = { pre: START, huge: "", post: "", tail: "" };

function Navbar() {
  const [logo, setLogo] = useState<LogoText>(IDLE);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const queries = ["(min-width: 1024px)", "(min-width: 768px)"]
      .map((q) => window.matchMedia(q));
    const update = () => setBreakpoint(getBreakpoint());
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, [])

  useEffect(() => {
    let active = true;

    const blinkThrice = () =>
      animate(".blinker", { opacity: [1, 0, 1] }, { duration: 0.5, repeat: 2 })

    const idleBlink = () => {
      if (!active) return;
      animate(".blinker", { opacity: [1, 0, 1] }, { duration: 1, repeat: Infinity })
    }

    // Desktop: blink thrice, delete back to "./t", type the rest of "thehugecompany"
    const desktopSequence = async () => {
      await blinkThrice()
      for (let i = START.length - 1; i >= 1; i--) {
        if (!active) return;
        await pause(200);
        setLogo({ pre: START.slice(0, i), huge: "", post: "", tail: "" });
      }
      for (let i = 2; i <= TARGET.length; i++) {
        if (!active) return;
        await pause(120);
        const typed = TARGET.slice(0, i);
        setLogo({
          pre: typed.slice(0, 3),
          huge: typed.slice(3, 7),
          post: typed.slice(7),
          tail: "",
        });
      }
      idleBlink()
    }

    // Tablet: blink thrice, move the cursor to "h", delete it,
    // type "huge" in its place -> "./thugec"
    const tabletSequence = async () => {
      await blinkThrice()
      await pause(200);
      if (!active) return;
      setLogo({ pre: "th", huge: "", post: "", tail: "c" });
      await pause(200);
      if (!active) return;
      setLogo({ pre: "t", huge: "", post: "", tail: "c" });
      for (let i = 1; i <= 4; i++) {
        await pause(120);
        if (!active) return;
        setLogo({ pre: "t", huge: "huge".slice(0, i), post: "", tail: "c" });
      }
      // move the cursor back to the end
      await pause(200);
      if (!active) return;
      setLogo({ pre: "t", huge: "huge", post: "c", tail: "" });
      idleBlink()
    }

    const run = async () => {
      await Promise.resolve(); // defer past the effect body so state resets don't cascade renders
      if (!active) return;
      setLogo(IDLE);
      if (breakpoint === "desktop") desktopSequence()
      else if (breakpoint === "tablet") tabletSequence()
      else idleBlink() // Mobile: blinking only
    }
    run()

    return () => { active = false };
  }, [breakpoint, animate])

  return (
    // App owns whether the wrapper sticks; this stays relative so the mobile
    // menu can anchor to it.
    <header className="relative flex items-center justify-between px-8 py-6 md:px-16">
      <Link
        ref={scope}
        to="/"
        aria-label="thehugecompany home"
        className="font-logo tracking-tight text-3xl md:text-5xl flex"
      >
        <span className="text-brand">./</span>
        {logo.pre}
        <span className="text-brand">{logo.huge}</span>
        {logo.post}
        <img className="ml-1 blinker h-[1em] w-auto self-center" src={blinker} alt="" />
        {logo.tail}
      </Link>
      {/* Inline links only on wide desktops; every smaller size gets the hamburger */}
      <nav aria-label="Main" className="hidden items-center gap-6 xl:flex xl:gap-12">
        <a
          href="#about"
          className="text-base font-medium transition-colors hover:text-brand md:text-lg"
        >
          About
        </a>
        <a
          href="#solutions"
          className="text-base font-medium transition-colors hover:text-brand md:text-lg"
        >
          Solutions
        </a>
        <Link
          to="/contact"
          className="rounded-xl bg-paper px-5 py-3 text-base font-bold text-brand transition-colors hover:bg-brand hover:text-ink md:px-7 md:text-lg"
        >
          Contact Us
        </Link>
      </nav>
      <button
        type="button"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex flex-col gap-1.5 xl:hidden"
      >
        <span className="h-0.5 w-6 rounded bg-brand" />
        <span className="h-0.5 w-6 rounded bg-paper" />
        <span className="h-0.5 w-6 rounded bg-brand" />
      </button>
      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="absolute left-0 top-full z-10 flex w-full flex-col items-center gap-5 bg-ink pb-8 pt-2 xl:hidden"
        >
          <a
            href="#about"
            onClick={() => setMenuOpen(false)}
            className="text-base font-medium transition-colors hover:text-brand"
          >
            About
          </a>
          <a
            href="#solutions"
            onClick={() => setMenuOpen(false)}
            className="text-base font-medium transition-colors hover:text-brand"
          >
            Solutions
          </a>
          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className="text-base font-medium transition-colors hover:text-brand"
          >
            Contact Us
          </Link>
        </nav>
      )}
    </header>
  )
}

export default Navbar
