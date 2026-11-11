"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OwnerAppIcon, { type OwnerIconName } from "@/components/OwnerAppIcon";

type Area = "grow" | "connect" | "manage" | "paid";
type Booking = {
  id: string;
  serviceName?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  quotedPrice?: number | null;
  status?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
};
type Customer = {
  id: string;
  profile?: { stage?: string };
  bookings?: Array<{ status?: string }>;
  quotes?: Array<{ status?: string }>;
};
type Activity = {
  id: string;
  kind: string;
  title: string;
  href: string;
  time: string;
};
type Data = {
  bookings: Booking[] | null;
  customers: Customer[] | null;
  received: number | null;
  month: string;
  unread: number | null;
  activity: Activity[] | null;
};
type Shortcut = { title: string; detail: string; href: string; icon: OwnerIconName };

const empty: Data = {
  bookings: null,
  customers: null,
  received: null,
  month: "",
  unread: null,
  activity: null,
};
const areas: Array<{ id: Area; number: string; title: string; description: string; icon: OwnerIconName; color: string; active: string }> = [
  { id: "grow", number: "01", title: "Grow your business", description: "Leads, website and marketing", icon: "chart",
    color: "text-[#e6cb8e]", active: "border-[#d6b779]/75 bg-[#d6b779]/[.12]" },
  { id: "connect", number: "02", title: "Connect with customers", description: "Messages, quotes and calls", icon: "message",
    color: "text-[#e7adac]", active: "border-[#d88f8d]/75 bg-[#d88f8d]/[.12]" },
  { id: "manage", number: "03", title: "Manage your day", description: "Calendar, jobs and team", icon: "calendar",
    color: "text-[#a1c5ba]", active: "border-[#7fb4a4]/75 bg-[#7fb4a4]/[.12]" },
  { id: "paid", number: "04", title: "Get paid", description: "Invoices, deposits and reporting", icon: "receipt",
    color: "text-[#c4b5e5]", active: "border-[#a997d2]/75 bg-[#a997d2]/[.12]" },
];

const areaLinks: Record<Area, Shortcut[]> = {
  grow: [
    { title: "Website editor", detail: "Edit your website content", href: "/owner/website", icon: "globe" },
    { title: "Online booking", detail: "Booking settings and availability", href: "/owner/booking-settings", icon: "calendar" },
    { title: "Leads", detail: "Follow up with new prospects", href: "/owner/leads", icon: "users" },
    { title: "Promo codes", detail: "Create customer and shop offers", href: "/owner/promo-codes", icon: "gift" },
    { title: "Analytics", detail: "Booking and quote performance", href: "/owner/analytics", icon: "chart" },
    { title: "Photo gallery", detail: "Show your detailing results", href: "/owner/gallery", icon: "activity" },
  ],
  connect: [
    { title: "Text messages", detail: "Reply in the existing SMS inbox", href: "/owner/messages", icon: "message" },
    { title: "Business calls", detail: "Review calls and callbacks", href: "/owner/calls", icon: "phone" },
    { title: "Quotes", detail: "Manage customer estimates", href: "/owner/quotes", icon: "quote" },
    { title: "Customer CRM", detail: "Customer records and vehicles", href: "/owner/crm", icon: "users" },
    { title: "Email", detail: "Business email workspace", href: "/owner/email", icon: "message" },
    { title: "Support requests", detail: "Review inbound support", href: "/owner/support", icon: "support" },
  ],
  manage: [
    { title: "Calendar", detail: "Appointments and private tasks", href: "/owner/schedule", icon: "calendar" },
    { title: "Bookings", detail: "Edit and confirm scheduled work", href: "/owner/bookings", icon: "book" },
    { title: "Jobs and staff", detail: "Job progress and assignments", href: "/owner/jobs", icon: "users" },
    { title: "Final inspections", detail: "Quality checks and handoff", href: "/owner/inspection", icon: "check" },
    { title: "Maintenance plans", detail: "Recurring client services", href: "/owner/maintenance", icon: "activity" },
    { title: "Inventory", detail: "Detailing supplies and stock", href: "/owner/inventory", icon: "calculator" },
  ],
  paid: [
    { title: "Invoices", detail: "Balances, receipts and payments", href: "/owner/invoices", icon: "receipt" },
    { title: "Revenue", detail: "Actual recorded invoice payments", href: "/owner/revenue", icon: "chart" },
    { title: "Gift cards", detail: "Sales, codes and redemption", href: "/owner/gift-cards", icon: "gift" },
    { title: "Pay tracking", detail: "Hours and commission worksheet", href: "/owner/pay-tracking", icon: "calculator" },
    { title: "Maintenance plans", detail: "Recurring client service billing", href: "/owner/maintenance", icon: "activity" },
    { title: "Shop orders", detail: "Merchandise sales and orders", href: "/owner/shop?view=orders", icon: "book" },
  ],
};

function chicagoParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const pick = (name: string) => parts.find(part => part.type === name)?.value || "";
  return { today: [pick("year"), pick("month"), pick("day")].join("-"), month: pick("year") + "-" + pick("month") };
}
function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}
function timeLabel(value?: string | null) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "Time TBD";
  const hour = Number(match[1]);
  return (hour % 12 || 12) + ":" + match[2] + " " + (hour >= 12 ? "PM" : "AM");
}
function dateLabel(value: string) {
  const parts = value.split("-").map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12)).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
}
function relativeTime(value: string) {
  const delta = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (!Number.isFinite(delta)) return "";
  if (delta < 1) return "Just now";
  if (delta < 60) return delta + "m ago";
  if (delta < 1440) return Math.floor(delta / 60) + "h ago";
  return new Date(value).toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric" });
}
function stage(customer: Customer): "New" | "Contacted" | "Quoted" | "Customer" | "Inactive" {
  const saved = String(customer.profile?.stage || "").toLowerCase();
  if (saved === "inactive") return "Inactive";
  if (saved === "customer" || customer.bookings?.some(booking => ["confirmed", "completed"].includes(String(booking.status).toLowerCase()))) return "Customer";
  if (saved === "quoted" || customer.quotes?.some(quote => ["quoted", "accepted"].includes(String(quote.status).toLowerCase()))) return "Quoted";
  if (saved === "contacted") return "Contacted";
  return "New";
}
async function safeGet(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
function AreaShortcut({ item }: { item: Shortcut }) {
  return <Link href={item.href} className="group flex items-start gap-3 rounded-2xl border border-white/[.09] bg-white/[.035] p-3.5 transition hover:border-[#d6b779]/40 hover:bg-white/[.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b779] sm:p-4">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d6b779]/20 bg-[#d6b779]/[.075] text-[#e4ca96]"><OwnerAppIcon name={item.icon} className="h-5 w-5"/></span>
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-semibold leading-5 text-[#f2ebdf]">{item.title}</span>
      <span className="mt-1 block text-[11px] leading-4 text-[#aca398]">{item.detail}</span>
    </span>
    <OwnerAppIcon name="chevron-right" className="mt-2 h-4 w-4 shrink-0 text-[#a5967e] transition group-hover:translate-x-0.5"/>
  </Link>;
}
function LiveMetric({ label, value, note, icon, href }: { label: string; value: string; note: string; icon: OwnerIconName; href: string }) {
  return <Link href={href} className="group min-w-0 rounded-2xl border border-white/[.09] bg-[#201e1a]/95 p-4 transition hover:border-[#d6b779]/35 sm:p-5">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#c1b7a8]">{label}</span>
      <OwnerAppIcon name={icon} className="h-[17px] w-[17px] shrink-0 text-[#d6b779]"/>
    </div>
    <div className="mt-4 truncate text-[27px] font-semibold tabular-nums tracking-[-.055em] text-[#f7f0e4] sm:text-[32px]">{value}</div>
    <p className="mt-1 text-[10px] leading-4 text-[#a9a094]">{note}</p>
  </Link>;
}

export default function OwnerWorkspace() {
  const [active, setActive] = useState<Area>("grow");
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState("");
  const [asOf, setAsOf] = useState(chicagoParts);
  const load = useCallback(async () => {
    setLoading(true);
    const now = chicagoParts();
    const [bookings, crm, revenue, inbox, activity] = await Promise.all([
      safeGet("/api/bookings"),
      safeGet("/api/crm"),
      safeGet("/api/owner/revenue?month=" + now.month),
      safeGet("/api/sms/inbox"),
      safeGet("/api/owner/activity"),
    ]);
    const bookingsArray = Array.isArray(bookings) ? bookings as Booking[] : null;
    const crmArray = crm && typeof crm === "object" && "customers" in crm && Array.isArray(crm.customers) ? crm.customers as Customer[] : null;
    const paidTotal = revenue && typeof revenue === "object" && "current" in revenue && revenue.current && typeof revenue.current === "object" && "total" in revenue.current && typeof revenue.current.total === "number" ? revenue.current.total : null;
    const unreadCount = inbox && typeof inbox === "object" && "totalUnread" in inbox && typeof inbox.totalUnread === "number" ? inbox.totalUnread : null;
    const activityArray = activity && typeof activity === "object" && "alerts" in activity && Array.isArray(activity.alerts) ? activity.alerts as Activity[] : null;
    setData({ bookings: bookingsArray, customers: crmArray, received: paidTotal, month: now.month, unread: unreadCount, activity: activityArray });
    setAsOf(now);
    setUpdated(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }).format(new Date()));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => { void load(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const counts = useMemo(() => {
    if (!data.customers) return null;
    return {
      new: data.customers.filter(customer => stage(customer) === "New").length,
      contacted: data.customers.filter(customer => stage(customer) === "Contacted").length,
      quoted: data.customers.filter(customer => stage(customer) === "Quoted").length,
      customers: data.customers.filter(customer => stage(customer) === "Customer").length,
    };
  }, [data.customers]);
  const upcoming = useMemo(() => (data.bookings || [])
    .filter(booking => booking.preferredDate && booking.preferredDate >= asOf.today && !["cancelled", "completed"].includes(String(booking.status || "").toLowerCase()))
    .sort((a, b) => String(a.preferredDate).localeCompare(String(b.preferredDate)) || String(a.preferredTime).localeCompare(String(b.preferredTime))), [data.bookings, asOf.today]);
  const pending = data.bookings ? data.bookings.filter(booking => ["pending", "requested"].includes(String(booking.status || "").toLowerCase())).length : null;
  const activeLeads = counts ? counts.new + counts.contacted + counts.quoted : null;
  const scheduledValue = data.bookings ? upcoming.filter(booking => !["pending", "requested"].includes(String(booking.status || "").toLowerCase()))
    .reduce((total, booking) => total + Math.max(0, Number(booking.quotedPrice) || 0), 0) : null;
  const todayJobs = data.bookings ? upcoming.filter(booking => booking.preferredDate === asOf.today).length : null;
  const connections = [data.bookings, data.customers, data.received, data.unread, data.activity].filter(value => value !== null).length;
  const selected = areas.find(area => area.id === active) || areas[0];
  const recentContact = data.activity?.filter(event => ["message", "quote", "call"].includes(event.kind)).slice(0, 4) || [];
  const days = Array.from({ length: 7 }, (_, index) => {
    const [year, month, day] = asOf.today.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + index, 12));
    const iso = date.toISOString().slice(0, 10);
    return { iso, name: date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short" }), count: upcoming.filter(booking => booking.preferredDate === iso).length };
  });
  const busiestDay = Math.max(1, ...days.map(day => day.count));
  const monthLabel = data.month ? new Date(data.month + "-01T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "long" }) : "This month";

  return <main className="min-h-screen bg-[#121210] px-3 pb-16 pt-6 text-[#f4eee4] sm:px-6 sm:pt-9 xl:px-8">
    <div className="mx-auto max-w-[1460px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-[7px] w-[7px] rounded-full bg-[#d6b779] shadow-[0_0_14px_#d6b77970]"/>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d8bc84]">Car Dash Detailing / Business OS</p>
          </div>
          <h1 className="mt-3 text-[29px] font-semibold leading-[1.06] tracking-[-.055em] sm:text-[43px]">Your entire operation.<br/><span className="text-[#d6b779]">One command center.</span></h1>
          <p className="mt-3 max-w-[580px] text-xs leading-6 text-[#aca497] sm:text-sm">Run your detailing business from one place. Your existing customers, bookings, messages and financial records stay connected.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={loading} onClick={() => void load()} className="rounded-xl border border-white/15 bg-[#292720] px-4 py-3 text-xs font-semibold text-[#ebdfc9] transition hover:border-[#d6b779]/50 disabled:opacity-50"> {loading ? "Loading..." : "Refresh"} </button>
          <Link href="/owner/bookings?create=1" className="inline-flex items-center gap-1.5 rounded-xl bg-[#d6b779] px-4 py-3 text-xs font-bold text-[#191713] hover:bg-[#ecd39c]"><OwnerAppIcon name="plus" className="h-4 w-4"/> New booking</Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#aaa094]">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#23211c] px-3 py-1.5">
          <span className={"h-1.5 w-1.5 rounded-full " + (connections === 5 ? "bg-[#7eb69b]" : "bg-[#d6b779]")}/>
          {loading && !updated ? "Loading live records" : connections === 5 ? "All 5 sources connected" : connections + " of 5 live sources available"}
        </span>
        {updated && <span>Updated {updated} CT</span>}
        {connections < 5 && !loading && <span className="text-[#d5ad77]">Some live data is unavailable. Your original tools still work.</span>}
      </div>

      <section aria-label="Live business metrics" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <LiveMetric label="Active leads" value={activeLeads === null ? "—" : String(activeLeads)} note="New, contacted and quoted" icon="users" href="/owner/leads"/>
        <LiveMetric label="Needs confirmation" value={pending === null ? "—" : String(pending)} note="Pending booking requests" icon="calendar" href="/owner/bookings"/>
        <LiveMetric label="Unread texts" value={data.unread === null ? "—" : String(data.unread)} note="Customer SMS inbox" icon="message" href="/owner/messages"/>
        <LiveMetric label="Payments received" value={data.received === null ? "—" : money(data.received)} note={monthLabel + " · recorded invoices"} icon="receipt" href="/owner/revenue"/>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a9997e]">Explore the business</p><h2 className="mt-1 text-base font-semibold sm:text-lg">Four connected areas</h2></div>
        <p className="hidden text-[11px] text-[#9b9184] sm:block">Select an area to open its live workspace</p>
      </div>

      <nav aria-label="Command center areas" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {areas.map(area => <button key={area.id} type="button" onClick={() => setActive(area.id)} aria-pressed={active === area.id}
          className={"relative min-w-0 overflow-hidden rounded-[20px] border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b779] sm:min-h-[156px] sm:p-5 " + (active === area.id ? area.active : "border-white/10 bg-[#201f1c] hover:border-white/25")}>
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full border border-white/[.045]"/>
          <div className="pointer-events-none absolute -right-1 top-3 h-20 w-20 rounded-full border border-white/[.055]"/>
          <div className="flex items-center justify-between gap-2">
            <span className={"text-[10px] font-bold tracking-[.18em] " + area.color}>AREA {area.number}</span>
            <OwnerAppIcon name={area.icon} className={"h-5 w-5 " + area.color}/>
          </div>
          <h3 className="relative mt-6 text-[13px] font-semibold leading-5 tracking-[-.02em] text-[#f2eadd] sm:text-lg">{area.title}</h3>
          <p className="relative mt-1 text-[10px] leading-4 text-[#aea496] sm:text-[11px]">{area.description}</p>
          <div className={"absolute inset-x-4 bottom-0 h-[2px] " + (active === area.id ? "bg-[#d6b779]" : "bg-transparent")}/>
        </button>)}
      </nav>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_285px]">
        <section aria-label={selected.title} className="min-w-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#1d1c19]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[.08] bg-[#23211d] p-5 sm:p-7">
            <div>
              <p className={"text-[10px] font-bold uppercase tracking-[.21em] " + selected.color}>AREA {selected.number} / CAR DASH</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] sm:text-[30px]">{selected.title}</h2>
              <p className="mt-2 text-xs leading-5 text-[#b3a99b]">{selected.description}</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-black/10"><OwnerAppIcon name={selected.icon} className={"h-6 w-6 " + selected.color}/></span>
          </div>

          <div className="p-4 sm:p-6">
            {active === "grow" && <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-base font-semibold">Customer pipeline</h3><p className="mt-1 text-xs text-[#aaa092]">Stages from your actual CRM</p></div>
                <Link href="/owner/leads" className="text-xs font-semibold text-[#e8ce9a] hover:underline">Manage leads</Link>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {([["New", counts?.new], ["Contacted", counts?.contacted], ["Quoted", counts?.quoted], ["Customers", counts?.customers]] as Array<[string, number | undefined]>).map(([label, count], index) =>
                  <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-[#292720] px-2 py-3 text-center sm:py-4">
                    <p className={"text-2xl font-semibold tabular-nums tracking-[-.05em] " + (index === 3 ? "text-[#8cc5a6]" : "text-[#e9cc95]")}>{count === undefined ? "—" : count}</p>
                    <p className="mt-1 text-[9px] text-[#afa595] sm:text-[11px]">{label}</p>
                  </div>)}
              </div>
              <p className="mt-4 text-[11px] leading-5 text-[#9f9687]">Pipeline counts include customers represented in your CRM. They are not advertising conversion or website traffic statistics.</p>
            </>}
            {active === "connect" && <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-base font-semibold">Customer activity</h3><p className="mt-1 text-xs text-[#aaa092]">Recent SMS, quotes and missed calls</p></div>
                <Link href="/owner/messages" className="text-xs font-semibold text-[#e9b2af] hover:underline">Open inbox</Link>
              </div>
              <div className="mt-4 space-y-2">
                {recentContact.length ? recentContact.map(event => <Link key={event.id} href={event.href} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#292720] p-3.5 transition hover:border-[#d88f8d]/40">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#d88f8d]/20 bg-[#d88f8d]/10 text-[#eab7b4]"><OwnerAppIcon name={event.kind === "call" ? "phone" : event.kind === "quote" ? "quote" : "message"} className="h-[18px] w-[18px]"/></span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{event.kind === "call" ? "Missed call" : event.kind === "quote" ? "New quote activity" : "Customer message"}</span><span className="mt-1 block text-[10px] text-[#a99f93]">Open the conversation to see details</span></span>
                  <time className="shrink-0 text-[10px] text-[#b6a999]">{relativeTime(event.time)}</time>
                </Link>) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-xs text-[#a89d91]">{data.activity === null ? "Customer activity is unavailable right now." : "No recent customer messages, quotes or missed calls."}</p>}
              </div>
              <p className="mt-3 text-[11px] text-[#9f9687]">Customer names and phone numbers are hidden in this overview. View them inside your secured inbox.</p>
            </>}
            {active === "manage" && <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-base font-semibold">Next seven days</h3><p className="mt-1 text-xs text-[#aaa092]">Jobs listed on your booking calendar</p></div>
                <Link href="/owner/schedule" className="text-xs font-semibold text-[#aad3c5] hover:underline">Open calendar</Link>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {days.map(day => <div key={day.iso} className="flex min-w-0 flex-col items-center rounded-xl border border-white/[.08] bg-[#292720] px-1 pb-2 pt-3" title={dateLabel(day.iso) + ": " + day.count + " bookings"}>
                  <span className="text-[9px] font-semibold text-[#b2a697]">{day.name}</span>
                  <div className="mt-2 flex h-12 w-full items-end justify-center"><div className="w-4 max-w-full rounded-t bg-[#82b8a5]" style={{ height: Math.max(3, day.count / busiestDay * 46) + "px", opacity: day.count ? 1 : 0.22 }}/></div>
                  <span className="mt-1 text-[11px] font-semibold tabular-nums text-[#e4ddd0]">{data.bookings === null ? "—" : day.count}</span>
                </div>)}
              </div>
              <h4 className="mt-6 text-sm font-semibold">Upcoming bookings</h4>
              <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#292720]">
                {upcoming.slice(0, 4).map(booking => <Link key={booking.id} href="/owner/bookings" className="flex items-center gap-3 p-3.5 transition hover:bg-white/[.04]">
                  <span className="w-[70px] shrink-0 text-[10px] font-semibold text-[#b1d4c3]">{dateLabel(String(booking.preferredDate))}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{booking.serviceName || "Detailing appointment"}</span><span className="mt-1 block truncate text-[10px] text-[#a99f93]">{[booking.vehicleYear, booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(" ") || "Vehicle not specified"} · {String(booking.status || "pending")}</span></span>
                  <span className="shrink-0 text-[10px] text-[#d6c2a2]">{timeLabel(booking.preferredTime)}</span>
                </Link>)}
                {!upcoming.length && <p className="p-5 text-xs text-[#a89d91]">{data.bookings === null ? "Upcoming appointments are unavailable right now." : "No upcoming bookings on the calendar."}</p>}
              </div>
            </>}
            {active === "paid" && <>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#a997d2]/25 bg-[#a997d2]/[.07] p-5">
                  <p className="text-[11px] text-[#c4b8d6]">{monthLabel} collected</p>
                  <p className="mt-3 text-[33px] font-semibold tracking-[-.05em] text-[#eee7f9]">{data.received === null ? "—" : money(data.received)}</p>
                  <p className="mt-2 text-[10px] leading-4 text-[#b7afc3]">Recorded payments on valid invoices, not estimated revenue</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#292720] p-5">
                  <p className="text-[11px] text-[#c2b7a8]">Upcoming confirmed booking value</p>
                  <p className="mt-3 text-[33px] font-semibold tracking-[-.05em] text-[#f0dfba]">{scheduledValue === null ? "—" : money(scheduledValue)}</p>
                  <p className="mt-2 text-[10px] leading-4 text-[#aaa092]">Quoted value only; not paid, deposited or guaranteed</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#292720] p-4">
                <div><p className="text-sm font-semibold">Keep your collections organized</p><p className="mt-1 text-[11px] leading-5 text-[#b2a697]">Review invoices and record customer payments in the existing system.</p></div>
                <Link href="/owner/invoices" className="shrink-0 rounded-lg bg-[#d6b779] px-3 py-2.5 text-[11px] font-bold text-[#161412]">Open invoices</Link>
              </div>
            </>}

            <div className="mt-7 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Tools in this area</h3><span className="text-[10px] text-[#a69b8d]">Connected to Car Dash</span></div>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {areaLinks[active].map(item => <AreaShortcut key={item.href + item.title} item={item}/>)}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4" aria-label="At a glance">
          <section className="overflow-hidden rounded-[20px] border border-white/10 bg-[#201e1a]">
            <div className="border-b border-white/10 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#d6b779]">Action queue</p>
              <h3 className="mt-1 text-base font-semibold">Needs your attention</h3>
            </div>
            <div className="space-y-2 p-3">
              <Link href="/owner/bookings" className="flex items-center justify-between rounded-xl bg-[#2c2923] px-3 py-3 text-xs hover:bg-[#383127]"><span>Confirm requests</span><strong className="text-[#e3c58e]">{pending === null ? "—" : pending}</strong></Link>
              <Link href="/owner/messages" className="flex items-center justify-between rounded-xl bg-[#2c2923] px-3 py-3 text-xs hover:bg-[#383127]"><span>Unread conversations</span><strong className="text-[#e3c58e]">{data.unread === null ? "—" : data.unread}</strong></Link>
              <Link href="/owner/schedule" className="flex items-center justify-between rounded-xl bg-[#2c2923] px-3 py-3 text-xs hover:bg-[#383127]"><span>Jobs today</span><strong className="text-[#e3c58e]">{todayJobs === null ? "—" : todayJobs}</strong></Link>
            </div>
          </section>
          <section className="rounded-[20px] border border-white/10 bg-[#201e1a] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#d6b779]">Quick launch</p>
            <div className="mt-3 space-y-2">
              {([
                { text: "Schedule a detail", href: "/owner/bookings?create=1", icon: "plus" as OwnerIconName },
                { text: "Send a quote", href: "/owner/quotes", icon: "quote" as OwnerIconName },
                { text: "View appointments", href: "/owner/schedule", icon: "calendar" as OwnerIconName },
                { text: "Record a payment", href: "/owner/invoices", icon: "receipt" as OwnerIconName },
              ]).map(item => <Link key={item.text} href={item.href} className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-xs text-[#ded4c4] hover:bg-white/[.055]"><OwnerAppIcon name={item.icon} className="h-4 w-4 text-[#d6b779]"/>{item.text}<OwnerAppIcon name="chevron-right" className="ml-auto h-3.5 w-3.5 text-[#988d7c]"/></Link>)}
            </div>
          </section>
          <p className="px-1 text-[10px] leading-5 text-[#978d7f]">Live overview only. Editing, texting, calls, scheduling and payments continue in their existing Car Dash tools. No simulated business data is shown.</p>
        </aside>
      </div>
    </div>
  </main>;
}
