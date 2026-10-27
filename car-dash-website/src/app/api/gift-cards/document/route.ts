import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentAccountFromRequest,isOwnerAccount} from "@/lib/permissions";
import {GIFT_PREFIX,cleanGiftCode,validGiftCode,type GiftCard} from "@/lib/gift-cards";
import {GIFT_ORDER_PREFIX,giftPurchase} from "@/lib/gift-card-checkout";
import {giftDocument} from "@/lib/gift-card-documents";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'","X-Content-Type-Options":"nosniff"};
 try{
  let code=cleanGiftCode(request.nextUrl.searchParams.get("code"));const token=request.nextUrl.searchParams.get("token");
  if(token){
   if(!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Invalid purchase link"},{status:403,headers});
   const purchase=await giftPurchase(token);if(!purchase?.paid)return NextResponse.json({error:"Payment has not been confirmed"},{status:409,headers});
   const row=await prisma.siteContent.findUnique({where:{key:GIFT_ORDER_PREFIX+token}});code=JSON.parse(row!.value).code;
  }else if(!isOwnerAccount(await getCurrentAccountFromRequest(request)))return NextResponse.json({error:"Owner access or private purchase link required"},{status:403,headers});
  if(!validGiftCode(code))return NextResponse.json({error:"Invalid gift card"},{status:400,headers});
  const row=await prisma.siteContent.findUnique({where:{key:GIFT_PREFIX+code}});if(!row)return NextResponse.json({error:"Gift card not found"},{status:404,headers});
  const card=JSON.parse(row.value) as GiftCard;const type=request.nextUrl.searchParams.get("type")==="receipt"?"receipt":"invoice";
  if(type==="receipt"&&card.paymentStatus!=="paid"&&(!!card.paymentStatus||!card.events.some(e=>e.actor==="Stripe checkout")))return NextResponse.json({error:"Record payment received before issuing a receipt."},{status:409,headers});
  return new Response(giftDocument(card,type),{headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});
 }catch{return NextResponse.json({error:"Could not create this document."},{status:503,headers});}
}
