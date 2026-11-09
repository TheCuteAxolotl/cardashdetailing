import {NextRequest, NextResponse} from "next/server";
import {getCurrentAccountFromRequest, hasStaffPermission} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";
import {nextCashDue,chicagoDay,type CashPlan} from "@/lib/cash-maintenance";
const prefix="owner:cash-maintenance:";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:NextRequest){
  if(!hasStaffPermission(await getCurrentAccountFromRequest(request),"maintenance"))return reply({error:"Maintenance access required."},403);
  const rows=await prisma.siteContent.findMany({where:{key:{startsWith:prefix}},orderBy:{updatedAt:"desc"}});
  return reply({plans:rows.map(row=>JSON.parse(row.value))});
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
    if(typeof b.customer!=="string"||!b.customer.trim()||b.customer.length>120||!Number.isSafeInteger(b.cents)||b.cents<1||b.cents>1000000||!validDate(b.firstDue))return reply({error:"Check the customer, monthly amount and first due date."},400);
    const plan:CashPlan={id:b.id,customer:b.customer.trim(),cents:b.cents,firstDue:b.firstDue,ended:false,payments:[]};
    await prisma.siteContent.upsert({where:{key},create:{key,value:JSON.stringify(plan)},update:{}});
    return reply({ok:true});
  }
  const row=await prisma.siteContent.findUnique({where:{key}});
  if(!row)return reply({error:"Plan not found."},404);
  const plan:CashPlan=JSON.parse(row.value);
  if(b.action==="end")plan.ended=true;
  else if(b.action==="receive"){
    if(plan.payments.some(p=>p.month===b.month))return reply({ok:true});
    if(plan.ended||b.month!==nextCashDue(plan).slice(0,7)||!validDate(b.received)||b.received>chicagoDay())return reply({error:"Check the billing month and cash received date."},400);
    plan.payments.push({month:b.month,received:b.received,cents:plan.cents,staffId:account.id});
  }else return reply({error:"Unknown action."},400);
  const update=await prisma.siteContent.updateMany({where:{key,value:row.value},data:{value:JSON.stringify(plan)}});
  return update.count?reply({ok:true}):reply({error:"Plan changed. Refresh and try again."},409);
}