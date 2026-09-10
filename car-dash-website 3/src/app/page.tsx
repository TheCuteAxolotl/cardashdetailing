import Link from "next/link";
import DynamicGallery from "@/components/DynamicGallery";
import HeroBackdrop from "@/components/HeroBackdrop";
import ServiceCards from "@/components/ServiceCards";

const whyCarDash = [
  {
    number: "01",
    title: "Mobile service that comes to you",
    copy: "Home, work, or wherever the vehicle is parked. You don’t have to waste part of your day sitting at a detail shop.",
  },
  {
    number: "02",
    title: "You know the price",
    copy: "The packages shown are the services Car Dash Detailing is currently offering. If a vehicle needs extra work, pricing is confirmed before anything is added.",
  },
  {
    number: "03",
    title: "Care that shows in the result",
    copy: "The goal is more than a quick wash. Every service focuses on the areas that make the vehicle look and feel noticeably better when the job is finished.",
  },
];

const process = [
  ["1", "Pick a service", "Choose the package that fits what you want done."],
  ["2", "Send your vehicle", "Share the year, make, model, and anything Car Dash Detailing should know."],
  ["3", "We come to you", "Once the day and time are confirmed, Car Dash Detailing brings the service to you."],
];

const faqs = [
  [
    "Do you come to my house?",
    "Yes. Car Dash Detailing is mobile and comes to you. If the setup needs anything specific, you’ll know before the appointment.",
  ],
  [
    "How long does a detail take?",
    "It depends on the package and the condition of the vehicle. A heavier interior, paint work, or coating job will take longer than a maintenance detail.",
  ],
  [
    "Can I book something that isn’t listed?",
    "Yes. Send what you want done and Car Dash Detailing can recommend what makes sense for the vehicle and provide a quote.",
  ],
  [
    "Are the prices final?",
    "The listed package price is the starting point. If the vehicle has heavy stains, pet hair, major contamination, or needs extra correction, any added cost is confirmed before the work begins.",
  ],
];

export default function Home() {
  return (
    <div className="bg-white text-black">
      <section className="relative isolate min-h-[720px] overflow-hidden bg-black text-white">
        <HeroBackdrop />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(220,38,38,.12),transparent_30%)]" />

        <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,.9)]" />
              Mobile detailing based in South Elgin
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.32em] text-red-400">
              Interior • Exterior • Paint • Protection
            </p>

            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-6xl lg:text-[5.6rem]">
              Your car should look way better than just <span className="text-red-500">clean.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-neutral-200 sm:text-lg">
              Professional mobile detailing brought right to you. Choose the package that fits, share what the vehicle needs, and Car Dash Detailing handles the rest.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-4 text-sm font-black text-white shadow-[0_16px_45px_rgba(220,38,38,.30)] transition hover:bg-red-500"
              >
                Get a Quote
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white hover:text-black"
              >
                See Services
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-black uppercase tracking-[0.16em] text-neutral-300">
              <span>✓ Fully mobile</span>
              <span>✓ Real work gallery</span>
              <span>✓ Owner-managed pricing</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#f4f3f0]">
        <div className="mx-auto grid max-w-7xl gap-0 md:grid-cols-3">
          {whyCarDash.map((item) => (
            <div key={item.number} className="border-b border-black/10 px-6 py-9 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-10">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black tracking-[0.2em] text-red-600">{item.number}</span>
                <div className="h-px flex-1 bg-black/10" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.025em]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">My Services</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Pick the detail that fits your car.
              </h2>
            </div>
            <div className="max-w-xl">
              <p className="text-sm leading-7 text-neutral-600">
                These packages are kept current through the Car Dash Detailing service menu, so pricing and availability stay up to date.
              </p>
              <Link href="/services" className="mt-4 inline-flex text-sm font-black text-red-600 hover:text-red-500">
                View all services →
              </Link>
            </div>
          </div>

          <ServiceCards limit={3} variant="light" />
        </div>
      </section>

      <section className="overflow-hidden bg-[#080808] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">What Car Dash Is About</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Car Dash Detailing is built for more than a quick wipe-down.
            </h2>
            <p className="mt-6 text-base leading-8 text-neutral-300">
              The whole point is for you to notice the difference when the job is done. Cleaner interior, better gloss, protected paint, and the convenience of not having to take the car somewhere and wait around.
            </p>
            <p className="mt-4 text-base leading-8 text-neutral-400">
              Whether the goal is a full reset or bringing the paint back, Car Dash Detailing recommends what actually makes sense for the vehicle instead of stacking unnecessary add-ons onto the job.
            </p>
            <Link href="/contact" className="mt-7 inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-black transition hover:border-red-500 hover:text-red-400">
              Tell Me About Your Car
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-red-600/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] p-3">
              <DynamicGallery limit={4} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f3f0]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-10 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">How It Works</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Booking shouldn’t be complicated.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {process.map(([number, title, copy]) => (
              <div key={number} className="rounded-[1.6rem] border border-black/10 bg-white p-7 shadow-[0_18px_60px_rgba(0,0,0,.05)]">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-red-600 text-sm font-black text-white">{number}</span>
                <h3 className="mt-6 text-2xl font-black tracking-[-0.025em]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">Recent Work</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                See vehicles detailed by Car Dash Detailing.
              </h2>
            </div>
            <Link href="/gallery" className="text-sm font-black text-red-600 hover:text-red-500">
              Open full gallery →
            </Link>
          </div>

          <DynamicGallery limit={6} />
        </div>
      </section>

      <section className="bg-[#080808] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Common Questions</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Before you book.
              </h2>
              <p className="mt-5 text-sm leading-7 text-neutral-400">
                If you have a question that isn’t here, just send it with your booking request.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-5 open:border-red-500/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black">
                    <span>{question}</span>
                    <span className="text-xl text-red-500 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-400">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-red-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-100">Ready when you are</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Send the vehicle details and Car Dash Detailing will help match it with the right service.
            </h2>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-black text-black transition hover:bg-black hover:text-white"
          >
            Get a Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
