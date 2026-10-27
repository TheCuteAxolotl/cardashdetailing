import assert from "node:assert/strict";
import {NextRequest} from "next/server";
import {prisma} from "../src/lib/prisma";
import {createToken} from "../src/lib/auth";
import {GET,POST} from "../src/app/api/owner/notifications/route";
const db=prisma as any;
let calls=0,savedKey="";
db.user.findUnique=async()=>({id:"owner-test",role:"owner",email:"owner@example.com",name:"Owner"});
db.siteContent.findMany=async()=>[];
db.siteContent.findUnique=async()=>null;
db.siteContent.upsert=async({where}:any)=>{savedKey=where.key;};
db.booking.count=async({where}:any)=>{assert.equal(where.status,"pending");calls++;return 2;};
db.$queryRaw=async()=>[{count:BigInt(3)}];
db.unmatchedSmsMessage.count=async({where}:any)=>{assert.equal(where.direction,"inbound");return 4;};
db.quoteMessage.count=async({where}:any)=>{assert.equal(where.sender,"customer");assert.deepEqual(where.thread.status.notIn,["booked","closed"]);return 5;};
db.supportMessage.count=async()=>6;
db.callLog.count=async()=>1;
const token=createToken({id:"owner-test",role:"owner",email:"owner@example.com"});
function request(body?:object){return new NextRequest("https://cardashdetailing.com/api/owner/notifications",{method:body?"POST":"GET",headers:{cookie:`auth-token=${token}`,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});}
async function main(){
 const denied=await GET(new NextRequest("https://cardashdetailing.com/api/owner/notifications"));assert.equal(denied.status,401);assert.equal(calls,0);
 const response=await GET(request());assert.equal(response.status,200);const data=await response.json();assert.equal(data.counts["/owner/messages"],7);assert.equal(data.counts["/owner/bookings"],2);assert.equal(data.counts["/owner/email"],0);
 assert.equal((await POST(request({section:"__proto__"}))).status,403);
 assert.equal((await POST(request({section:"quotes"}))).status,200);assert.equal(savedKey,"notification_seen_owner-test_quotes");
 console.log("Notification access, pending/unread filters, direct SMS totals, disconnected Gmail, and per-account acknowledgement passed.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
