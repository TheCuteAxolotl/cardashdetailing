export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-14">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium uppercase tracking-[0.3em] text-red-600">
              Premium auto detailing
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Thoughtful detailing for a refined drive.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-neutral-300 sm:text-lg">
              Car Dash Detailing creates clean, calm interiors and polished exteriors with a professional, understated approach. Every appointment is focused on precision, consistency, and lasting results.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="/services"
                className="inline-flex items-center justify-center rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800"
              >
                Explore services
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800"
              >
                Book now
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 shadow-sm shadow-black/30">
            <div className="rounded-3xl bg-neutral-900 p-8 shadow-inner shadow-black/20">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600">Why choose us</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Focused on detail, not drama.</p>
                </div>
                <div className="rounded-2xl bg-red-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                  Clean luxury
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
                  <p className="text-sm font-semibold text-white">Precise results</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">Every detail is handled with care so your vehicle looks its best without overstatement.</p>
                </div>
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
                  <p className="text-sm font-semibold text-white">Premium service</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">Professional guidance and clean execution for a confident finish.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Services", href: "/services", description: "Full package line-up and pricing for your ride." },
            { title: "Gallery", href: "/gallery", description: "See real results from careful, premium detailing." },
            { title: "Reviews", href: "/reviews", description: "Read what local drivers say about our work." },
            { title: "Contact", href: "/contact", description: "Send details and we’ll follow up via text." },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 text-neutral-100 transition hover:-translate-y-1 hover:border-red-700 hover:bg-neutral-900"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600">{item.title}</p>
              <p className="mt-4 text-base leading-7 text-neutral-300">{item.description}</p>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
