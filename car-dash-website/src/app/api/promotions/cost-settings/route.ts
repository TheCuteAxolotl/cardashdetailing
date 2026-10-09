import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";

const KEY="promotionCostAssumptions";
export type CostAssumptions={laborHourlyRate:number;laborHoursPerBooking:number;suppliesPercent:number;travelCostPerBooking:number;otherCostPerBooking:number};
export const DEFAULT_COSTS:CostAssumptions={laborHourlyRate:0,laborHoursPerBooking:0,suppliesPercent:0,travelCostPerBooking:0,otherCostPerBooking:0};
export function parseCosts(raw:string|null|undefined):CostAssumptions{
  try{
    const value=JSON.parse(raw||"{}");
    const n=(key:keyof CostAssumptions,max:number)=>{const x=Number(value[key]);return Number.isFinite(x)&&x>=0?Math.min(x,max):0};
    return {laborHourlyRate:n("laborHourlyRate",500),laborHoursPerBooking:n("laborHoursPerBooking",72),suppliesPercent:n("suppliesPercent",100),travelCostPerBooking:n("travelCostPerBooking",10000),otherCostPerBooking:n("otherCostPerBooking",10000)};
  }catch{return DEFAULT_COSTS;}
}
export async function GET(request:NextRequest){
  const user=await getCurrentAccountFromRequest(request);
  if(user?.role!=="owner")return NextResponse.json({error:"Owner only"},{status:403});
  const row=await prisma.siteContent.findUnique({where:{key:KEY}});
  return NextResponse.json({costs:parseCosts(row?.value),configured:!!row});
}
export async function PUT(request:NextRequest){
  const user=await getCurrentAccountFromRequest(request);
  if(user?.role!=="owner")return NextResponse.json({error:"Owner only"},{status:403});
  const body=await request.json();
  const costs=parseCosts(JSON.stringify(body));
  await prisma.siteContent.upsert({where:{key:KEY},create:{key:KEY,value:JSON.stringify(costs)},update:{value:JSON.stringify(costs)}});
  return NextResponse.json({costs,configured:true});
}
