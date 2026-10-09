"use client";
import { useEffect, useState } from "react";
type Campaign={id:string;title:string;bookings:number;bookingValue:number;savings:number;completedBookings:number;completedBookingValue:number};
type Report={rangeDays:number;scannedBookings:number;limited:boolean;discountedBookings:number;discountedBookingValue:number;totalSavings:number;completedDiscountedBookings:number;completedDiscountedValue:number;campaigns:Campaign[]};
const usd=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
export default function PromotionAnalytics(){
 const [range,setRange]=useState("30");
 const [report,setReport]=useState<Report|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let cancelled=false;setLoading(true);setError("");fetch("/api/promotions/analytics?range="+range,{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Unable to load report");return data;}).then(data=>{if(!cancelled)setReport(data);}).catch(e=>{if(!cancelled)setError(String(e.message||e));}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true};},[range]);
 const cards=report?[["Bookings with automatic sales",String(report.discountedBookings)],["Discounted booking value",usd(report.discountedBookingValue)],["Discounts granted",usd(report.totalSavings)],["Completed booking value*",usd(report.completedDiscountedValue)]]:[];
 return <main className="min-h-screen bg-[#080808] px-5 py-10 text-white sm:px-8"><div className="mx-auto max-w-6xl">
 <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#6EAEC6]">Owner · Promotions</p><h1 className="mt-2 text-4xl font-semibold">Promotions Analytics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Measure how many booking requests use automatic sales, their booking value, and customer savings.</p></div><a className="rounded-full border border-white/15 px-5 py-3" href="/owner/promotions">Back to promotions</a></div>
 <div className="mt-8 flex flex-wrap gap-2">{["7","30","90","365"].map(d=><button key={d} onClick={()=>setRange(d)} className={`rounded-full px-5 py-2 text-sm ${range===d?"bg-[#6EAEC6] font-bold text-[#0B1822]":"border border-white/15 text-white/70"}`}>{d} days</button>)}</div>
 {error&&<p role="alert" className="mt-5 text-red-300">{error}</p>}
 {loading&&<p className="mt-6 text-white/50">Loading booking data...</p>}
 {report&&!loading&&<><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-xs text-white/50">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}</div>
 <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[.03]"><div className="border-b border-white/10 p-5"><h2 className="text-xl font-semibold">Campaign breakdown</h2><p className="mt-2 text-sm text-white/40">Only bookings with a recorded automatic promotion are counted.</p></div>
 <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-white/5 text-white/50"><tr><th className="p-4">Campaign</th><th className="p-4">Bookings</th><th className="p-4">Booking value</th><th className="p-4">Savings</th><th className="p-4">Completed</th></tr></thead><tbody>{report.campaigns.length?report.campaigns.map(c=><tr key={c.id} className="border-t border-white/10"><td className="p-4 font-medium">{c.title}</td><td className="p-4">{c.bookings}</td><td className="p-4">{usd(c.bookingValue)}</td><td className="p-4">{usd(c.savings)}</td><td className="p-4">{c.completedBookings}</td></tr>):<tr><td className="p-6 text-white/50" colSpan={5}>No tracked automatic-sale bookings in this period.</td></tr>}</tbody></table></div></section>
 <p className="mt-5 max-w-4xl text-xs leading-6 text-white/40">*Completed means the booking status is marked completed; it does not verify payment collection. Booking value is not cash revenue or profit. Canceled and pending bookings remain in booking-request totals. Tracking starts when campaign details are stored in booking notes; older bookings without promotion attribution may appear as “Unattributed promotion.” {report.limited?"Only the latest 5,000 bookings were scanned.":""}</p>
 </>}
 </div></main>;
}
