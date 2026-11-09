import {syncPlanBookings} from "@/lib/cash-bookings";
import {NextRequest, NextResponse} from "next/server";
import {getCurrentAccountFromRequest, hasStaffPermission} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";
import {nextCashDue,chicagoDay,type CashPlan} from "@/lib/cash-maintenance";
import {normalizePhoneNumber} from "@/lib/twilio-sms";
import {nextService,type ServiceSchedule} from "@/lib/cash-maintenance";
import {notifyPlan,smsKey} from "@/lib/cash-plan-sms";
function readSchedule(raw:Record<string,unknown>):ServiceSchedule|null {
  const phone=normalizePhoneNumber(String(raw.phone||""));
  const ordinal=Number(raw.ordinal),weekday=Number(raw.weekday),lead=Number(raw.lead);
  if(!phone||raw.consent!==true||!Number.isInteger(ordinal)||ordinal<1||ordinal>5||!Number.isInteger(weekday)||weekday<0||weekday>6||![1,2].includes(lead)||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(String(raw.startMonth)))return null;
  const make=String(raw.make||"").trim().slice(0,80),model=String(raw.model||"").trim().slice(0,80),year=String(raw.year||"").trim();
  if(!make||!model||!/^\d{4}$/.test(year))return null;
  return {make,model,year,phone,ordinal,weekday,lead,startMonth:String(raw.startMonth),enabledAt:new Date().toISOString()};
}
async function activate(plan:CashPlan){
  await syncPlanBookings(plan.id,true);
  if(!plan.schedule||plan.ended)return reply({ok:true});
  try{
    const state=await notifyPlan(plan,"activation",nextService(plan.schedule,chicagoDay()));
    return reply({ok:true,message:state.startsWith("sent:")?"Plan saved. Activation text sent.":state==="suppressed"?"Plan saved. This phone is blocked for texts.":"Plan saved. Activation text is pending."});
  }catch{return reply({ok:true,message:"Plan saved. Activation text has not been confirmed."})}
}
const prefix="owner:cash-maintenance:";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:NextRequest){
  if(!hasStaffPermission(await getCurrentAccountFromRequest(request),"maintenance"))return reply({error:"Maintenance access required."},403);
  const rows=await prisma.siteContent.findMany({where:{key:{startsWith:prefix}},orderBy:{updatedAt:"desc"}});
  const plans=await Promise.all(rows.map(async row=>{
    const plan:CashPlan=JSON.parse(row.value);
    if(!plan.schedule)return plan;
    const log=await prisma.siteContent.findUnique({where:{key:smsKey(plan,"activation","")},select:{value:true}});
    return {...plan,activationStatus:log?.value.startsWith("sent:")?"Sent":log?.value==="suppressed"?"Blocked":log?.value==="sending"?"Awaiting confirmation":"Pending"};
  }));
  return reply({plans});
}
function validDate(date:unknown){return typeof date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date}
export async function POST(request:NextRequest){
  const account=await getCurrentAccountFromRequest(request);
  if(!account||!hasStaffPermission(account,"maintenance"))return reply({error:"Maintenance access required."},403);
  if(request.headers.get("sec-fetch-site")==="cross-site")return reply({error:"Invalid origin."},403);
  const b=await request.json().catch(()=>null);
  if(!b||typeof b.id!=="string"||!/^[-a-f0-9]{36}$/i.test(b.id))return reply({error:"Invalid plan ID."},400);
  const key=prefix+b.id;
  if(b.action==="create"){
    const schedule=b.schedule?readSchedule(b.schedule):null;
    if(b.schedule&&!schedule)return reply({error:"Check the recurring schedule, phone number and text permission."},400);
    if(schedule)b.firstDue=nextService(schedule,chicagoDay());
    if(typeof b.customer!=="string"||!b.customer.trim()||b.customer.length>120||!Number.isSafeInteger(b.cents)||b.cents<1||b.cents>1000000||!validDate(b.firstDue))return reply({error:"Check the customer, monthly amount and first due date."},400);
    const plan:CashPlan={id:b.id,customer:b.customer.trim(),cents:b.cents,firstDue:b.firstDue,ended:false,payments:[],...(schedule?{schedule}:{})};
    const saved=await prisma.siteContent.upsert({where:{key},create:{key,value:JSON.stringify(plan)},update:{}});
    return activate(JSON.parse(saved.value));
  }
  const row=await prisma.siteContent.findUnique({where:{key}});
  if(!row)return reply({error:"Plan not found."},404);
  const plan:CashPlan=JSON.parse(row.value);
  if(b.action==="schedule"){
    const schedule=b.schedule&&readSchedule(b.schedule);
    if(!schedule||plan.ended)return reply({error:"An active plan and valid recurring schedule are required."},400);
    if(!plan.schedule||["ordinal","weekday","lead","phone","startMonth","make","model","year"].some(key=>schedule[key as keyof ServiceSchedule]!==plan.schedule?.[key as keyof ServiceSchedule]))plan.schedule=schedule;
  }else if(b.action==="end")plan.ended=true;
  else if(b.action==="receive"){
    if(plan.payments.some(p=>p.month===b.month))return reply({ok:true});
    if(plan.ended||b.month!==nextCashDue(plan).slice(0,7)||!validDate(b.received)||b.received>chicagoDay())return reply({error:"Check the billing month and cash received date."},400);
    plan.payments.push({month:b.month,received:b.received,cents:plan.cents,staffId:account.id});
  }else return reply({error:"Unknown action."},400);
  const update=await prisma.siteContent.updateMany({where:{key,value:row.value},data:{value:JSON.stringify(plan)}});
  return update.count?((b.action==="schedule"||b.action==="end")?activate(plan):reply({ok:true})):reply({error:"Plan changed. Refresh and try again."},409);
}