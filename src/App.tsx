import { Route, Routes } from 'react-router'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Contact from './pages/Contact'
import AboutUs from './pages/AboutUs'
import Solutions from './pages/Solutions'

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route index element={<Home />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="solutions" element={<Solutions />} />
          <Route path="contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
