import {messagePhotos} from "@/lib/message-photos";
import { NextRequest,NextResponse } from "next/server";
import { emailAccess,emailError } from "@/lib/owner-email-access";
import { gmailPassword,readGmail,smtpClient } from "@/lib/owner-email";
import { BUSINESS_GMAIL,emailRecipient } from "@/lib/gmail-security";
import { prisma } from "@/lib/prisma";
export const maxDuration=60;
export async function POST(request:NextRequest){
 const denied=await emailAccess(request,true);if(denied)return denied;
 try{
  const body=await request.json();const to=emailRecipient(body.to),subject=String(body.subject||"").trim(),text=String(body.text||"").trim(),id=String(body.requestId||"");
  if(!subject||subject.length>200||/[\r\n]/.test(subject)||!text||text.length>30000||!/^[-a-f0-9]{36}$/.test(id))return NextResponse.json({error:"Enter a subject and message (up to 30,000 characters)."},{status:400});
  const photos=messagePhotos(body.attachments);
  const attachments=photos.map((image,index)=>({filename:`photo-${index+1}.jpg`,content:Buffer.from(image.split(",")[1],"base64"),contentType:image.slice(5,image.indexOf(";"))}));
  let inReplyTo:string|undefined,references:string[]|undefined;
  if(body.reply){
   const {uid,validity,folder}=body.reply;
   if(!Number.isSafeInteger(uid)||uid<1||!/^\d+$/.test(String(validity)))return NextResponse.json({error:"Invalid reply message."},{status:400});
   const original=await readGmail(folder==="sent"?"sent":"inbox",uid,String(validity));
   inReplyTo=original.messageId;references=[...(original.references?Array.isArray(original.references)?original.references:[original.references]:[]),...(inReplyTo?[inReplyTo]:[])].slice(-20);
  }
  const pass=await gmailPassword();
  const key=`owner_email_send_${id}`;
  // Reserve before SMTP. An uncertain result is never automatically resent.
  const existing=await prisma.siteContent.findUnique({where:{key}});
  if(existing)return existing.value==="sent"?NextResponse.json({ok:true}):NextResponse.json({error:"This send was already attempted. Check Gmail Sent before starting another email."},{status:409});
  try{await prisma.siteContent.create({data:{key,value:"sending"}});}catch{return NextResponse.json({error:"This email is already being sent."},{status:409});}
  const smtp=smtpClient(pass);
  try{
   await smtp.sendMail({from:`Car Dash Detailing <${BUSINESS_GMAIL}>`,to,subject,text,attachments,inReplyTo,references,messageId:`<${id}@cardashdetailing.com>`});
   await prisma.siteContent.update({where:{key},data:{value:"sent"}});
  }catch{return NextResponse.json({error:"Delivery could not be confirmed. Check Gmail Sent before retrying to avoid sending twice."},{status:502});}finally{smtp.close();}
  return NextResponse.json({ok:true});
 }catch(e){return emailError(e,"Could not send email. Check your Gmail connection.");}
}
