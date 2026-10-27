import { NextRequest,NextResponse } from "next/server";
import { emailAccess,emailError,emailLocation } from "@/lib/owner-email-access";
import { readGmail } from "@/lib/owner-email";
export const maxDuration=60;
export async function GET(request:NextRequest){
 const denied=await emailAccess(request);if(denied)return denied;
 try{
  const {folder,uid,validity}=emailLocation(request),mail=await readGmail(folder,uid,validity);
  const attachment=request.nextUrl.searchParams.get("attachment");
  if(attachment!==null){
   const index=Number(attachment);if(!Number.isInteger(index)||index<0||!mail.attachments[index])return NextResponse.json({error:"Attachment not found"},{status:404});
   const item=mail.attachments[index],inline=/^image\/(jpeg|png|gif|webp|avif)$/.test(item.contentType);
   return new Response(new Uint8Array(item.content),{headers:{"Content-Type":item.contentType,"Content-Disposition":`${inline?"inline":"attachment"}; filename*=UTF-8''${encodeURIComponent(item.filename||"attachment")}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
  }
  return NextResponse.json({subject:mail.subject||"",from:mail.from?.text||"",to:Array.isArray(mail.to)?mail.to.map(x=>x.text).join(", "):mail.to?.text||"",replyTo:mail.replyTo?.value[0]?.address||mail.from?.value[0]?.address||"",text:mail.text||"This email has no readable text. Open it in Gmail to view the original.",date:mail.date?.toISOString(),attachments:mail.attachments.map((item,index)=>({index,name:item.filename||"Attachment",type:item.contentType,size:item.size}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return emailError(e);}
}
