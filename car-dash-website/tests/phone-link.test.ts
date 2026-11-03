import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {NextRequest} from "next/server";
import {prisma} from "../src/lib/prisma";
import {createToken} from "../src/lib/auth";
import {POST} from "../src/app/api/account/phone/route";
import {GET,DELETE} from "../src/app/api/account/phone-connection/route";
process.env.NEXTAUTH_SECRET='test-phone-secret-at-least-32-characters';
const phone='+12245551234',code='123456';let userId='user1',linked='',removed=false;
const values=new Map<string,string>();
function challenge(){values.set(`phone_challenge_${userId}`,JSON.stringify({phone,hash:createHmac('sha256',process.env.NEXTAUTH_SECRET!).update(`${userId}:${phone}:${code}`).digest('hex'),sentAt:Date.now(),attempts:0}));}
const db=prisma as any;
db.user.findUnique=async()=>({id:userId,email:'test@example.com',name:'Customer',role:'user'});
db.$executeRawUnsafe=async()=>0;
db.customRoleAssignment.findMany=async()=>[];db.userPermissionOverride.findMany=async()=>[];
const tx={$queryRaw:async()=>[],$queryRawUnsafe:async()=>[],siteContent:{
  findUnique:async({where}:any)=>values.has(where.key)?{value:values.get(where.key)}:null,
  findMany:async({where}:any)=>[...values.entries()].filter(([key,value])=>key.startsWith(where.key.startsWith)&&value===where.value).map(([key])=>({key})),
  upsert:async({where,create,update}:any)=>{values.set(where.key,values.has(where.key)?update.value:create.value);},
  update:async({where,data}:any)=>{values.set(where.key,data.value);},
  deleteMany:async({where}:any)=>{const existed=values.has(where.key)&&(!where.value||values.get(where.key)===where.value);if(existed)values.delete(where.key);return {count:existed?1:0};},
},quoteThread:{findMany:async()=>[],findFirst:async()=>null,create:async({data}:any)=>{linked=data.userId;return {id:'thread',...data};}},unmatchedSmsMessage:{findMany:async()=>[{id:'sms',direction:'inbound',body:'Hello',externalSid:'SMtest',createdAt:new Date()}],delete:async()=>{removed=true;}},quoteMessage:{upsert:async({create}:any)=>{assert.equal(create.externalSid,'SMtest');assert.equal(create.threadId,'thread');}},booking:{findMany:async()=>[],update:async()=>{}}};
db.$transaction=async(fn:any)=>fn(tx);
db.siteContent.findMany=tx.siteContent.findMany;
db.siteContent.findUnique=tx.siteContent.findUnique;
function authCookie(){return "auth-token="+createToken({id:userId,email:"test@example.com",role:"user"});}
function request(value:string){
 return new NextRequest("https://cardashdetailing.com/api/account/phone",
 {method:"POST",headers:{"Content-Type":"application/json",cookie:authCookie()},
 body:JSON.stringify({action:"verify",phone,code:value})});
}
function statusRequest(){
 return new NextRequest("https://cardashdetailing.com/api/account/phone-connection",
 {method:"GET",headers:{cookie:authCookie()}});
}
function removeRequest(number:string){
 return new NextRequest("https://cardashdetailing.com/api/account/phone-connection",
 {method:"DELETE",headers:{"Content-Type":"application/json",cookie:authCookie(),origin:"https://cardashdetailing.com"},
 body:JSON.stringify({phone:number,confirmation:"REMOVE"})});
}
async function main(){
 challenge();
 assert.equal((await POST(request("000000"))).status,400);
 assert.equal(linked,"");
 assert.equal((await POST(request(code))).status,200);
 assert.equal(linked,"user1");
 assert.ok(removed);
 assert.equal(values.get("verified_phone_"+phone),"user1");
 assert.deepEqual((await (await GET(statusRequest())).json()).phones,[phone]);
 userId="user2";
 challenge();
 assert.equal((await POST(request(code))).status,400);
 assert.equal(linked,"user1");
 assert.deepEqual((await (await GET(statusRequest())).json()).phones,[]);
 assert.equal((await DELETE(removeRequest(phone))).status,409,"Another user cannot unlink this number");
 userId="user1";
 assert.equal((await DELETE(removeRequest(phone))).status,200);
 assert.equal(values.has("verified_phone_"+phone),false);
 assert.ok(Number(values.get("phone_released_at_"+phone))>0,"Unlink marks release time");
 assert.deepEqual((await (await GET(statusRequest())).json()).phones,[]);
 userId="user2";
 challenge();
 assert.equal((await POST(request(code))).status,200,"New holder can verify after the original user releases the number");
 assert.equal(values.get("verified_phone_"+phone),"user2");
 console.log("Phone OTP ownership, linked status, safe unlink, and number transfer verified.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
