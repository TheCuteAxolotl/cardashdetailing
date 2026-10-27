import {NextRequest,NextResponse} from "next/server";
import {randomBytes} from "node:crypto";
import {emailAccess} from "@/lib/owner-email-access";
import {secretHash} from "@/lib/gmail-security";
import {prisma} from "@/lib/prisma";
export async function POST(request:NextRequest){
 const denied=await emailAccess(request,true);if(denied)return denied;
 const token=randomBytes(32).toString("hex");
 await prisma.siteContent.upsert({where:{key:"owner_gmail_sync_token"},create:{key:"owner_gmail_sync_token",value:secretHash(token)},update:{value:secretHash(token)}});
 const script=`// Car Dash: checks for new email every five minutes. Keep this script private.
function checkCarDashEmail() {
  const response = UrlFetchApp.fetch('https://cardashdetailing.com/api/email/sync', {
    method: 'post', headers: {Authorization: 'Bearer ${token}'}, muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error('Car Dash email sync failed. Check your website email connection.');
}
function enableCarDashEmailAlerts() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'checkCarDashEmail').forEach(t => ScriptApp.deleteTrigger(t));
  checkCarDashEmail();
  ScriptApp.newTrigger('checkCarDashEmail').timeBased().everyMinutes(5).create();
}
`;
 return NextResponse.json({script},{headers:{"Cache-Control":"private, no-store"}});
}
