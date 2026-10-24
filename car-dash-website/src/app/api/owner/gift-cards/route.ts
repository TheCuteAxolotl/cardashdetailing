import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAccountFromRequest, isOwnerAccount } from '@/lib/permissions';
import { GIFT_PREFIX, giftCodeFromId, cleanGiftCode, validGiftCode, parseGiftAmount, changeGiftCard, type GiftCard } from '@/lib/gift-cards';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: NextRequest) {
  try {
    if (!isOwnerAccount(await getCurrentAccountFromRequest(request))) return reply({error:'Owner access required'},403);
    const rows = await prisma.siteContent.findMany({where:{key:{startsWith:GIFT_PREFIX}},orderBy:{updatedAt:'desc'}});
    return reply({cards:rows.map(row => JSON.parse(row.value) as GiftCard).filter(card=>!card.deletedAt)});
  } catch { return reply({error:'Could not load gift cards. Please retry.'},500); }
}
export async function POST(request: NextRequest) {
  try {
    const account = await getCurrentAccountFromRequest(request);
    if (!account || !isOwnerAccount(account)) return reply({error:'Owner access required'},403);
    if (request.headers.get('sec-fetch-site') === 'cross-site') return reply({error:'Invalid request origin'},403);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return reply({error:'Invalid request'},400);
    if (typeof body.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId)) return reply({error:'Refresh and try again.'},400);
    const code = body.action === 'create' ? giftCodeFromId(body.requestId) : cleanGiftCode(body.code);
    if (!validGiftCode(code)) return reply({error:'Invalid gift-card code'},400);
    const key = GIFT_PREFIX + code;
    const row = await prisma.siteContent.findUnique({where:{key}});
    const note = typeof body.note === 'string' ? body.note.trim().slice(0,1000) : '';
    const now = new Date().toISOString();
    if (body.action === 'create') {
      if (row) { const existing = JSON.parse(row.value) as GiftCard; return existing.id === body.requestId ? reply({card:existing}) : reply({error:'Card number collision. Start a new card.'},409); }
      let amount: number;
      try { amount = parseGiftAmount(body.amount); } catch(e) { return reply({error:(e as Error).message},400); }
      if (amount > 0 && !note) return reply({error:'Record the payment reference or reason for issuing this value.'},400);
      const card: GiftCard = {code,id:body.requestId,label:typeof body.label==='string'?body.label.trim().slice(0,120):'',balance:amount,paused:false,version:1,createdAt:now,events:[{id:body.requestId,kind:'issue',delta:amount,balance:amount,note:note || 'Blank card issued',actor:account.email,at:now}]};
      await prisma.siteContent.create({data:{key,value:JSON.stringify(card)}});
      return reply({card},201);
    }
    if (!row) return reply({error:'Gift card not found'},404);
    const card = JSON.parse(row.value) as GiftCard;
    if (card.events.some(e=>e.id===body.requestId)) return reply({card});
    if (body.version!==card.version) return reply({error:'The balance changed in another session. Refresh before trying again.'},409);
    if (!['load','spend','set','pause','resume','used','delete'].includes(body.action)) return reply({error:'Invalid action'},400);
    let next: GiftCard;
    try { next = changeGiftCard(card,{id:body.requestId,kind:body.action,amount:body.amount,note,actor:account.email,at:now}); } catch(e) { return reply({error:(e as Error).message},400); }
    const result = await prisma.siteContent.updateMany({where:{key,value:row.value},data:{value:JSON.stringify(next)}});
    if (!result.count) return reply({error:'Another update arrived first. Refresh before trying again.'},409);
    return reply({card:next});
  } catch(e) {
    if (e && typeof e==='object' && 'code' in e && e.code==='P2002') return reply({error:'This card was already created. Refresh the list.'},409);
    return reply({error:'Could not save. Retry the same request or refresh to check the record.'},500);
  }
}
