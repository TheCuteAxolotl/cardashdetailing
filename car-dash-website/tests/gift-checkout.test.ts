import assert from "node:assert/strict";
import {prisma} from "../src/lib/prisma";
import {fulfillGiftCheckout,GIFT_ORDER_PREFIX} from "../src/lib/gift-card-checkout";
import {GIFT_PREFIX} from "../src/lib/gift-cards";
const token="a".repeat(64),order={id:"test",token,amount:10000,code:"B".repeat(20),sessionId:"cs_test",createdAt:new Date().toISOString()};
const rows=new Map<string,string>([[GIFT_ORDER_PREFIX+token,JSON.stringify(order)]]);
let creates=0;
(prisma as any).$transaction=async(fn:any)=>fn({$queryRaw:async()=>[],siteContent:{findUnique:async({where}:any)=>rows.has(where.key)?{key:where.key,value:rows.get(where.key)}:null,create:async({data}:any)=>{assert.ok(!rows.has(data.key));creates++;rows.set(data.key,data.value);},update:async({where,data}:any)=>{rows.set(where.key,data.value);}}});
async function main(){
 const session={id:"cs_test",payment_status:"unpaid",currency:"usd",amount_total:10000,metadata:{gift_purchase_token:token}};
 await fulfillGiftCheckout(session);assert.equal(creates,0);
 await assert.rejects(()=>fulfillGiftCheckout({...session,payment_status:"paid",amount_total:10100}));assert.equal(creates,0);
 await fulfillGiftCheckout({...session,payment_status:"paid"});assert.equal(creates,1);assert.equal(JSON.parse(rows.get(GIFT_PREFIX+order.code)!).balance,10000);
 await fulfillGiftCheckout({...session,payment_status:"paid"});assert.equal(creates,1);
 console.log("Gift checkout: unpaid rejected, amount mismatch rejected, face value credited, duplicate delivery ignored.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
