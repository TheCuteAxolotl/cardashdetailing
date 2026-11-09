import { NextRequest, NextResponse } from "next/server";
import { runCashNotifications } from "@/lib/cash-plan-sms";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET?.trim();
  if(!secret||request.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Unauthorized"},{status:401});
  return NextResponse.json(await runCashNotifications(),{headers:{"Cache-Control":"no-store"}});
}