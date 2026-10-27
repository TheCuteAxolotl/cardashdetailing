import {NextRequest,NextResponse} from "next/server";
import {emailAccess,emailError} from "@/lib/owner-email-access";
import {syncEmailDiscord} from "@/lib/owner-email";
export const maxDuration=60;
export async function POST(request:NextRequest){const denied=await emailAccess(request,true);if(denied)return denied;try{return NextResponse.json(await syncEmailDiscord());}catch(e){return emailError(e,"Email notification sync failed. Try again.");}}
