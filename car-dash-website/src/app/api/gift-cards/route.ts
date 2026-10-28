import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GIFT_PREFIX, cleanGiftCode, validGiftCode, type GiftCard } from '@/lib/gift-cards';
export const dynamic = 'force-dynamic';
// Return only the card-holder view. Never expose names, notes, receipt references or staff history.
export async function POST(request: NextRequest) {
  const headers = {'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
  try {
    const body = await request.json().catch(()=>null);
    const code = cleanGiftCode(body?.code);
    if (!validGiftCode(code)) return NextResponse.json({error:'Enter the full code printed on your gift card.'},{status:400,headers});
    const row = await prisma.siteContent.findUnique({where:{key:GIFT_PREFIX+code}});
    if (!row) return NextResponse.json({error:'Gift card not found. Check the code or contact Car Dash.'},{status:404,headers});
    const card = JSON.parse(row.value) as GiftCard;
    if (card.deletedAt) return NextResponse.json({error:'This gift card is no longer available.'},{status:404,headers});
    // Public cardholder summary only: no purchaser, recipient, events, private notes, or full code.
    const status = card.paused ? 'paused' : card.used ? 'used' : card.balance > 0 ? 'active' : 'empty';
    return NextResponse.json({
      balance: Math.max(0, Math.floor(Number(card.balance) || 0)),
      status,
      lastFour: card.code.slice(-4),
    }, { headers });
  } catch { return NextResponse.json({error:'Unable to check the balance right now. Please retry.'},{status:503,headers}); }
}
