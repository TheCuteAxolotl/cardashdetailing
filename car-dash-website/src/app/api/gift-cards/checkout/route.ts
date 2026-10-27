import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {prisma} from "@/lib/prisma";
import {parseGiftAmount} from "@/lib/gift-cards";
import {startGiftCheckout} from "@/lib/gift-card-checkout";
export async function POST(request:NextRequest){
 if(request.headers.get("sec-fetch-site")==="cross-site"||(request.headers.get("origin")&&request.headers.get("origin")!==request.nextUrl.origin))return NextResponse.json({error:"Invalid origin"},{status:403});
 try{
  const body=await request.json();const amount=parseGiftAmount(body.amount);
  if(amount<1000||amount>100000)return NextResponse.json({error:"Choose an amount between $10 and $1,000."},{status:400});
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  const key="gift_checkout_limit_"+createHash("sha256").update(ip).digest("hex");
  const allowed=await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;const row=await tx.siteContent.findUnique({where:{key}});const now=Date.now();let value=row?JSON.parse(row.value):{start:now,count:0};if(now-value.start>600000)value={start:now,count:0};if(value.count>=8)return false;value.count++;await tx.siteContent.upsert({where:{key},create:{key,value:JSON.stringify(value)},update:{value:JSON.stringify(value)}});return true;});
  if(!allowed)return NextResponse.json({error:"Too many checkout attempts. Please wait a few minutes."},{status:429});
  return NextResponse.json(await startGiftCheckout(amount,{purchaserName:String(body.purchaserName||""),recipientName:String(body.recipientName||"")}),{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Could not open checkout. Please retry or contact Car Dash."},{status:503});}
}
