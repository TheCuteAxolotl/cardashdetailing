"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  serviceName?: string;
  customerName?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  status?: string;
  quotedPrice?: number | null;
};

type Metrics = {
  bookings: Booking[];
  unread: number;
};

const quickActions = [
  ["New invoice", "/owner/invoices", "Create and send a customer invoice"],
  ["Add booking", "/owner/bookings", "Record a phone or outside booking"],
  ["Quote requests", "/owner/quotes", "Review photos and send an exact price"],
  ["Edit website", "/owner/website", "Update public copy and page content"],
] as const;

const workspace = [
  ["Bookings", "/owner/bookings", "Schedule, customer details, status and arrival texts"],
  ["Messages", "/owner/messages", "Customer SMS conversations"],
  ["Invoices", "/owner/invoices", "Create, send and record payments"],
  ["Pricing", "/owner/pricing-pages", "Public package and service pricing"],
  ["Photos & media", "/owner/gallery", "Website galleries and service images"],
  ["Business phone", "/owner/calls", "Call forwarding, history and blocked callers"],
] as const;

function money(value: number | null | undefined) {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function bookingDate(value?: string | null) {
  if (!value) return "No date";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function OwnerDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({ bookings: [], unread: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [bookingsResult, smsResult] = await Promise.allSettled([
        fetch("/api/bookings", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/sms/inbox", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (cancelled) return;
      const bookings = bookingsResult.status === "fulfilled" && Array.isArray(bookingsResult.value) ? bookingsResult.value : [];
      const unread = smsResult.status === "fulfilled" ? Number(smsResult.value?.totalUnread || 0) : 0;
      setMetrics({ bookings, unread });
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => {
    const active = metrics.bookings.filter((b) => !["cancelled", "completed"].includes(String(b.status || "").toLowerCase()));
    const pending = metrics.bookings.filter((b) => String(b.status || "").toLowerCase() === "pending");
    const completed = metrics.bookings.filter((b) => String(b.status || "").toLowerCase() === "completed");
    const completedValue = completed.reduce((sum, b) => sum + Number(b.quotedPrice || 0), 0);
    return { active: active.length, pending: pending.length, completed: completed.length, completedValue };
  }, [metrics.bookings]);

  const upcoming = useMemo(() => metrics.bookings
    .filter((b) => !["cancelled", "completed"].includes(String(b.status || "").toLowerCase()))
    .sort((a, b) => String(a.preferredDate || "9999").localeCompare(String(b.preferredDate || "9999")))
    .slice(0, 5), [metrics.bookings]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-7 flex flex-col gap-4 border-b border-black/[.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/36">Business overview</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#111] sm:text-4xl">Good morning.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/48">Bookings, customer communication and the website in one place.</p>
          </div>
          <div className="flex gap-2">
            <a href="/owner/bookings" className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/65 hover:border-black/20 hover:text-black">View schedule</a>
            <a href="/owner/invoices" className="rounded-md bg-[#111] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black">Create invoice</a>
          </div>
        </div>

        <section className="grid gap-px overflow-hidden rounded-lg border border-black/[.08] bg-black/[.08] sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Active bookings", loaded ? summary.active : "—", "Open appointments"],
            ["Pending requests", loaded ? summary.pending : "—", "Need confirmation"],
            ["Unread messages", loaded ? metrics.unread : "—", "Customer SMS"],
            ["Completed value", loaded ? money(summary.completedValue) : "—", `${summary.completed} completed jobs`],
          ].map(([label, value, note]) => (
            <div key={String(label)} className="bg-white px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-xs font-medium text-black/42">{label}</p>
              <p className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#111]">{value}</p>
              <p className="mt-1 text-xs text-black/34">{note}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
          <section className="overflow-hidden rounded-lg border border-black/[.08] bg-white">
            <div className="flex items-center justify-between border-b border-black/[.08] px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-sm font-semibold text-[#111]">Upcoming bookings</h3>
                <p className="mt-0.5 text-xs text-black/38">Your next active appointments</p>
              </div>
              <a href="/owner/bookings" className="text-xs font-semibold text-black/48 hover:text-black">View all →</a>
            </div>

            {upcoming.length ? (
              <div className="divide-y divide-black/[.07]">
                {upcoming.map((booking) => (
                  <a key={booking.id} href="/owner/bookings" className="grid gap-3 px-5 py-4 hover:bg-black/[.02] sm:grid-cols-[88px_1fr_auto] sm:items-center sm:px-6">
                    <div>
                      <p className="text-sm font-semibold text-[#111]">{bookingDate(booking.preferredDate)}</p>
                      <p className="mt-0.5 text-xs text-black/38">{booking.preferredTime || "Time TBD"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#111]">{booking.customerName || "Customer"}</p>
                      <p className="mt-0.5 truncate text-xs text-black/42">{booking.serviceName || "Detailing"}{booking.vehicleMake || booking.vehicleModel ? ` · ${[booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(" ")}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="text-sm font-semibold text-[#111]">{money(booking.quotedPrice)}</span>
                      <span className="rounded border border-black/10 bg-[#f7f7f5] px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-black/45">{booking.status || "open"}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-black/52">No active bookings yet.</p>
                <a href="/owner/bookings" className="mt-3 inline-flex text-xs font-semibold text-black/70">Add an outside booking →</a>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-black/[.08] bg-white p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#111]">Quick actions</h3>
              <p className="mt-0.5 text-xs text-black/38">Common tasks without digging through menus</p>
            </div>
            <div className="divide-y divide-black/[.07] border-y border-black/[.07]">
              {quickActions.map(([label, href, description]) => (
                <a key={label} href={href} className="group flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#111] group-hover:underline">{label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-black/40">{description}</p>
                  </div>
                  <span className="text-lg text-black/25 group-hover:text-black">→</span>
                </a>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-black/[.08] bg-white">
          <div className="border-b border-black/[.08] px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-[#111]">Workspace</h3>
            <p className="mt-0.5 text-xs text-black/38">Everything you use to run Car Dash</p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3">
            {workspace.map(([label, href, description], index) => (
              <a key={label} href={href} className={`group min-h-[128px] p-5 hover:bg-black/[.02] sm:p-6 ${index % 3 !== 0 ? "xl:border-l xl:border-black/[.07]" : ""} ${index >= 3 ? "border-t border-black/[.07]" : index >= 2 ? "sm:border-t sm:border-black/[.07] xl:border-t-0" : index >= 0 ? "" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#111]">{label}</h4>
                    <p className="mt-2 max-w-sm text-xs leading-5 text-black/42">{description}</p>
                  </div>
                  <span className="text-lg text-black/20 group-hover:text-black">↗</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
