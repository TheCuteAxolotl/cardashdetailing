import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { createToken } from '../src/lib/auth';
import { parseGiftAmount, changeGiftCard, giftCodeFromId, type GiftCard } from '../src/lib/gift-cards';
import { GET, POST } from '../src/app/api/owner/gift-cards/route';
import { POST as checkBalance } from '../src/app/api/gift-cards/route';
import { GET as qr } from '../src/app/gift-cards/qr/route';
async function main() {
  assert.equal(parseGiftAmount('19.99'),1999);
  for(const amount of ['-1','NaN','1e2','1.001','10000.01']) assert.throws(()=>parseGiftAmount(amount));
  const rows=new Map<string,{key:string;value:string}>();
  assert.equal((await GET(new NextRequest('https://cardashdetailing.com/api/owner/gift-cards'))).status,403);
  assert.equal((await POST(new NextRequest('https://cardashdetailing.com/api/owner/gift-cards',{method:'POST',body:'{}'}))).status,403);
  Object.assign(prisma.user,{findUnique:async()=>({id:'test-owner',email:'private@example.test',name:'Test',role:'owner'})});
  Object.assign(prisma.siteContent,{
    findUnique:async({where}:{where:{key:string}})=>rows.get(where.key)||null,
    findMany:async()=>[...rows.values()],
    create:async({data}:{data:{key:string;value:string}})=>{rows.set(data.key,data);return data;},
    updateMany:async({where,data}:{where:{key:string;value:string};data:{value:string}})=>{if(rows.get(where.key)?.value!==where.value)return{count:0};rows.set(where.key,{key:where.key,...data});return{count:1};},
  });
  const token=createToken({id:'test-owner',email:'private@example.test',role:'owner'});
  const post=(body:object)=>POST(new NextRequest('https://cardashdetailing.com/api/owner/gift-cards',{method:'POST',headers:{cookie:`auth-token=${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)}));
  const requestId=randomUUID();
  const issue={action:'create',requestId,amount:'100.00',label:'Private customer',note:'Private receipt'};
  let r=await post(issue);assert.equal(r.status,201);let card=(await r.json()).card as GiftCard;
  assert.equal(card.code.length,16);assert.equal(card.code,giftCodeFromId(requestId));assert.equal(card.balance,10000);
  assert.equal((await post(issue)).status,200);assert.equal(rows.size,1);
  let spend={action:'spend',requestId:randomUUID(),code:card.code,version:card.version,amount:'25.50',note:'Service invoice test'};
  r=await post(spend);assert.equal(r.status,200);card=(await r.json()).card;assert.equal(card.balance,7450);
  r=await post(spend);assert.equal(r.status,200);assert.equal((await r.json()).card.balance,7450);
  assert.equal((await post({...spend,requestId:randomUUID()})).status,409);
  assert.equal((await post({...spend,requestId:randomUUID(),version:card.version,amount:'100'})).status,400);
  const concurrent=await Promise.all([post({...spend,requestId:randomUUID(),version:card.version}),post({...spend,requestId:randomUUID(),version:card.version})]);
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  card=JSON.parse([...rows.values()][0].value);
  assert.equal(card.balance,4900);
  r=await post({action:'set',requestId:randomUUID(),code:card.code,version:card.version,amount:'200.25',note:'Balance correction test'});assert.equal(r.status,200);card=(await r.json()).card;assert.equal(card.balance,20025);
  const view=await checkBalance(new NextRequest('https://cardashdetailing.com/api/gift-cards',{method:'POST',body:JSON.stringify({code:card.code})}));
  const exposed=await view.json();assert.deepEqual(Object.keys(exposed).sort(),['balance','lastFour','status']);assert.equal(exposed.balance,20025);assert.equal(exposed.status,'active');
  card=changeGiftCard(card,{id:randomUUID(),kind:'pause',amount:'0',note:'Lost card',actor:'test',at:new Date().toISOString()});
  assert.throws(()=>changeGiftCard(card,{id:randomUUID(),kind:'spend',amount:'1',note:'Test',actor:'test',at:new Date().toISOString()}),/Resume/);
  const svg=await (await qr()).text();assert.match(svg,/<svg/);assert.equal(svg,await(await qr()).text());
  Object.assign(prisma.user,{findUnique:async()=>null});assert.equal((await post(issue)).status,403);
  console.log('Gift-card checks passed: cents, validation, owner access, issuance retries, deductions, overdrafts, concurrent writes, adjustments, public privacy, pause and shared QR.');
}
void main();
