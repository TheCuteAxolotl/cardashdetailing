import BookingForm from "../../components/BookingForm";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-4xl">
          <p className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-red-900">
            Contact
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Book your detail with a quick request.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Fill out the details about your car, schedule, and service needs. We’ll review it and reach out via text to confirm next steps.
          </p>
        </div>

        <div className="mt-14 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <BookingForm />
        </div>
      </main>
    </div>
  );
}
