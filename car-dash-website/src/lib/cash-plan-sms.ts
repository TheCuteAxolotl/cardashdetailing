import {syncPlanBookings} from "@/lib/cash-bookings";
import {prisma} from "@/lib/prisma";
import {sendCustomerSmsWithHistory} from "@/lib/customer-sms-history";
import {bookingPhoneWasReleased} from "@/lib/phone-release";
import {chicagoDay,nextService,prettyDay,type CashPlan} from "@/lib/cash-maintenance";
export const cashPrefix="owner:cash-maintenance:";
type Kind="activation"|"reminder";
export function smsKey(plan:CashPlan,kind:Kind,date:string){
  return "owner:cash-sms:"+plan.id+":"+kind+":"+(kind==="activation"?plan.schedule?.enabledAt:date);
}
export async function notifyPlan(plan:CashPlan,kind:Kind,date:string){
  const schedule=plan.schedule;
  if(plan.ended||!schedule)return "off";
  const key=smsKey(plan,kind,date);
  const existing=await prisma.siteContent.findUnique({where:{key}});
  if(existing){
    if(!existing.value.startsWith("retry:")||Number(existing.value.slice(6))>Date.now())return existing.value;
    const claim=await prisma.siteContent.updateMany({where:{key,value:existing.value},data:{value:"sending"}});
    if(!claim.count)return "sending";
  }else{
    try{await prisma.siteContent.create({data:{key,value:"sending"}})}
    catch(e){if(e&&typeof e==="object"&&"code" in e&&e.code==="P2002")return "sending";throw e}
  }
  const row=await prisma.siteContent.findUnique({where:{key:cashPrefix+plan.id}});
  const current:CashPlan|undefined=row&&JSON.parse(row.value);
  if(!current||current.ended||current.schedule?.enabledAt!==schedule.enabledAt||await bookingPhoneWasReleased(schedule.phone,schedule.enabledAt)){
    await prisma.siteContent.update({where:{key},data:{value:"suppressed"}});return "suppressed";
  }
  const amount=(plan.cents/100).toLocaleString("en-US",{style:"currency",currency:"USD"});
  const body=kind==="activation"
    ? "Hi "+plan.customer+", your Car Dash Detailing monthly plan is active at "+amount+" per month, payable in cash. Your next detail is "+prettyDay(date)+"."
    : "Hi "+plan.customer+", a reminder from Car Dash Detailing: your monthly detail is "+prettyDay(date)+". Your plan is "+amount+" per month, payable in cash.";
  const result=await sendCustomerSmsWithHistory({to:schedule.phone,body});
  const value=result.sent&&result.sid?"sent:"+result.sid:"retry:"+String(Date.now()+3600000);
  await prisma.siteContent.update({where:{key},data:{value}});
  return value;
}
export async function runCashNotifications(){
  const today=chicagoDay();
  const hour=Number(new Intl.DateTimeFormat("en-US",{hour:"2-digit",hourCycle:"h23",timeZone:"America/Chicago"}).format(new Date()));
  if(hour<9||hour>=19)return {checked:0};
  const rows=await prisma.siteContent.findMany({where:{key:{startsWith:cashPrefix}}});
  let failed=0;
  for(const row of rows){
    const plan:CashPlan=JSON.parse(row.value);if(!plan.schedule)continue;
    try{
      await syncPlanBookings(plan.id);
      if(plan.ended)continue;
      const date=nextService(plan.schedule,today);
      const activation=await notifyPlan(plan,"activation",date);
      const days=Math.round((Date.parse(date)-Date.parse(today))/86400000);
      if(activation.startsWith("sent:")&&days>=1&&days<=plan.schedule.lead){
        await notifyPlan(plan,"reminder",date);
      }
    }catch{failed++}
  }
  return {checked:rows.length,failed};
}