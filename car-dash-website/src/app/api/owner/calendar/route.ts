import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { SITE_URL } from "@/lib/seo";
export async function POST(request: NextRequest) {
 if(!isOwnerAccount(await getCurrentAccountFromRequest(request))) return NextResponse.json({error:"Owner access required"},{status:403});
 if(request.headers.get("sec-fetch-site")==="cross-site") return NextResponse.json({error:"Invalid origin"},{status:403});
 const token=randomBytes(32).toString("hex");
 const value=createHash("sha256").update(token).digest("hex");
 await prisma.siteContent.upsert({where:{key:"owner_calendar_token_hash"},create:{key:"owner_calendar_token_hash",value},update:{value}});
 return NextResponse.json({url:`${SITE_URL}/api/calendar/${token}`},{headers:{"Cache-Control":"no-store"}});
}
export async function DELETE(request: NextRequest) {
 if(!isOwnerAccount(await getCurrentAccountFromRequest(request))) return NextResponse.json({error:"Owner access required"},{status:403});
 if(request.headers.get("sec-fetch-site")==="cross-site") return NextResponse.json({error:"Invalid origin"},{status:403});
 await prisma.siteContent.deleteMany({where:{key:"owner_calendar_token_hash"}});
 return NextResponse.json({ok:true});
}
