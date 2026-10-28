import { conversionPrice } from "@/lib/conversion-input";
import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {prisma} from "@/lib/prisma";
import {getCurrentAccountFromRequest,hasStaffPermission,isOwnerAccount} from "@/lib/permissions";
import {readGmail} from "@/lib/owner-email";
import {isDateString,normalizeBookingTime} from "@/lib/booking-availability";
import {createBookingWithSlotProtection,BookingSlotConflictError,BookingSlotUnavailableError} from "@/lib/booking-slot";

export const maxDuration=60;
type Source={type?:string;id?:string;uid?:number;validity?:string};
async function sourceDetails(request:NextRequest,source:Source){
 const auth=await getCurrentAccountFromRequest(request);
 if(!hasStaffPermission(auth,"bookings"))throw new Error("Booking access required.");
 let identity="",excerpt="",seed:Record<string,string>={};
 if(source.type==="sms"){
  if(!hasStaffPermission(auth,"smsInbox"))throw new Error("SMS access required.");
  const message=await prisma.unmatchedSmsMessage.findUnique({where:{id:String(source.id||"")}});
  if(!message)throw new Error("Message not found.");
  seed={customerPhone:message.fromPhone};excerpt=message.body;identity=`sms:${message.id}`;
 }else if(source.type==="booking-message"){
  if(!hasStaffPermission(auth,"smsInbox"))throw new Error("SMS access required.");
  const message=await prisma.bookingMessage.findUnique({where:{id:String(source.id||"")},include:{conversation:{include:{booking:true}}}});
  if(!message)throw new Error("Message not found.");
  const b=message.conversation.booking;
  seed={customerName:b.customerName,customerPhone:b.customerPhone,customerEmail:b.customerEmail,vehicleYear:b.vehicleYear,vehicleMake:b.vehicleMake,vehicleModel:b.vehicleModel,vehicleTrim:b.vehicleTrim||"",serviceName:b.serviceName};
  excerpt=message.body;identity=`booking-message:${message.id}`;
 }else if(source.type==="email"){
  if(!isOwnerAccount(auth))throw new Error("Owner access required.");
  if(!Number.isSafeInteger(source.uid)||Number(source.uid)<1||!/^\d+$/.test(source.validity||""))throw new Error("Invalid email message.");
  const mail=await readGmail("inbox",source.uid!,source.validity!);
  seed={customerName:mail.from?.value[0]?.name||"",customerEmail:mail.replyTo?.value[0]?.address||mail.from?.value[0]?.address||""};
  excerpt=`Subject: ${mail.subject||""}\n${mail.text||""}`;identity=`email:${source.validity}:${source.uid}`;
 }else throw new Error("Choose a message to convert.");
 const key="message_booking_"+createHash("sha256").update(identity).digest("hex");
 return {key,seed,excerpt:excerpt.slice(0,1200),label:source.type==="email"?"Email":"SMS / website message"};
}
export async function GET(request:NextRequest){
 try{
  const data=await sourceDetails(request,JSON.parse(request.nextUrl.searchParams.get("source")||"{}"));
  const link=await prisma.siteContent.findUnique({where:{key:data.key}});
  const booking=link?await prisma.booking.findUnique({where:{id:link.value},select:{id:true,customerName:true,preferredDate:true,preferredTime:true}}):null;
  return NextResponse.json({seed:data.seed,excerpt:data.excerpt,booking},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"Could not load this message. Check your access and refresh."},{status:403});}
}
export async function POST(request:NextRequest){
 if(request.headers.get("sec-fetch-site")==="cross-site"||(request.headers.get("origin")&&request.headers.get("origin")!==request.nextUrl.origin))return NextResponse.json({error:"Invalid origin"},{status:403});
 try{
  const body=await request.json();const source=await sourceDetails(request,body.source||{});const d=body.details||{};
  const clean=(key:string,max=240)=>String(d[key]??"").trim().slice(0,max);
  const date=clean("preferredDate"),time=clean("preferredTime"),price=conversionPrice(d.quotedPrice);
  if(!clean("customerName")||!clean("serviceName")||!isDateString(date)||!normalizeBookingTime(time)||price===null)return NextResponse.json({error:"Enter customer name, service, price, date and time."},{status:400});
  const booking=await createBookingWithSlotProtection({userId:null,vehicleId:null,customerName:clean("customerName"),customerEmail:clean("customerEmail"),customerPhone:clean("customerPhone"),serviceName:clean("serviceName"),serviceMethod:"mobile",vehicleMake:clean("vehicleMake")||"Not specified",vehicleModel:clean("vehicleModel")||"Not specified",vehicleYear:clean("vehicleYear")||"Not specified",vehicleTrim:clean("vehicleTrim")||null,preferredDate:date,preferredTime:time,quotedPrice:price,status:"confirmed",notes:[`Booking source: ${source.label}`,`Original message: ${source.excerpt}`,"SMS consent: No consent recorded from website booking flow",clean("notes",2000)?`Address / owner notes: ${clean("notes",2000)}`:""].filter(Boolean).join("\n")},{messageSourceKey:source.key});
  return NextResponse.json({booking},{status:201});
 }catch(error){
  if(error instanceof BookingSlotConflictError||error instanceof BookingSlotUnavailableError)return NextResponse.json({error:error.message},{status:409});
  return NextResponse.json({error:"Could not convert this message. Check your access and message connection, then try again."},{status:400});
 }
}
