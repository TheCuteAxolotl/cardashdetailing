import type { Metadata } from "next";
import MaintenanceCheckoutForm from "@/components/MaintenanceCheckoutForm";
import { STANDARD_MAINTENANCE_PLAN } from "@/lib/maintenance";

export const metadata: Metadata = {
  title: "Ceramic Maintenance Membership | Car Dash Detailing",
  description: "Monthly ceramic maintenance with Car Dash Detailing for $60 per month.",
};

export default function MaintenancePage() {
  return (
    <main className="customer-app min-h-screen text-white">
      <section className="border-b border-white/8">
        <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/36">Maintenance membership</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[.9] tracking-[-.065em] sm:text-6xl lg:text-7xl">
            Keep your ceramic-coated car maintained every month.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/48">
            One simple monthly plan. Set up recurring billing once, then keep your maintenance with Car Dash.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <MaintenanceCheckoutForm
          planName={STANDARD_MAINTENANCE_PLAN.name}
          description={STANDARD_MAINTENANCE_PLAN.description}
          amountCents={STANDARD_MAINTENANCE_PLAN.amountCents}
        />
      </section>
    </main>
  );
}
