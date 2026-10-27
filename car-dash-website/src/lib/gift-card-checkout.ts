import {randomBytes,randomUUID} from "node:crypto";
import {prisma} from "@/lib/prisma";
import {stripeRequest,stripeInvoiceRuntimeInfo} from "@/lib/stripe-invoice";
import {GIFT_PREFIX,giftCodeFromId,type GiftCard} from "@/lib/gift-cards";
export const GIFT_ORDER_PREFIX="gift_purchase_";
type Order={id:string;token:string;amount:number;code:string;sessionId?:string;url?:string;paid?:boolean;createdAt:string;purchaserName?:string;recipientName?:string};
export async function startGiftCheckout(amount:number,names:{purchaserName?:string;recipientName?:string}={}){
 if(!stripeInvoiceRuntimeInfo.fullyConfigured)throw new Error("Gift-card checkout is not configured yet.");
 if(!Number.isSafeInteger(amount)||amount<1000||amount>100000)throw new Error("Choose a gift card between $10 and $1,000.");
 const id=randomUUID(),token=randomBytes(32).toString("hex");
 const order:Order={id,token,amount,code:giftCodeFromId(id),purchaserName:names.purchaserName?.trim().slice(0,120),recipientName:names.recipientName?.trim().slice(0,120),createdAt:new Date().toISOString()};
 const key=GIFT_ORDER_PREFIX+token;
 await prisma.siteContent.create({data:{key,value:JSON.stringify(order)}});
 const site=(process.env.NEXT_PUBLIC_SITE_URL||"https://cardashdetailing.com").replace(/\/$/,"");
 const form=new URLSearchParams({mode:"payment",success_url:`${site}/gift-cards?purchase=${token}`,cancel_url:`${site}/gift-cards?cancelled=1`,"metadata[gift_purchase_token]":token,"line_items[0][price_data][currency]":"usd","line_items[0][price_data][unit_amount]":String(amount),"line_items[0][price_data][product_data][name]":"Car Dash Detailing Gift Card","line_items[0][price_data][product_data][description]":"Gift card value equals purchase amount. No card surcharge.","line_items[0][quantity]":"1"});
 const session=await stripeRequest("/v1/checkout/sessions",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Idempotency-Key":`gift-${id}`},body:form});
 if(!session.id||!session.url)throw new Error("Unable to open checkout.");
 order.sessionId=session.id;order.url=session.url;
 await prisma.siteContent.update({where:{key},data:{value:JSON.stringify(order)}});
 return {url:session.url};
}
export async function fulfillGiftCheckout(session:{id:string;payment_status?:string|null;currency?:string|null;amount_total?:number|null;metadata?:Record<string,string>|null}){
 const token=session.metadata?.gift_purchase_token;
 if(!token||!/^[a-f0-9]{64}$/.test(token)||session.payment_status!=="paid")return;
 const key=GIFT_ORDER_PREFIX+token;
 await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))::text`;
  const row=await tx.siteContent.findUnique({where:{key}});if(!row)throw new Error("Gift purchase not found");
  const order=JSON.parse(row.value) as Order;
  if(order.paid)return;
  if(order.sessionId!==session.id||session.currency!=="usd"||session.amount_total!==order.amount)throw new Error("Gift payment does not match order");
  const now=new Date().toISOString();
  const card:GiftCard={id:order.id,code:order.code,label:order.recipientName||order.purchaserName||"Online gift card purchase",purchaserName:order.purchaserName,recipientName:order.recipientName,paidValue:order.amount,paymentStatus:"paid",balance:order.amount,paused:false,version:1,createdAt:now,events:[{id:session.id,kind:"issue",delta:order.amount,balance:order.amount,note:`Stripe payment ${session.id}`,actor:"Stripe checkout",at:now}]};
  await tx.siteContent.create({data:{key:GIFT_PREFIX+order.code,value:JSON.stringify(card)}});
  await tx.siteContent.update({where:{key},data:{value:JSON.stringify({...order,paid:true})}});
 });
}
export async function giftPurchase(token:string){
 const row=await prisma.siteContent.findUnique({where:{key:GIFT_ORDER_PREFIX+token}});if(!row)return null;
 let order=JSON.parse(row.value) as Order;
 // Server-to-server verification also recovers if delivery of the payment webhook is delayed.
 if(!order.paid&&order.sessionId){const session=await stripeRequest(`/v1/checkout/sessions/${encodeURIComponent(order.sessionId)}`);await fulfillGiftCheckout(session);const updated=await prisma.siteContent.findUnique({where:{key:row.key}});order=JSON.parse(updated!.value);}
 return order.paid?{paid:true,code:order.code,amount:order.amount}:{paid:false};
}
