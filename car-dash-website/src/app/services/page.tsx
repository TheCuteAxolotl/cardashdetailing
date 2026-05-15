const servicePackages = [
  {
    name: "Basic Detail",
    description:
      "Interior and exterior refresh including vacuum, wipe down, windows, seats, cracks and crevices, wheels, tire dressing, gloss finish, and 1 foam wash.",
    prices: {
      shop: "$159",
      delivery: "$189",
      mobile: "$209",
    },
  },
  {
    name: "Premium Detail",
    description:
      "Everything in Basic plus disinfectant treatment, air vents, spray wax, 2 foam washes, and two-bucket contact wash.",
    prices: {
      shop: "$219",
      delivery: "$249",
      mobile: "$279",
    },
  },
  {
    name: "Ultimate Detail",
    description:
      "Everything in Premium plus light buff, 1-step paint enhancement, and hand wax.",
    prices: {
      shop: "$399",
      delivery: "$449",
      mobile: "$499",
    },
  },
];

const interiorAddOns = [
  { label: "Pet Hair Removal", price: "$39" },
  { label: "Seat Shampoo", price: "$49" },
  { label: "Carpet Extraction", price: "$59" },
  { label: "Heavy Stain Removal", price: "$69" },
  { label: "Headliner Spot Treatment", price: "$39" },
  { label: "Leather Protection", price: "$39" },
  { label: "Odor Treatment", price: "$49" },
];

const exteriorAddOns = [
  { label: "Engine Bay Cleaning", price: "$49" },
  { label: "Iron Decontamination", price: "$45" },
  { label: "Clay Bar Treatment", price: "$59" },
  { label: "Hand Wax", price: "$49" },
  { label: "Ceramic Sealant", price: "$79" },
  { label: "Wheel Ceramic Coating", price: "$89" },
  { label: "Trim Restoration", price: "$45" },
  { label: "Bug & Tar Removal", price: "$35" },
  { label: "Underbody Wash", price: "$30" },
];

const paintCorrectionUpgrades = [
  {
    label: "1-Step Paint Enhancement",
    price: "$149",
    note: "Available with Premium or higher",
  },
  {
    label: "2-Step Paint Correction",
    price: "$399",
    note: "Inspection or approval required",
  },
  {
    label: "3-Step Paint Correction",
    price: "$599",
    note: "Inspection or approval required",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-4xl">
          <p className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-red-900">
            Premium detailing services
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Clean, simple packages for confident detailing.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Choose the right level of service with clear pricing for drop-off, delivery, and mobile detailing. Every package is designed to deliver consistent, luxurious results without excessive add-ons.
          </p>
        </div>

        <section className="mt-14 grid gap-6 xl:grid-cols-3">
          {servicePackages.map((pkg) => (
            <article key={pkg.name} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-100">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-red-900">{pkg.name}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{pkg.prices.shop}</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-600">{pkg.description}</p>

              <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 sm:grid-cols-3">
                  <div>Drop-Off / Shop</div>
                  <div>Delivery Service</div>
                  <div>Mobile Service</div>
                </div>
                <div className="mt-4 grid gap-3 text-center text-2xl font-semibold text-slate-950 sm:grid-cols-3">
                  <div>{pkg.prices.shop}</div>
                  <div>{pkg.prices.delivery}</div>
                  <div>{pkg.prices.mobile}</div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <a
                  href="mailto:hello@cardashdetailing.com"
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-black"
                >
                  Book Now
                </a>
                <p className="text-xs leading-5 text-slate-500">
                  Includes professional inspection and tailored service planning for your vehicle.
                </p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-[2rem] border border-slate-200 bg-white px-8 py-10">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.9fr] xl:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-red-900">Add-on services</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Interior, exterior, and controlled upgrades.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Additional services are available to support the package you choose. Premium upgrades are managed separately so package value remains clear and complete.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-900">Important pricing notes</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>1-Step Paint Enhancement is available with Premium Detail or higher.</li>
                <li>2-Step and 3-Step Paint Correction require inspection or approval before scheduling.</li>
                <li>Add-ons support a selected package; they are not intended to replace package coverage.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-slate-200 bg-slate-950 px-8 py-14 text-white sm:px-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-200">Book your detail</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Reserve a premium appointment.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
                Contact us to plan a detailed service that fits your schedule and vehicle.
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
                className="inline-flex items-center justify-center rounded-full bg-red-950 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-800"
              >
                Call now
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-950">Interior Add-Ons</h3>
            <div className="mt-6 space-y-4">
              {interiorAddOns.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-950">Exterior Add-Ons</h3>
            <div className="mt-6 space-y-4">
              {exteriorAddOns.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-950">Paint Correction Upgrades</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Controlled upgrade services that enhance paint finish with professional guidance.
            </p>
            <div className="mt-6 space-y-4">
              {paintCorrectionUpgrades.map((item) => (
                <div key={item.label} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
