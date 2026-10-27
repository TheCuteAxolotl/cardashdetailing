import {NextRequest,NextResponse} from "next/server";
import {randomInt,createHmac,timingSafeEqual} from "node:crypto";
import {prisma} from "@/lib/prisma";
import {getCurrentAccountFromRequest,isStaffAccount} from "@/lib/permissions";
import {normalizePhoneNumber,sendTransactionalSms} from "@/lib/twilio-sms";
import {ensureBookingChatSchema} from "@/lib/booking-chat";
import {ensureGuestQuoteSupport} from "@/lib/quote-guest";
function hash(value:string){const secret=process.env.NEXTAUTH_SECRET||process.env.JWT_SECRET;if(!secret)throw new Error("Not configured");return createHmac("sha256",secret).update(value).digest("hex");}
export async function POST(request:NextRequest){
 const auth=await getCurrentAccountFromRequest(request);if(!auth||isStaffAccount(auth))return NextResponse.json({error:"Customer login required"},{status:401});
 if(request.headers.get("sec-fetch-site")==="cross-site"||(request.headers.get("origin")&&request.headers.get("origin")!==request.nextUrl.origin))return NextResponse.json({error:"Invalid origin"},{status:403});
 try{
  const body=await request.json(),phone=normalizePhoneNumber(body.phone);if(!phone)return NextResponse.json({error:"Enter a valid mobile number."},{status:400});
  const key=`phone_challenge_${auth.id}`;
  if(body.action==="send"){
   const code=String(randomInt(100000,1000000));
   await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;const old=await tx.siteContent.findUnique({where:{key}});const state=old?JSON.parse(old.value):{};if(Date.now()-(state.sentAt||0)<60000)throw new Error("Wait a minute before requesting another code.");const day=new Date().toISOString().slice(0,10),count=state.day===day?state.count||0:0;if(count>=6)throw new Error("Daily verification limit reached. Try tomorrow.");const value=JSON.stringify({phone,hash:hash(`${auth.id}:${phone}:${code}`),sentAt:Date.now(),attempts:0,day,count:count+1});await tx.siteContent.upsert({where:{key},create:{key,value},update:{value}});});
   const sms=await sendTransactionalSms({to:phone,body:`Car Dash verification code: ${code}. Expires in 10 minutes. Do not share this code.`,includeOptOutLine:false});
   if(!sms.sent)throw new Error("Could not send verification text. Please try again later.");
   return NextResponse.json({sent:true});
  }
  if(body.action!=="verify")return NextResponse.json({error:"Invalid action"},{status:400});
  await ensureBookingChatSchema();await ensureGuestQuoteSupport();
  const result=await prisma.$transaction(async tx=>{
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`phone:${phone}`}))::text`;
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;
   const row=await tx.siteContent.findUnique({where:{key}});if(!row)return {error:"Request a verification code first."};
   const state=JSON.parse(row.value);if(state.phone!==phone||Date.now()-state.sentAt>600000||state.attempts>=5||state.used)return {error:"Code expired or unavailable. Request a new one."};
   const a=Buffer.from(hash(`${auth.id}:${phone}:${String(body.code||"")}`)),b=Buffer.from(state.hash);
   if(a.length!==b.length||!timingSafeEqual(a,b)){state.attempts++;await tx.siteContent.update({where:{key},data:{value:JSON.stringify(state)}});return {error:"Incorrect verification code."};}
   const phoneKey=`verified_phone_${phone}`,existing=await tx.siteContent.findUnique({where:{key:phoneKey}});if(existing&&existing.value!==auth.id)return {error:"This phone is already connected to another account. Contact Car Dash to resolve it."};
   await tx.siteContent.upsert({where:{key:phoneKey},create:{key:phoneKey,value:auth.id},update:{value:auth.id}});
   const guests=await tx.quoteThread.findMany({where:{userId:null,guestPhone:{not:null}}});
   const matching=guests.filter(q=>normalizePhoneNumber(q.guestPhone)===phone);
   for(const q of matching)await tx.quoteThread.update({where:{id:q.id},data:{userId:auth.id,guestPhone:phone}});
   let thread=matching.find(q=>q.status!=="closed")||await tx.quoteThread.findFirst({where:{userId:auth.id,guestPhone:phone,status:{not:"closed"}}});
   const direct=await tx.unmatchedSmsMessage.findMany({where:{OR:[{fromPhone:phone,direction:"inbound"},{toPhone:phone,direction:"outbound"}]},orderBy:{createdAt:"asc"}});
   if(!thread)thread=await tx.quoteThread.create({data:{userId:auth.id,subject:"Messages with Car Dash",status:"conversation",guestPhone:phone,guestName:auth.name,guestEmail:auth.email}});
   if(thread)for(const message of direct){await tx.quoteMessage.upsert({where:{externalSid:message.externalSid},create:{threadId:thread.id,sender:message.direction==="outbound"?"team":"customer",body:message.body,attachmentsJson:message.attachmentsJson,externalSid:message.externalSid,createdAt:message.createdAt},update:{}});await tx.unmatchedSmsMessage.delete({where:{id:message.id}});}
   const bookings=await tx.booking.findMany({where:{userId:null}});for(const booking of bookings)if(normalizePhoneNumber(booking.customerPhone)===phone)await tx.booking.update({where:{id:booking.id},data:{userId:auth.id}});
   state.used=true;await tx.siteContent.update({where:{key},data:{value:JSON.stringify(state)}});
   return {success:true,threadId:thread?.id};
  },{timeout:30000});
  return NextResponse.json(result,{status:"error" in result?400:200});
 }catch(error){const message=error instanceof Error?error.message:"";return NextResponse.json({error:/^(Wait a minute|Daily verification|Could not send verification)/.test(message)?message:"Could not connect this number. Please retry."},{status:400});}
}
