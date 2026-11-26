"use client";
import { useState } from "react";
import { GOOGLE_REVIEW_URL, useGoogleReviews } from "@/lib/use-google-reviews";

function Stars({rating}:{rating:number}) {
 const n=Math.max(0,Math.min(5,Math.round(rating)));
 return <span role="img" aria-label={rating+" out of 5 stars"} className="whitespace-nowrap tracking-wider text-[#d6b779]">{"★".repeat(n)}<span className="opacity-40">{"☆".repeat(5-n)}</span></span>;
}
function Laurel({flip=false}:{flip?:boolean}) {
 return <svg aria-hidden="true" viewBox="0 0 40 90" className="h-20 w-9 shrink-0 text-[#d6b779]" style={{transform:flip?"scaleX(-1)":undefined}}><path d="M35 85 Q-12 55 29 5" fill="none" stroke="currentColor" strokeWidth="1.5"/>{Array.from({length:7},(_,i)=><g key={i} transform={`translate(${i<3?25-i*7:5+(i-3)*5} ${79-i*11})`} fill="currentColor"><ellipse rx="4" ry="9" transform="rotate(-45) translate(-5 -5)"/><ellipse rx="3.5" ry="8" transform="rotate(40) translate(5 -5)"/></g>)}</svg>;
}
export default function ReviewCards() {
 const {data,loading}=useGoogleReviews();
 const [limit,setLimit]=useState(3);
 if(loading) return <p role="status">Loading Google reviews…</p>;
 if(!data) return <div><p>Google reviews are temporarily unavailable.</p><a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className="underline">Open Google reviews</a></div>;
 const reviews=Array.from(new Map(data.reviews.map(r=>[r.id,r])).values()).sort((a,b)=>(Date.parse(b.publishTime||"")||0)-(Date.parse(a.publishTime||"")||0));
 const complete=data.reviewCount!==null && data.reviewCount===reviews.length;
 return <section aria-label="Google reviews" className="mx-auto max-w-3xl rounded-2xl bg-[#191919] p-5 text-[#f5f4f1] sm:p-8">
 <div className="flex flex-wrap items-center justify-around gap-5 rounded-2xl border border-white/15 p-5">
 <div className="flex items-center gap-2"><Laurel/><div className="text-center">{data.rating!==null&&<><p className="text-4xl font-semibold tabular-nums">{data.rating.toFixed(1)}</p><Stars rating={data.rating}/></>}<p className="mt-1 text-sm">{data.reviewCount!==null?data.reviewCount+" reviews":"Google reviews"}</p></div><Laurel flip/></div>
 <a href={data.reviewUrl||GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold hover:bg-white/10">Write a review</a>
 </div>
 {reviews.length>0&&<div className="my-8 space-y-3">{!complete&&<p className="text-xs text-white/60">Rating breakdown of {reviews.length} available reviews</p>}{[5,4,3,2,1].map(r=>{const count=reviews.filter(v=>v.rating===r).length;return <div key={r} className="flex items-center gap-3 text-sm"><Stars rating={r}/><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d6b779]" style={{width:100*count/reviews.length+"%"}}/></div><span className="w-7 text-right tabular-nums">{count}</span></div>})}</div>}
 <div className="divide-y divide-white/10">{reviews.slice(0,limit).map(r=><article key={r.id} className="py-6"><p className="font-semibold">{r.authorProfileUrl?<a href={r.authorProfileUrl} target="_blank" rel="noreferrer">{r.author}</a>:r.author}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><Stars rating={r.rating}/>{r.relativeTime&&<span>· {r.relativeTime}</span>}<a href={r.googleMapsUri} target="_blank" rel="noreferrer" className="text-white/60">· from Google</a></div>{r.text&&<p className="mt-4 whitespace-pre-wrap break-words leading-relaxed">{r.text}</p>}</article>)}</div>
 {!reviews.length&&<p className="py-6">Read customer reviews directly on Google.</p>}
 <div className="mt-4 flex flex-wrap gap-4">{limit<reviews.length&&<button type="button" onClick={()=>setLimit(n=>n+5)} className="rounded-full border border-white/25 px-5 py-3 text-sm">Load more reviews</button>}<a href={data.googleMapsUri||GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/25 px-5 py-3 text-sm">View all on Google Maps</a></div>
 </section>;
}
