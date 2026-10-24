import assert from 'node:assert/strict';
import { appendLoyaltyEvent, loyaltyTotals, type LoyaltyCard, type LoyaltyEvent } from '../src/lib/loyalty';
import { GET, POST } from '../src/app/api/owner/loyalty/route';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { createToken } from '../src/lib/auth';
import { randomUUID } from 'node:crypto';
const base: LoyaltyCard = { id: 'test', vin: '1HGCM82633A004352', customer: 'Test only', phone: '0000000000', vehicle: 'Test car', version: 1, createdAt: '2026-10-24', events: [] };
const event = (id: string, type: LoyaltyEvent['type'] = 'visit', extra: Partial<LoyaltyEvent> = {}): LoyaltyEvent => ({ id, type, credits: type === 'visit' ? 1 : type === 'redeem' ? -4 : 0, date: '2026-10-24', service: 'Full Detail', reference: '', notes: '', actor: 'test', recordedAt: '2026-10-24', ...extra });
async function main() {
  assert.throws(() => appendLoyaltyEvent(base, event('early', 'redeem')), /Four verified/);
  let card = base;
  for (let n=1; n<=4; n++) card = appendLoyaltyEvent(card, event(String(n)));
  assert.equal(loyaltyTotals(card).rewards, 1);
  assert.equal(appendLoyaltyEvent(card, event('4')).events.length, 4);
  card = appendLoyaltyEvent(card, event('redeem', 'redeem'));
  assert.deepEqual(loyaltyTotals(card), { earned: 4, redeemed: 1, balance: 0, rewards: 0, progress: 0 });
  assert.throws(() => appendLoyaltyEvent(card, event('repeat', 'redeem')), /Four verified/);
  assert.throws(() => appendLoyaltyEvent(card, event('undo', 'void', { targetId: '1', notes: 'Mistake' })), /Reverse the reward/);
  card = appendLoyaltyEvent(card, event('undo-reward', 'void', { targetId: 'redeem', notes: 'Cancelled service' }));
  assert.equal(loyaltyTotals(card).balance, 4);
  assert.throws(() => appendLoyaltyEvent(card, event('double-undo', 'void', { targetId: 'redeem', notes: 'Again' })), /cannot be reversed/);
  card = appendLoyaltyEvent(card, event('undo-visit', 'void', { targetId: '1', notes: 'Duplicate entry' }));
  assert.equal(loyaltyTotals(card).balance, 3);
  card = appendLoyaltyEvent(card, event('ref', 'visit', { reference: 'receipt-1' }));
  assert.throws(() => appendLoyaltyEvent(card, event('duplicate-ref', 'visit', { reference: 'receipt-1' })), /already recorded/);
  assert.equal((await GET(new NextRequest('https://cardashdetailing.com/api/owner/loyalty'))).status, 403);
  assert.equal((await POST(new NextRequest('https://cardashdetailing.com/api/owner/loyalty', { method: 'POST', body: '{}' }))).status, 403);
  // Exercise authenticated handlers against an isolated in-memory database adapter.
  const rows = new Map<string, { key: string; value: string }>();
  Object.assign(prisma.user, { findUnique: async () => ({ id: 'test-owner', email: 'owner@example.test', name: 'Test', role: 'owner' }) });
  Object.assign(prisma.siteContent, {
    findUnique: async ({where}: {where: {key: string}}) => rows.get(where.key) || null,
    findMany: async () => [...rows.values()],
    create: async ({data}: {data: {key: string; value: string}}) => { rows.set(data.key, data); return data; },
    updateMany: async ({where, data}: {where: {key: string; value: string}; data: {value: string}}) => { if (rows.get(where.key)?.value !== where.value) return {count: 0}; rows.set(where.key, {key: where.key, ...data}); return {count: 1}; },
  });
  const token = createToken({id: 'test-owner', email: 'owner@example.test', role: 'owner'});
  const headers = {cookie: `auth-token=${token}`, 'Content-Type': 'application/json'};
  const post = (body: object) => POST(new NextRequest('https://cardashdetailing.com/api/owner/loyalty', {method: 'POST', headers, body: JSON.stringify(body)}));
  const issue = {action: 'create', requestId: randomUUID(), vin: base.vin, customer: 'Test Customer', phone: '0000000000', vehicle: 'Test Vehicle', date: '2026-01-01', opening: 0};
  assert.equal((await post({...issue, vin: 'bad'})).status, 400);
  let response = await post(issue); assert.equal(response.status, 201);
  let apiCard = (await response.json()).card as LoyaltyCard;
  assert.equal((await post(issue)).status, 200);
  assert.equal((await post({...issue, requestId: randomUUID()})).status, 409);
  const visit = {action: 'visit', requestId: randomUUID(), vin: base.vin, version: apiCard.version, date: '2026-01-01', service: 'Full detail', paid: true};
  assert.equal((await post({...visit, paid: false})).status, 400);
  response = await post(visit); assert.equal(response.status, 200); apiCard = (await response.json()).card;
  assert.equal((await post(visit)).status, 200);
  assert.equal((await post({...visit, requestId: randomUUID()})).status, 409);
  for (let i=0;i<3;i++) { response = await post({...visit, requestId: randomUUID(), version: apiCard.version}); assert.equal(response.status, 200); apiCard = (await response.json()).card; }
  response = await post({...visit, action: 'redeem', requestId: randomUUID(), version: apiCard.version}); assert.equal(response.status, 200); apiCard = (await response.json()).card;
  assert.equal(loyaltyTotals(apiCard).balance, 0);
  assert.equal((await post({...visit, action: 'redeem', requestId: randomUUID(), version: apiCard.version})).status, 400);
  assert.equal((await (await GET(new NextRequest('https://cardashdetailing.com/api/owner/loyalty', {headers}))).json()).cards.length, 1);
  Object.assign(prisma.user, {findUnique: async () => null});
  assert.equal((await post(visit)).status, 403);
  console.log('Authenticated handler checks passed: creation, VIN uniqueness, paid confirmation, retries, stale writes, redemption and revoked account.');
  console.log('Loyalty checks passed: eligibility, redemption, duplicate IDs/references, reversals, and unauthenticated GET/POST.');
}
void main();
