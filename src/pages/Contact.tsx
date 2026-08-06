import ContactForm from '../components/ContactForm'

function Contact() {
  return (
    <section className="px-6 py-20 md:px-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-logo text-4xl md:text-6xl">
          Contact <span className="text-brand">us.</span>
        </h1>
        <p className="mt-4 mb-10 text-center text-paper/60">
          Tell us what you&apos;re building.
        </p>
        <ContactForm />
      </div>
    </section>
  )
}

export default Contact
