"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import OwnerAppIcon, { type OwnerIconName } from "@/components/OwnerAppIcon";

type Tab={label:string;href:string;icon:OwnerIconName;permission?:string};
const CHOICES:Tab[]=[
  {label:"Jobs",href:"/owner/jobs",icon:"calendar",permission:"assignedJobs"},
  {label:"Bookings",href:"/admin/bookings",icon:"receipt",permission:"bookings"},
  {label:"SMS",href:"/admin/messages",icon:"message",permission:"smsInbox"},
  {label:"Quotes",href:"/admin/quotes",icon:"quote",permission:"quoteChats"},
  {label:"Support",href:"/admin/support",icon:"support",permission:"support"},
  {label:"Calls",href:"/owner/calls",icon:"phone",permission:"businessPhone"},
  {label:"Media",href:"/owner/gallery",icon:"globe",permission:"gallery"},
  {label:"Analytics",href:"/owner/analytics",icon:"chart",permission:"analytics"},
];

export default function StaffMobileBottomNav({
 permissions,onOpenMenu,
}:{
 permissions:string[];onOpenMenu:()=>void;
}){
 const pathname=usePathname();
 const allowed=CHOICES.filter(item=>!item.permission||permissions.includes(item.permission));
 const tabs=[{label:"Today",href:"/admin/dashboard",icon:"activity" as OwnerIconName},...allowed.slice(0,3)];
 return <nav aria-label="Staff mobile navigation"
    className="owner-mobile-bottom-nav staff-mobile-bottom-nav fixed inset-x-0 bottom-0 z-[55] border-t border-[#d6b779]/20 bg-[#181817]/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,.45)] backdrop-blur-2xl md:hidden"
    style={{paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5">
      {tabs.map(tab=>{
        const active=pathname===tab.href||pathname.startsWith(tab.href+"/");
        return <Link key={tab.href} href={tab.href} aria-current={active?"page":undefined}
          className={"flex min-h-[53px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center transition "+
            (active?"bg-[#d6b779]/10 text-[#e6c98f]":"text-[#ada293] hover:bg-white/5 hover:text-[#e7d6b6]")}>
          <OwnerAppIcon name={tab.icon} className="h-5 w-5"/>
          <span className="text-[10px] font-semibold">{tab.label}</span>
        </Link>;
      })}
      <button type="button" onClick={onOpenMenu} aria-label="Open all permitted staff tools"
        className="flex min-h-[53px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[#ada293] hover:bg-white/5 hover:text-[#e7d6b6]">
        <OwnerAppIcon name="menu" className="h-5 w-5"/>
        <span className="text-[10px] font-semibold">More</span>
      </button>
    </div>
  </nav>;
}
