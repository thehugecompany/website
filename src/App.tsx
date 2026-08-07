import { useEffect, useRef } from 'react'
import { Route, Routes } from 'react-router'
import Background from './components/Background'
import Navbar from './components/Navbar'
import ScrollRail from './components/ScrollRail'
// import Footer from './components/Footer'
import Home from './pages/Home'
import Contact from './pages/Contact'
import AboutUs from './pages/AboutUs'
import Solutions from './pages/Solutions'
import NotFound from './pages/NotFound'
import { useDocumentMeta } from './useDocumentMeta'

function App() {
  const navRef = useRef<HTMLDivElement>(null)

  useDocumentMeta()

  /* The navbar is sticky, so it eats the top of the viewport. Publishing its
     height lets pages size their first screen against what's actually left. */
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const publish = () =>
      document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-svh flex-col">
      <Background />
      <div ref={navRef} className="nav-shell">
        <Navbar />
      </div>
      <main className="flex-1">
        <Routes>
          <Route index element={<Home />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="solutions" element={<Solutions />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {/* <Footer /> */}
      <ScrollRail />
    </div>
  )
}

export default App
