import BookingForm from "../../components/BookingForm";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.17),transparent_35%)]">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-18">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Book Your Detail</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">Tell me what you’ve got. I’ll take it from there.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300">
            Send the vehicle info, what package you want, and anything I should know about the condition. I’ll review it and reach out to confirm the job.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <div className="rounded-[2rem] border border-white/10 bg-[#111111] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <BookingForm />
        </div>
      </main>
    </div>
  );
}
