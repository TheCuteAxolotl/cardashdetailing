export const GIFT_PREFIX = 'owner:gift-card:';
export type GiftEvent = { id: string; kind: 'payment' | 'issue' | 'load' | 'spend' | 'set' | 'pause' | 'resume' | 'used' | 'delete'; delta: number; balance: number; note: string; actor: string; at: string };
export type GiftCard = { code: string; id: string; label: string; balance: number; paused: boolean; used?: boolean; deletedAt?: string; version: number; createdAt: string; purchaserName?: string; recipientName?: string; paidValue?: number; paymentStatus?: "paid" | "unpaid"; events: GiftEvent[] };
export function cleanGiftCode(value: unknown) { return typeof value === 'string' ? value.replace(/[\s-]/g, '').toUpperCase() : ''; }
export function giftCodeFromId(id: string) { const raw = cleanGiftCode(id); return (raw.slice(0, 12) + raw.slice(-8)).slice(0,16); }
export function validGiftCode(value: string) { return /^(?:[A-F0-9]{16}|[A-F0-9]{20})$/.test(value); }
export function displayGiftCode(value: string) { return value.match(/.{1,4}/g)?.join('-') || value; }
export function giftMoney(cents: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100); }
export function parseGiftAmount(value: unknown) {
  if (typeof value !== 'string' || !/^\d{1,5}(\.\d{1,2})?$/.test(value.trim())) throw new Error('Enter a dollar amount with no more than two decimal places.');
  const [dollars, decimal = ''] = value.trim().split('.');
  const cents = Number(dollars) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 1000000) throw new Error('The maximum balance is $10,000.');
  return cents;
}
export function changeGiftCard(card: GiftCard, input: { id: string; kind: GiftEvent['kind']; amount: unknown; note: string; actor: string; at: string }): GiftCard {
  if (card.events.some(e => e.id === input.id)) return card;
  if (card.deletedAt) throw new Error('This card was deleted.');
  if (!input.note) throw new Error('Enter a receipt reference or reason for this change.');
  let balance = card.balance, paused = card.paused;
  if (input.kind === 'payment') { if(card.paymentStatus==='paid') throw new Error('Payment is already recorded.'); }
  else if (input.kind === 'delete') {
    if (balance !== 0) throw new Error('Use or resolve the remaining balance before deleting this card.');
  }
  else if (input.kind === 'used') balance = 0;
  else if (input.kind === 'pause') { if (paused) throw new Error('This card is already paused.'); paused = true; }
  else if (input.kind === 'resume') { if (!paused) throw new Error('This card is already active.'); paused = false; }
  else {
    if (paused) throw new Error('Resume this card before changing its balance.');
    const amount = parseGiftAmount(input.amount);
    if (input.kind === 'load') { if (!amount) throw new Error('Enter an amount greater than zero.'); balance += amount; }
    else if (input.kind === 'spend') { if (!amount) throw new Error('Enter an amount greater than zero.'); balance -= amount; }
    else if (input.kind === 'set') balance = amount;
    else throw new Error('Invalid gift-card action.');
    if (balance < 0) throw new Error('This card does not have enough money for that purchase.');
    if (balance > 1000000) throw new Error('The maximum balance is $10,000.');
  }
  const funded=card.events.filter(e=>['issue','load'].includes(e.kind)).reduce((sum,e)=>sum+Math.max(0,e.delta),0);
  const previouslyPaid=card.paidValue ?? (card.paymentStatus==='paid'||card.events.some(e=>e.actor==='Stripe checkout')?funded:0);
  return { ...card, paidValue: input.kind==='payment'?funded:previouslyPaid, paymentStatus: input.kind === 'payment' ? 'paid' : input.kind === 'load' ? 'unpaid' : card.paymentStatus, balance, paused, used: input.kind === 'used' || (balance === 0 && (input.kind === 'spend' || !!card.used)), deletedAt: input.kind === 'delete' ? input.at : card.deletedAt, version: card.version + 1, events: [...card.events, { id: input.id, kind: input.kind, delta: balance - card.balance, balance, note: input.note, actor: input.actor, at: input.at }] };
}
