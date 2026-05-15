const galleryItems = [
  { label: "Dash restoration", result: "Before / After" },
  { label: "Seat cleaning", result: "Before / After" },
  { label: "Trim renewal", result: "Before / After" },
  { label: "Ceramic protection", result: "After" },
  { label: "Precision wash", result: "After" },
  { label: "Interior refresh", result: "After" },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-4xl">
          <p className="mb-4 inline-flex rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-red-600">
            Gallery
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Subtle transformations with clean finishes.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300 sm:text-lg">
            A curated selection of detailing work that reflects the premium care and understated results clients expect.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item) => (
            <article key={item.label} className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-sm shadow-black/20 transition hover:-translate-y-1 hover:border-red-700 hover:bg-neutral-900">
              <div className="mb-6 h-48 rounded-3xl bg-neutral-900" />
              <p className="text-sm uppercase tracking-[0.25em] text-neutral-400">{item.label}</p>
              <p className="mt-3 text-lg font-semibold text-white">{item.result}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
