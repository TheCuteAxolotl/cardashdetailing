"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import OwnerAppIcon, { type OwnerIconName } from "@/components/OwnerAppIcon";

type Tab={label:string;href:string;icon:OwnerIconName;match:string[]};
const tabs:Tab[]=[
 {label:"Home",href:"/owner/dashboard",icon:"activity",match:["/owner/dashboard"]},
 {label:"Jobs",href:"/owner/jobs",icon:"calendar",match:["/owner/jobs","/owner/inspection"]},
 {label:"Schedule",href:"/owner/schedule",icon:"calendar",match:["/owner/schedule","/owner/bookings"]},
 {label:"Chat",href:"/owner/messages",icon:"message",match:["/owner/messages","/owner/quotes"]},
 {label:"More",href:"/owner/workspace",icon:"menu",match:["/owner/workspace","/owner/crm","/owner/leads","/owner/revenue","/owner/inventory","/owner/detail-builder"]},
];
/** Keep the mobile CRM nav across all owner screens; desktop is unchanged. */
export default function OwnerMobileBottomNav({onOpenMenu,menuOpen=false}:{onOpenMenu:()=>void;menuOpen?:boolean}){
 const pathname=usePathname();
 return <nav aria-label="Car Dash mobile owner navigation" className="owner-mobile-bottom-nav fixed inset-x-0 bottom-0 z-[55] border-t border-[#d6b779]/20 bg-[#181817]/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,.45)] backdrop-blur-2xl md:hidden"
   style={{paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
   <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
     {tabs.map(tab=>{
       const active=tab.label==="More" ? menuOpen || !tabs.slice(0,4).some(t=>t.match.some(path=>pathname===path||pathname.startsWith(path+"/"))) : !menuOpen && tab.match.some(path=>pathname===path||pathname.startsWith(path+"/"));
       if(tab.label==="More") return <button key="More" type="button" onClick={onOpenMenu} aria-expanded={menuOpen} aria-haspopup="dialog"
         className={"flex min-h-[53px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-center "+(active?"bg-[#d6b779]/10 text-[#e6c98f]":"text-[#ada293]")}>
         <OwnerAppIcon name="menu" className="h-5 w-5"/><span className="text-[10px] font-semibold">More</span>
       </button>;
       return <Link key={tab.label} href={tab.href} aria-current={active?"page":undefined}
         className={"flex min-h-[53px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b779] "+
           (active?"bg-[#d6b779]/10 text-[#e6c98f]":"text-[#ada293] hover:bg-white/5 hover:text-[#e7d6b6]")}>
         <OwnerAppIcon name={tab.icon} className="h-5 w-5"/>
         <span className="text-[10px] font-semibold">{tab.label}</span>
       </Link>;
     })}
   </div>
 </nav>;
}
