import { GmailConnectionError } from "@/lib/gmail-connection-error";
import { NextRequest,NextResponse } from "next/server";
import { emailAccess,emailError } from "@/lib/owner-email-access";
import { connectGmail } from "@/lib/owner-email";
import { prisma } from "@/lib/prisma";
export const maxDuration=60;
export async function POST(request:NextRequest){
 const denied=await emailAccess(request,true);if(denied)return denied;
 try{const body=await request.json();const pass=String(body.appPassword||"").replace(/\s/g,"");if(!/^[a-zA-Z]{16}$/.test(pass))return NextResponse.json({error:"Enter the 16-letter Google App Password, not your regular password."},{status:400});await connectGmail(pass);return NextResponse.json({ok:true});}catch(e){
  if(e instanceof GmailConnectionError){
   console.error("Gmail connection failed",{stage:e.stage,reason:e.reason});
   return NextResponse.json({error:e.message,code:`${e.stage}_${e.reason}`},{status:e.reason==="authentication"?400:502});
  }
  console.error("Gmail connection failed",{stage:"request",reason:"unexpected"});
  return emailError(e,"The website could not complete Gmail setup. Refresh and retry once.");
 }
}
export async function DELETE(request:NextRequest){
 const denied=await emailAccess(request,true);if(denied)return denied;
 await prisma.siteContent.deleteMany({where:{key:{in:["owner_gmail_connection","owner_gmail_cursor","owner_gmail_sync_token"]}}});
 return NextResponse.json({ok:true});
}
