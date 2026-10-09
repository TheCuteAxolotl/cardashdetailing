import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";
import { DEFAULT_PROMOTIONS, parsePromotions, PROMOTIONS_KEY } from "@/lib/promotions";

export async function GET() {
  const row=await prisma.siteContent.findUnique({where:{key:PROMOTIONS_KEY}});
  return NextResponse.json(parsePromotions(row?.value));
}
export async function PUT(request: NextRequest) {
  const auth=await getCurrentAccountFromRequest(request);
  if (auth?.role !== "owner") return NextResponse.json({error:"Owner access required"}, {status:403});
  const body=await request.json();
  const next=parsePromotions(JSON.stringify(body));
  if(next.promotions.some(p=>p.startsAt && p.endsAt && p.startsAt>p.endsAt)) return NextResponse.json({error:"End date must be after start date"}, {status:400});
  await prisma.siteContent.upsert({where:{key:PROMOTIONS_KEY},create:{key:PROMOTIONS_KEY,value:JSON.stringify(next)},update:{value:JSON.stringify(next)}});
  return NextResponse.json(next);
}
