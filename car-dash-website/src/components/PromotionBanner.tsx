"use client";
import { useEffect, useState } from "react";
import { DEFAULT_PROMOTIONS, parsePromotions, type PromotionSettings } from "@/lib/promotions";
export default function PromotionBanner(){
 const [data,setData]=useState<PromotionSettings>(DEFAULT_PROMOTIONS);
 useEffect(()=>{let cancelled=false;fetch("/api/promotions",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>{if(!cancelled && v)setData(parsePromotions(JSON.stringify(v)));}).catch(()=>{});return()=>{cancelled=true};},[]);
 if(!data.bannerEnabled || !data.bannerText.trim())return null;
 return <a href={data.bannerLink} className="block bg-[#a52d30] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[.13em] text-white transition-colors hover:bg-[#8b2326] sm:text-xs">{data.bannerText} <span aria-hidden="true" className="ml-2">→</span></a>;
}
