import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { createToken } from '../src/lib/auth';
import { POST as convert } from '../src/app/api/quotes/[id]/booking/route';
import { POST as manual } from '../src/app/api/bookings/manual/route';
import { conversionPrice, conversionDuration } from '../src/lib/conversion-input';
import { updateQuoteState } from '../src/lib/quote-state';
import { createBookingWithSlotProtection, BookingSlotConflictError } from '../src/lib/booking-slot';
import { savedDuration } from '../src/lib/booking-duration';

const db = prisma as any;
const version = new Date('2026-10-28T12:00:00Z');
let quote = { id: 'quote', status: 'open', updatedAt: version, userId: null, vehicleId: null };
let creates = 0;
let busy: any[] = [];
const locks: string[] = [];
const tx = {
  $queryRaw: async (_strings: unknown, key: string) => { locks.push(key); return []; },
  quoteThread: {
    findUnique: async () => quote,
    update: async ({data}: any) => { quote = {...quote, ...data}; return quote; },
  },
  booking: {
    findMany: async () => busy,
    create: async ({data}: any) => ({ id: `booking-${++creates}`, ...data }),
  },
};
db.$transaction = async (fn: any) => fn(tx);
db.user.findUnique = async () => ({id: 'owner', role: 'owner', email: 'owner@example.com', name: 'Owner'});
db.quoteThread.findUnique = async () => ({...quote});
const token = createToken({id: 'owner', role: 'owner', email: 'owner@example.com'});
const details = {customerEmail: '', customerPhone: '', vehicleMake: 'Test', vehicleModel: 'Test', vehicleYear: '2020', customerName: 'Test', serviceName: 'Custom job', preferredDate: '2026-11-20', preferredTime: '10:00', quotedPrice: '100.129', durationMinutes: '300', serviceMethod: 'shop'};
function req(body: object) {
  return new NextRequest('https://cardashdetailing.com/api/test', {method: 'POST', headers: {'Content-Type': 'application/json', cookie: `auth-token=${token}`}, body: JSON.stringify(body)});
}
const params = {params: Promise.resolve({id: 'quote'})};
async function main() {
  for (const invalid of [null, undefined, '', '  ', true, false, [], {}, -1, Infinity, 'NaN']) assert.equal(conversionPrice(invalid), null);
  assert.equal(conversionPrice('0'), 0);
  assert.equal(conversionPrice('100.129'), 100.13);
  assert.equal(conversionDuration('31'), 45);
  for (const invalid of [null, '', 0, 29, 961, true]) assert.equal(conversionDuration(invalid), null);
  for (const invalid of [null, '', ' ', true, -1]) assert.equal((await convert(req({...details, quotedPrice: invalid}), params)).status, 400);
  assert.equal(creates, 0);
  let response = await convert(req(details), params);
  assert.equal(response.status, 201);
  let booking = (await response.json()).booking;
  assert.equal(booking.serviceMethod, 'mobile');
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.quotedPrice, 100.13);
  assert.equal(savedDuration(booking.notes, booking.serviceName), 300);
  assert.equal(quote.status, 'booked');
  assert.deepEqual(locks.slice(0, 2), ['quote-booking:quote', 'car-dash-booking:2026-11-20']);
  assert.equal((await convert(req(details), params)).status, 409);
  assert.equal(await updateQuoteState('quote', version, {status: 'open'}), null);
  assert.equal(creates, 1);
  quote = {...quote, status: 'open'};
  busy = [{preferredTime: '2:00 PM', serviceName: 'Test', notes: 'Estimated duration minutes: 60'}];
  assert.equal((await convert(req(details), params)).status, 409); // 10am + 5h overlaps 2pm.
  assert.equal(quote.status, 'open');
  busy = [];
  quote = {...quote, updatedAt: new Date(version.getTime() + 1)};
  assert.equal(await updateQuoteState('quote', version, {status: 'accepted'}), null);
  await assert.rejects(() => createBookingWithSlotProtection({...details, quotedPrice: 100}, {quoteThreadId: 'quote', expectedQuoteUpdatedAt: version}), BookingSlotConflictError);
  quote = {...quote, updatedAt: version};
  await assert.rejects(() => createBookingWithSlotProtection({...details, quotedPrice: 100}, {quoteThreadId: 'quote', expectedQuoteStatus: 'accepted'}), BookingSlotConflictError);
  assert.equal((await updateQuoteState('quote', version, {status: 'quoted'}))?.status, 'quoted');
  response = await manual(req({...details, quotedPrice: ''}));
  assert.equal(response.status, 201);
  booking = (await response.json()).booking;
  assert.equal(booking.quotedPrice, null);
  assert.equal(booking.serviceMethod, 'mobile');
  response = await convert(req({...details, quotedPrice: 0}), params);
  assert.equal(response.status, 201);
  assert.equal((await response.json()).booking.quotedPrice, 0);
  console.log('Booking safety: strict conversion prices, optional manual price, mobile enforcement, duration overlap, duplicate conversion and stale quote guards passed (mocked database).');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
