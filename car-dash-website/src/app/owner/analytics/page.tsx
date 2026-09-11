import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Analytics() {
  const [bookings, quoteCount, acceptedQuotes, users] = await Promise.all([
    prisma.booking.findMany({ select: { status: true, quotedPrice: true, createdAt: true } }),
    prisma.quoteThread.count(),
    prisma.quoteThread.findMany({
      where: { status: { in: ["accepted", "booked"] }, quotedPrice: { not: null } },
      select: { quotedPrice: true, status: true },
    }),
    prisma.user.count({ where: { role: "user" } }),
  ]);

  const completed = bookings.filter((booking) => booking.status === "completed");
  const pending = bookings.filter((booking) => booking.status === "pending").length;
  const completedRevenue = completed.reduce((sum, booking) => sum + (booking.quotedPrice || 0), 0);
  const bookedValue = bookings
    .filter((booking) => !["cancelled"].includes(booking.status))
    .reduce((sum, booking) => sum + (booking.quotedPrice || 0), 0);
  const acceptedQuoteValue = acceptedQuotes.reduce((sum, quote) => sum + (quote.quotedPrice || 0), 0);

  const cards = [
    ["Total bookings", bookings.length],
    ["Pending requests", pending],
    ["Completed", completed.length],
    ["Quote chats", quoteCount],
    ["Customers", users],
    ["Active booking value", `$${bookedValue.toLocaleString()}`],
    ["Completed booking value", `$${completedRevenue.toLocaleString()}`],
    ["Accepted / booked quote value", `$${acceptedQuoteValue.toLocaleString()}`],
  ];

  return (
    <main className="min-h-screen bg-[#070707] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-[#00F2FE]">Owner</p>
            <h1 className="mt-2 text-4xl font-semibold">Analytics</h1>
            <p className="mt-2 text-white/40">Bookings, leads, customers, and exact booking totals.</p>
          </div>
          <a href="/owner/dashboard" className="h-fit rounded-full border border-white/15 px-5 py-3 text-sm">Back</a>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([key, value]) => (
            <div key={String(key)} className="rounded-[26px] border border-white/10 bg-white/[.03] p-6">
              <p className="text-sm text-white/40">{key}</p>
              <p className="mt-3 text-4xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/25">
          Booking values use the exact total saved with each new booking. Payment processing is still separate and can be connected later.
        </p>
      </div>
    </main>
  );
}
