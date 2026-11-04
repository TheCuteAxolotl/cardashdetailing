"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import OwnerAppIcon, {type OwnerIconName} from "@/components/OwnerAppIcon";

type Tab={label:string;href:string;icon:OwnerIconName;match:string[]};
export default function StaffMobileBottomNav({
 permissions,onOpenMenu,
}:{permissions:string[];onOpenMenu:()=>void}){
 const pathname=usePathname();
 const has=(value:string)=>permissions.includes(value);
 const jobsHref=has("assignedJobs")?"/owner/jobs":has("bookings")?"/admin/bookings":null;
 const chatHref=has("smsInbox")?"/admin/messages":has("quoteChats")?"/admin/quotes":has("support")?"/admin/support":null;
 const candidates:Tab[]=[
  {label:"Home",href:"/admin/dashboard",icon:"activity",match:["/admin/dashboard"]},
  ...(jobsHref?[{label:has("assignedJobs")?"Jobs":"Bookings",href:jobsHref,icon:"calendar" as OwnerIconName,match:["/owner/jobs","/owner/inspection","/admin/bookings"]}]:[]),
  ...(has("staffGuide")?[{label:"Team",href:"/admin/staff-guide",icon:"users" as OwnerIconName,match:["/admin/staff-guide"]}]:[]),
  ...(chatHref?[{label:"Chat",href:chatHref,icon:"message" as OwnerIconName,match:["/admin/messages","/admin/quotes","/admin/support"]}]:[]),
  {label:"Profile",href:"/admin/profile",icon:"users",match:["/admin/profile"]},
  {label:"Website",href:"/",icon:"globe",match:[]},
 ];
 const tabs=candidates.filter((tab,index,all)=>all.findIndex(x=>x.href===tab.href)===index).slice(0,4);
 return <nav aria-label="Staff mobile navigation" className="owner-mobile-bottom-nav staff-mobile-bottom-nav fixed inset-x-0 bottom-0 z-[55] border-t border-[#d6b779]/20 bg-[#181817]/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,.45)] backdrop-blur-2xl md:hidden"
   style={{paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
   <div className="mx-auto grid max-w-lg gap-0.5" style={{gridTemplateColumns:"repeat("+ (tabs.length+1) +",minmax(0,1fr))"}}>
     {tabs.map((tab,index)=>{
       const active=tab.match.some(prefix=>pathname===prefix||pathname.startsWith(prefix+"/"))
         ||(index===0&&pathname==="/admin/dashboard");
       return <Link key={index} href={tab.href} aria-current={active?"page":undefined}
         className={"flex min-h-[53px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center transition "+(active?"bg-[#d6b779]/10 text-[#e6c98f]":"text-[#ada293] hover:bg-white/5 hover:text-[#e7d6b6]")}>
         <OwnerAppIcon name={tab.icon} className="h-5 w-5"/><span className="text-[10px] font-semibold">{tab.label}</span>
       </Link>;
     })}
     <button type="button" onClick={onOpenMenu} aria-label="Open additional permitted tools"
       className="flex min-h-[53px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[#ada293] hover:bg-white/5 hover:text-[#e7d6b6]">
       <OwnerAppIcon name="menu" className="h-5 w-5"/><span className="text-[10px] font-semibold">More</span>
     </button>
   </div>
 </nav>;
}
