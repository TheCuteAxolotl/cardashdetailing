import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {matchesSecret} from "@/lib/gmail-security";
import {syncEmailDiscord} from "@/lib/owner-email";
export const maxDuration=60;
export async function POST(request:NextRequest){
 const record=await prisma.siteContent.findUnique({where:{key:"owner_gmail_sync_token"}});
 const token=(request.headers.get("authorization")||"").replace(/^Bearer /,"");
 if(!record||!token||!matchesSecret(token,record.value))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{return NextResponse.json(await syncEmailDiscord());}catch{return NextResponse.json({error:"Sync failed"},{status:503});}
}
