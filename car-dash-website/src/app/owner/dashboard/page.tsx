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

const toolRows = [
  ["Schedule", "/owner/schedule", "Calendar, bookings and private to-dos", "calendar"],
  ["Bookings", "/owner/bookings", "Appointments and customer details", "booking"],
  ["Messages", "/owner/messages", "Customer SMS conversations", "message"],
  ["Build a Detail", "/owner/detail-builder", "Inspect a vehicle and build a custom price", "detail"],
  ["Invoices", "/owner/invoices", "Create, send and record payments", "invoice"],
  ["Maintenance", "/owner/maintenance", "Monthly subscriptions and client plans", "maintenance"],
  ["Pricing", "/owner/pricing-pages", "Packages and service pricing", "pricing"],
  ["Website", "/owner/website", "Homepage copy and public content", "website"],
  ["Photos & media", "/owner/gallery", "Website galleries and service images", "photo"],
] as const;

function money(value: number | null | undefined) {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function bookingDate(value?: string | null) {
  if (!value) return "No date";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ToolGlyph({ kind }: { kind: string }) {
  const common = "h-[19px] w-[19px]";
  if (kind === "calendar") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
  if (kind === "message") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><path d="M4 5h16v12H8l-4 3V5Z"/><path d="M8 9h8M8 12h5"/></svg>;
  if (kind === "invoice") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>;
  if (kind === "website") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>;
  if (kind === "photo") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m5 18 4-4 3 3 3-3 4 4"/></svg>;
  if (kind === "pricing") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><path d="M12 3v18"/><path d="M17 7c-1-1-2.6-1.6-4.8-1.6-2.8 0-4.7 1.2-4.7 3.2 0 4.8 9.5 2.1 9.5 7 0 2-1.8 3.4-5 3.4-2.4 0-4.3-.8-5.5-2.2"/></svg>;
  if (kind === "maintenance") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/></svg>;
  if (kind === "booking") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><path d="M5 5h14v15H5z"/><path d="M8 3v4M16 3v4M8 11h8M8 15h5"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common}><path d="M4 7h10M4 17h16M14 7h6M4 12h4M12 12h8"/><circle cx="11" cy="12" r="2"/><circle cx="17" cy="7" r="2"/></svg>;
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
      const bookings =
        bookingsResult.status === "fulfilled" && Array.isArray(bookingsResult.value)
          ? bookingsResult.value
          : [];
      const unread =
        smsResult.status === "fulfilled"
          ? Number(smsResult.value?.totalUnread || 0)
          : 0;
      setMetrics({ bookings, unread });
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const active = metrics.bookings.filter(
      (b) => !["cancelled", "completed"].includes(String(b.status || "").toLowerCase())
    );
    const pending = metrics.bookings.filter(
      (b) => String(b.status || "").toLowerCase() === "pending"
    );
    const completed = metrics.bookings.filter(
      (b) => String(b.status || "").toLowerCase() === "completed"
    );
    const completedValue = completed.reduce(
      (sum, b) => sum + Number(b.quotedPrice || 0),
      0
    );
    return {
      active: active.length,
      pending: pending.length,
      completed: completed.length,
      completedValue,
    };
  }, [metrics.bookings]);

  const upcoming = useMemo(
    () =>
      metrics.bookings
        .filter(
          (b) => !["cancelled", "completed"].includes(String(b.status || "").toLowerCase())
        )
        .sort((a, b) =>
          String(a.preferredDate || "9999").localeCompare(
            String(b.preferredDate || "9999")
          )
        )
        .slice(0, 4),
    [metrics.bookings]
  );

  const recentRows = useMemo(() => {
    const rows: Array<{
      href: string;
      eyebrow: string;
      title: string;
      meta: string;
      kind: string;
    }> = [];

    if (metrics.unread > 0) {
      rows.push({
        href: "/owner/messages",
        eyebrow: "Messages",
        title: `${metrics.unread} unread customer message${metrics.unread === 1 ? "" : "s"}`,
        meta: "Open inbox",
        kind: "message",
      });
    }

    if (summary.pending > 0) {
      rows.push({
        href: "/owner/bookings",
        eyebrow: "Bookings",
        title: `${summary.pending} request${summary.pending === 1 ? "" : "s"} waiting for confirmation`,
        meta: "Review requests",
        kind: "booking",
      });
    }

    for (const booking of upcoming.slice(0, 3)) {
      rows.push({
        href: "/owner/bookings",
        eyebrow: `${bookingDate(booking.preferredDate)} · ${booking.preferredTime || "Time TBD"}`,
        title: `${booking.customerName || "Customer"} · ${booking.serviceName || "Detailing"}`,
        meta:
          [booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(" ") ||
          "Upcoming appointment",
        kind: "calendar",
      });
    }

    return rows.slice(0, 5);
  }, [metrics.unread, summary.pending, upcoming]);

  return (
    <div className="console-home px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1180px]">
        <section className="pb-7 pt-2 sm:pb-9">
          <p className="text-[11px] font-medium text-black/32">Home</p>
          <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Car Dash, at a glance.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-black/42">
                The things that need attention first, without digging through the whole console.
              </p>
            </div>
            <a
              href="/owner/detail-builder"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#171411] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <span className="text-lg leading-none">+</span> New
            </a>
          </div>
        </section>

        <section className="console-home-section border-t border-black/[.08] pt-6">
          <p className="mb-3 text-[13px] font-medium text-black/38">Last few minutes</p>
          <div className="overflow-hidden rounded-[18px] border border-black/[.075] bg-[#f8f6f0]">
            {loaded && recentRows.length ? (
              <div className="divide-y divide-black/[.065]">
                {recentRows.map((item, index) => (
                  <a
                    key={`${item.title}-${index}`}
                    href={item.href}
                    className="group grid gap-3 px-4 py-4 transition hover:bg-white/70 sm:grid-cols-[42px_1fr_auto] sm:items-center sm:px-5"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-black/[.07] bg-white text-black/60">
                      <ToolGlyph kind={item.kind} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-black/28">{item.eyebrow}</p>
                      <p className="mt-1 truncate text-sm font-medium text-[#171411]">{item.title}</p>
                    </div>
                    <p className="text-xs text-black/30 group-hover:text-black/52">{item.meta} →</p>
                  </a>
                ))}
              </div>
            ) : loaded ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-black/48">Nothing urgent right now.</p>
                <p className="mt-1 text-xs text-black/28">Your next booking will show up here.</p>
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-black/32">Loading activity…</div>
            )}
          </div>
        </section>

        <section className="mt-9">
          <p className="mb-3 text-[13px] font-medium text-black/38">Business pulse</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active bookings", loaded ? summary.active : "—"],
              ["Pending", loaded ? summary.pending : "—"],
              ["Unread messages", loaded ? metrics.unread : "—"],
              ["Completed value", loaded ? money(summary.completedValue) : "—"],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-[16px] border border-black/[.07] bg-[#f8f6f0] px-5 py-5">
                <p className="text-[11px] font-medium text-black/34">{label}</p>
                <p className="mt-4 text-3xl font-semibold tracking-[-.045em]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-9 pb-10">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-medium text-black/38">Workspace</p>
            <a href="/owner/settings" className="text-xs font-medium text-black/30 hover:text-black">Settings →</a>
          </div>
          <div className="grid overflow-hidden rounded-[18px] border border-black/[.075] bg-[#f8f6f0] sm:grid-cols-2 lg:grid-cols-3">
            {toolRows.map(([label, href, description, kind], index) => (
              <a
                key={label}
                href={href}
                className={`group min-h-[126px] border-black/[.065] p-5 transition hover:bg-white/72 ${index >= 3 ? "border-t" : ""} ${index % 3 !== 0 ? "lg:border-l" : ""} ${index === 1 ? "sm:border-l lg:border-l" : ""} ${index === 2 ? "sm:border-t lg:border-t-0" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-black/[.07] bg-white text-black/58">
                    <ToolGlyph kind={kind} />
                  </span>
                  <span className="text-lg text-black/18 transition group-hover:text-black/55">↗</span>
                </div>
                <p className="mt-4 text-sm font-semibold">{label}</p>
                <p className="mt-1 text-xs leading-5 text-black/36">{description}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
