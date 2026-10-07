import type { Metadata } from "next";
import MaintenanceManageClient from "@/components/MaintenanceManageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Maintenance Subscription | Car Dash Detailing",
  robots: { index: false, follow: false },
};

export default async function MaintenanceManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;

  return (
    <main className="customer-app min-h-screen px-5 py-14 text-white sm:px-8 sm:py-20">
      <MaintenanceManageClient token={token} sessionId={query.session_id || null} />
    </main>
  );
}
