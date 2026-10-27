import { NextRequest,NextResponse } from "next/server";
import { emailAccess,emailError } from "@/lib/owner-email-access";
import { connectGmail } from "@/lib/owner-email";
import { prisma } from "@/lib/prisma";
export const maxDuration=60;
export async function POST(request:NextRequest){
 const denied=await emailAccess(request,true);if(denied)return denied;
 try{const body=await request.json();const pass=String(body.appPassword||"").replace(/\s/g,"");if(!/^[a-zA-Z]{16}$/.test(pass))return NextResponse.json({error:"Enter the 16-letter Google App Password, not your regular password."},{status:400});await connectGmail(pass);return NextResponse.json({ok:true});}catch(e){return emailError(e,"Gmail could not connect. Check the App Password and that 2-Step Verification is enabled.");}
}
export async function DELETE(request:NextRequest){
 const denied=await emailAccess(request,true);if(denied)return denied;
 await prisma.siteContent.deleteMany({where:{key:{in:["owner_gmail_connection","owner_gmail_cursor","owner_gmail_sync_token"]}}});
 return NextResponse.json({ok:true});
}
