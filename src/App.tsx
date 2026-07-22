import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-logo text-5xl leading-tight md:text-7xl">
          We build <span className="text-brand">huge</span> things.
        </h1>
        <p className="text-lg text-paper/60 md:text-xl">
          <span className="text-brand">$</span> small team, massive output
          <span className="animate-pulse text-brand">_</span>
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default App
