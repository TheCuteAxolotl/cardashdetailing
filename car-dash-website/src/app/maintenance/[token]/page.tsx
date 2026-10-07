import type { Metadata } from "next";
import MaintenanceCheckoutForm from "@/components/MaintenanceCheckoutForm";
import { getMaintenanceOfferByToken } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Maintenance Plan | Car Dash Detailing",
  robots: { index: false, follow: false },
};

export default async function PrivateMaintenancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const offer = await getMaintenanceOfferByToken(token);

  if (!offer || !offer.active) {
    return (
      <main className="customer-app grid min-h-[70vh] place-items-center px-5 text-white">
        <div className="max-w-lg text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/32">Car Dash maintenance</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em]">This private offer isn’t available.</h1>
          <p className="mt-4 text-sm leading-7 text-white/45">Contact Car Dash if you need a new maintenance subscription link.</p>
          <a href="/contact" className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#171411]">Contact Car Dash</a>
        </div>
      </main>
    );
  }

  return (
    <main className="customer-app min-h-screen text-white">
      <section className="border-b border-white/8">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 sm:py-18 lg:px-12 lg:py-20">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/36">Private maintenance offer</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[.92] tracking-[-.06em] sm:text-6xl">
            A monthly plan made for {offer.customerName || "you"}.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/46">This link was created specifically for this maintenance plan.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <MaintenanceCheckoutForm
          offerToken={offer.shareToken}
          planName={offer.name}
          description={offer.description || "Private monthly maintenance plan with Car Dash Detailing."}
          amountCents={offer.amountCents}
          defaultCustomerName={offer.customerName || ""}
          defaultCustomerEmail={offer.customerEmail || ""}
          defaultCustomerPhone={offer.customerPhone || ""}
          lockName={Boolean(offer.customerName)}
          lockEmail={Boolean(offer.customerEmail)}
          lockPhone={Boolean(offer.customerPhone)}
        />
      </section>
    </main>
  );
}
