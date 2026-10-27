import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentAccountFromRequest,hasStaffPermission,isOwnerAccount} from "@/lib/permissions";
import {emailConfig,withMailbox} from "@/lib/owner-email";

type Section="sms"|"quotes"|"support"|"calls";
const permissions={sms:"smsInbox",quotes:"quoteChats",support:"support",calls:"businessPhone"} as const;
export const maxDuration=60;
export async function GET(request:NextRequest){
 const auth=await getCurrentAccountFromRequest(request);
 if(!auth)return NextResponse.json({error:"Login required"},{status:401});
 const keys=(Object.keys(permissions) as Section[]).map(section=>`notification_seen_${auth.id}_${section}`);
 const seenRows=await prisma.siteContent.findMany({where:{key:{in:keys}}});
 const seen=(section:Section)=>{const raw=seenRows.find(row=>row.key===`notification_seen_${auth.id}_${section}`)?.value;const date=raw?new Date(raw):new Date(0);return Number.isNaN(date.getTime())?new Date(0):date;};
 const jobs:Record<string,Promise<number>>={};
 if(hasStaffPermission(auth,"bookings"))jobs["/owner/bookings"]=prisma.booking.count({where:{status:"pending"}});
 if(hasStaffPermission(auth,"smsInbox"))jobs["/owner/messages"]=(async()=>{
  const rows=await prisma.$queryRaw<{count:bigint}[]>`SELECT COUNT(*) AS count FROM "BookingMessage" m JOIN "BookingConversation" c ON c.id=m."conversationId" WHERE m.sender='customer' AND (c."lastStaffSeenAt" IS NULL OR m."createdAt">c."lastStaffSeenAt")`;
  const direct=await prisma.unmatchedSmsMessage.count({where:{direction:"inbound",createdAt:{gt:seen("sms")}}});
  const quoteMessages=hasStaffPermission(auth,"quoteChats")?await prisma.quoteMessage.count({where:{sender:"customer",createdAt:{gt:seen("sms")},thread:{status:{not:"closed"}}}}):0;
  return Number(rows[0]?.count||0)+direct+quoteMessages;
 })();
 if(hasStaffPermission(auth,"quoteChats"))jobs["/owner/quotes"]=prisma.quoteMessage.count({where:{sender:"customer",createdAt:{gt:seen("quotes")},thread:{status:{not:"closed"}}}});
 if(hasStaffPermission(auth,"support"))jobs["/owner/support"]=prisma.supportMessage.count({where:{sender:"visitor",createdAt:{gt:seen("support")},ticket:{status:{not:"closed"}}}});
 if(hasStaffPermission(auth,"businessPhone"))jobs["/owner/calls"]=prisma.callLog.count({where:{blocked:false,OR:[{voicemailAt:{gt:seen("calls")}},{startedAt:{gt:seen("calls")},status:{in:["missed","no-answer","busy","failed"]}}]}});
 if(isOwnerAccount(auth))jobs["/owner/email"]=(async()=>{
  if(!await emailConfig())return 0;
  return withMailbox("inbox",async client=>{const status=await client.status("INBOX",{unseen:true});return status ? status.unseen||0 : 0;});
 })();
 const entries=Object.entries(jobs),results=await Promise.allSettled(entries.map(([,job])=>job));
 const counts:Record<string,number>={};
 results.forEach((result,index)=>{if(result.status==="fulfilled")counts[entries[index][0]]=result.value;});
 return NextResponse.json({counts},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest){
 const auth=await getCurrentAccountFromRequest(request);if(!auth)return NextResponse.json({error:"Login required"},{status:401});
 if(request.headers.get("sec-fetch-site")==="cross-site"||(request.headers.get("origin")&&request.headers.get("origin")!==request.nextUrl.origin))return NextResponse.json({error:"Invalid origin"},{status:403});
 const body=await request.json();const section=body.section as Section;
 if(!Object.hasOwn(permissions,section)||!hasStaffPermission(auth,permissions[section]))return NextResponse.json({error:"Section access required"},{status:403});
 const key=`notification_seen_${auth.id}_${section}`,value=new Date().toISOString();
 await prisma.siteContent.upsert({where:{key},create:{key,value},update:{value}});
 return NextResponse.json({ok:true});
}
