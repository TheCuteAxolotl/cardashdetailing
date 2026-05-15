const services = [
  {
    title: "Interior detail",
    description: "Precision cleaning for carpets, leather, trim, and vents to restore a refined cabin feel.",
  },
  {
    title: "Exterior refresh",
    description: "Hand wash, paint decontamination, and gentle polish for a crisp, showroom finish.",
  },
  {
    title: "Protective coating",
    description: "Long-lasting sealant and trim protection to preserve surfaces and maintain an elegant shine.",
  },
];

const galleryItems = [
  { label: "Dash restoration", result: "Before / After" },
  { label: "Seat cleaning", result: "Before / After" },
  { label: "Trim renewal", result: "Before / After" },
];

const testimonials = [
  {
    name: "Morgan Lee",
    role: "Owner, Luxury Auto Club",
    quote: "Car Dash Detailing delivered a flawless finish with thoughtful care and excellent communication.",
  },
  {
    name: "Jamal Rivera",
    role: "Concierge Services",
    quote: "A reliable partner for premium detailing. Every vehicle left looking crisp and professionally cared for.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-900">
            Car Dash Detailing
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-700 md:flex">
            <a href="/services" className="transition hover:text-slate-900">Services</a>
            <a href="#gallery" className="transition hover:text-slate-900">Gallery</a>
            <a href="#reviews" className="transition hover:text-slate-900">Reviews</a>
            <a href="#contact" className="transition hover:text-slate-900">Contact</a>
          </nav>
          <a
            href="#contact"
            className="rounded-full border border-slate-200 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800"
          >
            Book Now
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium uppercase tracking-[0.3em] text-slate-600">
              Premium auto detailing
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Thoughtful detailing for a refined drive.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Car Dash Detailing creates clean, calm interiors and polished exteriors with a professional, understated approach. Every appointment is focused on precision, consistency, and lasting results.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800"
              >
                Book Now
              </a>
              <a
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                View services
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm shadow-slate-100/80">
            <div className="rounded-3xl bg-white p-8 shadow-inner shadow-slate-100">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Service preview</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">Tailored solutions</p>
                </div>
                <div className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                  Care first
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-950">Detailing plan</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Interior, exterior, paint protection, and finish maintenance designed for modern vehicles.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-950">Quality service</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">A calm appointment rhythm, precise execution, and polished results every time.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Our services</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Designed for a cleaner, more confident ride.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Each service is structured to feel premium without being overly complicated. Clean results, trusted techniques, and exceptional finishes.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-slate-300">
                <h3 className="text-xl font-semibold text-slate-950">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="gallery" className="mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Gallery preview</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Subtle, effective transformations.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Explore real improvement through carefully curated before and after work that reflects a quiet luxury standard.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-40 rounded-3xl bg-slate-100" />
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{item.result}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Client feedback</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Trusted by local drivers.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Dependable service with a focus on clarity, punctuality, and clean results that feel reassuringly professional.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {testimonials.map((testimonial) => (
              <blockquote key={testimonial.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <p className="text-base leading-8 text-slate-700">“{testimonial.quote}”</p>
                <footer className="mt-6">
                  <p className="font-semibold text-slate-950">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-20 rounded-[2rem] border border-slate-200 bg-slate-950 px-8 py-14 text-white sm:px-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Contact</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ready to book your detail?</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Reach out to schedule a consultation or reserve your appointment for a premium clean and protection service.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="mailto:hello@cardashdetailing.com"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:bg-slate-100"
              >
                Email us
              </a>
              <a
                href="tel:+18005551234"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
              >
                Call now
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-slate-50 text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">© {new Date().getFullYear()} Car Dash Detailing. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a href="/services" className="transition hover:text-slate-900">Services</a>
            <a href="#gallery" className="transition hover:text-slate-900">Gallery</a>
            <a href="#reviews" className="transition hover:text-slate-900">Reviews</a>
            <a href="#contact" className="transition hover:text-slate-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
