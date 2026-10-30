import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

type Alert = {
  id: string;
  kind: "booking" | "quote" | "message" | "call" | "support";
  title: string;
  detail: string;
  href: string;
  time: string;
};
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({error:"Sign in required"}, {status:401});
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const seenKey = "owner_activity_seen_" + auth.id;
  const [seenRow, bookings, quotes, sms, bookingMessages, quoteMessages, calls, tickets] = await Promise.all([
    prisma.siteContent.findUnique({where:{key:seenKey},select:{value:true}}),
    hasStaffPermission(auth,"bookings") ? prisma.booking.findMany({
      where:{createdAt:{gte:cutoff}}, orderBy:{createdAt:"desc"},take:35,
      select:{id:true,createdAt:true,customerName:true,serviceName:true,status:true},
    }) : Promise.resolve([]),
    hasStaffPermission(auth,"quoteChats") ? prisma.quoteThread.findMany({
      where:{createdAt:{gte:cutoff}},orderBy:{createdAt:"desc"},take:25,
      select:{id:true,createdAt:true,subject:true,guestName:true},
    }) : Promise.resolve([]),
    hasStaffPermission(auth,"smsInbox") ? prisma.unmatchedSmsMessage.findMany({
      where:{direction:"inbound",createdAt:{gte:cutoff}},orderBy:{createdAt:"desc"},take:35,
      select:{id:true,createdAt:true,fromPhone:true,body:true},
    }) : Promise.resolve([]),
    hasStaffPermission(auth,"smsInbox") ? prisma.bookingMessage.findMany({
      where:{sender:"customer",createdAt:{gte:cutoff}},orderBy:{createdAt:"desc"},take:35,
      select:{id:true,createdAt:true,body:true,conversation:{select:{booking:{select:{customerName:true,customerPhone:true}}}}},
    }) : Promise.resolve([]),
    hasStaffPermission(auth,"quoteChats") ? prisma.quoteMessage.findMany({
      where:{sender:"customer",createdAt:{gte:cutoff}},orderBy:{createdAt:"desc"},take:25,
      select:{id:true,createdAt:true,body:true,thread:{select:{guestName:true,guestPhone:true,subject:true}}},
    }) : Promise.resolve([]),
    hasStaffPermission(auth,"businessPhone") ? prisma.callLog.findMany({
      where:{startedAt:{gte:cutoff},blocked:false,status:{in:["missed","no-answer","busy","failed"]}},
      orderBy:{startedAt:"desc"},take:25,select:{id:true,startedAt:true,fromPhone:true},
    }) : Promise.resolve([]),
    hasStaffPermission(auth,"support") ? prisma.supportTicket.findMany({
      where:{createdAt:{gte:cutoff}},orderBy:{createdAt:"desc"},take:20,
      select:{id:true,createdAt:true,name:true,subject:true},
    }) : Promise.resolve([]),
  ]);
  const ownerPath = auth.role === "owner" ? "/owner" : "/admin";
  const alerts:Alert[] = [];
  for (const x of bookings) alerts.push({id:"booking:"+x.id,kind:"booking",
    title:"New booking · "+x.customerName,detail:x.serviceName+" · "+x.status,
    href:ownerPath+"/bookings",time:x.createdAt.toISOString()});
  for (const x of quotes) alerts.push({id:"quote:"+x.id,kind:"quote",
    title:"New quote request",detail:(x.guestName||"Customer")+" · "+x.subject,
    href:ownerPath+"/quotes",time:x.createdAt.toISOString()});
  for (const x of sms) alerts.push({id:"sms:"+x.id,kind:"message",
    title:"New text from "+x.fromPhone,detail:x.body.slice(0,160),
    href:ownerPath+"/messages?phone="+encodeURIComponent(x.fromPhone),time:x.createdAt.toISOString()});
  for (const x of bookingMessages) alerts.push({id:"booking-message:"+x.id,kind:"message",
    title:"Message from "+x.conversation.booking.customerName,detail:x.body.slice(0,160),
    href:ownerPath+"/messages?phone="+encodeURIComponent(x.conversation.booking.customerPhone),time:x.createdAt.toISOString()});
  for (const x of quoteMessages) alerts.push({id:"quote-message:"+x.id,kind:"message",
    title:"Quote message from "+(x.thread.guestName||"Customer"),detail:x.body.slice(0,160),
    href:x.thread.guestPhone ? ownerPath+"/messages?phone="+encodeURIComponent(x.thread.guestPhone) : ownerPath+"/quotes",
    time:x.createdAt.toISOString()});
  for (const x of calls) alerts.push({id:"call:"+x.id,kind:"call",
    title:"Missed business call",detail:x.fromPhone,href:ownerPath+"/calls",time:x.startedAt.toISOString()});
  for (const x of tickets) alerts.push({id:"support:"+x.id,kind:"support",
    title:"New support request",detail:x.name+" · "+x.subject,href:ownerPath+"/support",time:x.createdAt.toISOString()});
  alerts.sort((a,b)=>b.time.localeCompare(a.time));
  const seenAt = seenRow?.value && !Number.isNaN(Date.parse(seenRow.value)) ? seenRow.value : null;
  return NextResponse.json({alerts:alerts.slice(0,55),seenAt,unread:seenAt?alerts.filter(x=>x.time>seenAt).length:alerts.length},
    {headers:{"Cache-Control":"private, no-store"}});
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({error:"Sign in required"},{status:401});
  if (request.headers.get("sec-fetch-site")==="cross-site" ||
      (request.headers.get("origin") && request.headers.get("origin")!==request.nextUrl.origin))
    return NextResponse.json({error:"Invalid origin"},{status:403});
  const key="owner_activity_seen_"+auth.id;
  await prisma.siteContent.upsert({where:{key},create:{key,value:new Date().toISOString()},update:{value:new Date().toISOString()}});
  return NextResponse.json({ok:true});
}
