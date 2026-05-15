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
  {
    name: "Nina Patel",
    role: "Weekend Car Collector",
    quote: "A quiet, professional experience with outstanding results. The car looked showroom-ready without any fuss.",
  },
];

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-4xl">
          <p className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-red-900">
            Reviews
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Trusted by drivers who expect premium care.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Honest feedback from clients who value consistency, attention to detail, and a premium service experience.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <blockquote key={testimonial.name} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-base leading-8 text-slate-700">“{testimonial.quote}”</p>
              <footer className="mt-6">
                <p className="font-semibold text-slate-950">{testimonial.name}</p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </main>
    </div>
  );
}
