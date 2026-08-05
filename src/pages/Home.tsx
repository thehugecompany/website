import ContactForm from '../components/ContactForm'

function Home() {
  return (
    <>
      <section className="flex min-h-[70svh] flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-logo text-5xl leading-tight md:text-7xl">
          We build <span className="text-brand">huge</span> things.
        </h1>
        <p className="text-lg text-paper/60 md:text-xl">
          <span className="text-brand">$</span> small team, massive output
          <span className="animate-pulse text-brand">_</span>
        </p>
      </section>

      {/* Same component the /contact page renders, inlined so visitors can
          reach us without leaving the landing page. */}
      <section id="contact" className="scroll-mt-24 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-logo text-3xl md:text-5xl">
            Say <span className="text-brand">hello.</span>
          </h2>
          <p className="mt-4 mb-10 text-center text-paper/60">
            <span className="text-brand">$</span> tell us what you&apos;re building
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  )
}

export default Home
