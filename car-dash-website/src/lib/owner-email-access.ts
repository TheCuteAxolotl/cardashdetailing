import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
export async function emailAccess(request: NextRequest, mutation=false) {
  if (!isOwnerAccount(await getCurrentAccountFromRequest(request))) return NextResponse.json({error:"Owner access required."},{status:403});
  if (mutation && (request.headers.get("sec-fetch-site")==="cross-site" || (request.headers.get("origin") && request.headers.get("origin")!==request.nextUrl.origin))) return NextResponse.json({error:"Invalid origin."},{status:403});
  return null;
}
export function emailLocation(request: NextRequest) {
  const folder=request.nextUrl.searchParams.get("folder")==="sent"?"sent":"inbox";
  const uid=Number(request.nextUrl.searchParams.get("uid")),validity=request.nextUrl.searchParams.get("validity")||"";
  if(!Number.isSafeInteger(uid)||uid<1||!/^\d+$/.test(validity)) throw new Error("Invalid message. Refresh the inbox.");
  return {folder,uid,validity};
}
export function emailError(error: unknown, fallback="Could not load email. Check your Gmail connection and try again.") {
  // Never return SMTP/IMAP errors, credentials, or message contents to the client.
  const text=error instanceof Error?error.message:"";
  const safe=/^(Connect Gmail first\.|Enter one valid recipient|Inbox changed\.|Message no longer|This email is larger|Discord could not|Discord notifications are not)/.test(text)?text:fallback;
  return NextResponse.json({error:safe},{status:400});
}
