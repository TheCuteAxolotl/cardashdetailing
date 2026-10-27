import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {NextRequest} from "next/server";
import {prisma} from "../src/lib/prisma";
import {createToken} from "../src/lib/auth";
import {POST} from "../src/app/api/account/phone/route";
process.env.NEXTAUTH_SECRET='test-phone-secret-at-least-32-characters';
const phone='+12245551234',code='123456';let userId='user1',linked='',removed=false;
const values=new Map<string,string>();
function challenge(){values.set(`phone_challenge_${userId}`,JSON.stringify({phone,hash:createHmac('sha256',process.env.NEXTAUTH_SECRET!).update(`${userId}:${phone}:${code}`).digest('hex'),sentAt:Date.now(),attempts:0}));}
const db=prisma as any;
db.user.findUnique=async()=>({id:userId,email:'test@example.com',name:'Customer',role:'user'});
db.$executeRawUnsafe=async()=>0;
db.customRoleAssignment.findMany=async()=>[];db.userPermissionOverride.findMany=async()=>[];
const tx={$queryRaw:async()=>[],siteContent:{findUnique:async({where}:any)=>values.has(where.key)?{value:values.get(where.key)}:null,upsert:async({where,create,update}:any)=>values.set(where.key,values.has(where.key)?update.value:create.value),update:async({where,data}:any)=>values.set(where.key,data.value)},quoteThread:{findMany:async()=>[],findFirst:async()=>null,create:async({data}:any)=>{linked=data.userId;return {id:'thread',...data};}},unmatchedSmsMessage:{findMany:async()=>[{id:'sms',direction:'inbound',body:'Hello',externalSid:'SMtest',createdAt:new Date()}],delete:async()=>{removed=true;}},quoteMessage:{upsert:async({create}:any)=>{assert.equal(create.externalSid,'SMtest');assert.equal(create.threadId,'thread');}},booking:{findMany:async()=>[],update:async()=>{}}};
db.$transaction=async(fn:any)=>fn(tx);
function request(value:string){return new NextRequest('https://cardashdetailing.com/api/account/phone',{method:'POST',headers:{'Content-Type':'application/json',cookie:`auth-token=${createToken({id:userId,email:'test@example.com',role:'user'})}`},body:JSON.stringify({action:'verify',phone,code:value})});}
async function main(){challenge();assert.equal((await POST(request('000000'))).status,400);assert.equal(linked,'');assert.equal((await POST(request(code))).status,200);assert.equal(linked,'user1');assert.ok(removed);assert.equal(values.get(`verified_phone_${phone}`),'user1');userId='user2';challenge();assert.equal((await POST(request(code))).status,400);assert.equal(linked,'user1');console.log('Phone linking requires correct OTP, migrates original message identity, and prevents claiming another account’s verified number.');}
main().catch(e=>{console.error(e);process.exitCode=1;});
