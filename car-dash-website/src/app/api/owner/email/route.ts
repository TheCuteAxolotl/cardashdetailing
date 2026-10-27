import { NextRequest,NextResponse } from "next/server";
import { emailAccess,emailError } from "@/lib/owner-email-access";
import { emailConfig,listGmail } from "@/lib/owner-email";
import { BUSINESS_GMAIL } from "@/lib/gmail-security";
export const maxDuration=60;
export async function GET(request:NextRequest){
 const denied=await emailAccess(request);if(denied)return denied;
 try{const config=await emailConfig();return NextResponse.json({email:BUSINESS_GMAIL,connected:!!config,messages:config?await listGmail(request.nextUrl.searchParams.get("folder")==="sent"?"sent":"inbox"):[]},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return emailError(e);}
}
