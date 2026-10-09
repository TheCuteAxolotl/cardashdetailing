import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";

import { PROMOTION_COSTS_KEY as KEY, parseCosts } from "@/lib/promotion-costs";
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
