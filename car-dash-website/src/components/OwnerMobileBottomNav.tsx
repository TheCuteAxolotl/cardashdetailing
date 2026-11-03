"use client";

import { usePathname } from "next/navigation";
import OwnerAppIcon, { type OwnerIconName } from "@/components/OwnerAppIcon";

type Tab = {label:string;href:string;icon:OwnerIconName;matches:string[]};
const tabs:Tab[]=[
 {label:"Today",href:"/owner/dashboard",icon:"activity",matches:["/owner/dashboard"]},
 {label:"Calendar",href:"/owner/schedule",icon:"calendar",matches:["/owner/schedule"]},
 {label:"Routes",href:"/owner/dashboard#today-route",icon:"map-pin",matches:[]},
 {label:"SMS",href:"/owner/messages",icon:"message",matches:["/owner/messages"]},
 {label:"Customers",href:"/owner/crm",icon:"users",matches:["/owner/crm"]},
];

/** Mounted once by OwnerShell so tabs remain present on every signed-in owner page. */
export default function OwnerMobileBottomNav(){
 const pathname=usePathname();
 return <nav aria-label="Mobile owner navigation"
   className="owner-mobile-bottom-nav fixed inset-x-0 bottom-0 z-[55] border-t border-[#d6b779]/20 bg-[#181817]/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,.45)] backdrop-blur-2xl md:hidden"
   style={{paddingBottom:"max(10px, env(safe-area-inset-bottom))"}}>
   <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5">
    {tabs.map(tab=>{
      const active=tab.matches.some(prefix=>pathname===prefix||pathname.startsWith(prefix+"/"));
      const href=tab.label==="Routes"&&pathname==="/owner/dashboard"?"#today-route":tab.href;
      return <a key={tab.label} href={href} aria-current={active?"page":undefined}
        className={"flex min-h-[53px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b779] "+
          (active?"bg-[#d6b779]/10 text-[#e6c98f]":"text-[#ada293] hover:bg-white/5 hover:text-[#e7d6b6]")}>
        <OwnerAppIcon name={tab.icon} className="h-5 w-5"/>
        <span className="text-[10px] font-semibold">{tab.label}</span>
      </a>;
    })}
   </div>
 </nav>;
}
