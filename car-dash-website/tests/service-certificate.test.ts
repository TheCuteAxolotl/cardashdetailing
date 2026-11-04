import assert from 'node:assert/strict';
import { certificateDetails, escapeCertificateHtml } from '../src/lib/service-certificate';
import { ensureBookingReference, newBookingReference, normalizeBookingReference } from '../src/lib/booking-reference';
import { POST as lookup } from '../src/app/api/service-lookup/route';
import { GET as certificate } from '../src/app/api/bookings/[id]/certificate/route';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { sanitizeInvoiceInput } from '../src/lib/invoices';

async function main() {
 const records = new Map<string, {key: string; value: string}>();
 // Simulate unique constraints and atomic transaction rollback without live data.
 prisma.siteContent.findUnique = (async ({where}: any) => records.get(where.key) || null) as any;
 prisma.siteContent.create = (({data}: any) => data) as any;
 prisma.$transaction = (async (rows: any[]) => {
   if(rows.some(row => records.has(row.key))) throw Object.assign(new Error('duplicate'), {code:'P2002'});
   rows.forEach(row => records.set(row.key, row)); return rows;
 }) as any;
 const refs = await Promise.all(Array.from({length: 10}, () => ensureBookingReference('one')));
 assert.equal(new Set(refs).size, 1, 'concurrent requests must keep one number');
 assert.equal(records.get(`booking-lookup:${refs[0]}`)?.value, 'one');
 assert.equal(await ensureBookingReference('one'), refs[0]);
 records.set('invoice:booking-paid-old', {key:'invoice:booking-paid-old', value:JSON.stringify({invoiceNumber:'CD-2026-0045'})});
 assert.equal(await ensureBookingReference('old'), 'CD-2026-0045');
 assert.notEqual(await ensureBookingReference('two'), refs[0]);
 assert.match(newBookingReference(), /^CD-[A-F0-9]{20}$/);
 assert.equal(normalizeBookingReference(' cd-abcd '), 'CD-ABCD');
 const booking = {serviceName:'Full Detail', preferredDate:'2026-11-04',status:'completed',vehicleYear:'2026',vehicleMake:'Tesla',vehicleModel:'Model Y',vehicleTrim:null,notes:'Add-ons: Pet Hair (+$39.00)\nService address: PRIVATE\nCustomer notes: PRIVATE',customerName:'PRIVATE', customerPhone:'PRIVATE'};
 const details = certificateDetails(booking, refs[0]);
 assert.deepEqual(details.services, ['Full Detail','Pet Hair']);
 assert.ok(!JSON.stringify(details).includes('PRIVATE'));
 assert.equal(details.serviceDate, '2026-11-04');
 assert.equal(escapeCertificateHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
 const existing = sanitizeInvoiceInput({id:'booking-paid-one',invoiceNumber:refs[0]});
 assert.equal(sanitizeInvoiceInput({...existing,invoiceNumber:'CHANGED'},existing).invoiceNumber,refs[0]);
 prisma.booking.findUnique = (async () => booking) as any;
 const response = await lookup(new Request('https://example.com/api/service-lookup', {method:'POST',body:JSON.stringify({number:refs[0].toLowerCase()})}));
 assert.equal(response.status,200);
 assert.ok(!(await response.text()).includes('PRIVATE'));
 booking.status = 'cancelled';
 assert.equal((await lookup(new Request('https://example.com/api/service-lookup', {method:'POST',body:JSON.stringify({number:refs[0]})}))).status,404);
 assert.equal((await lookup(new Request('https://example.com/api/service-lookup', {method:'POST',body:JSON.stringify({number:'invalid'})}))).status,400);
 assert.equal((await certificate(new NextRequest('https://example.com/api/bookings/one/certificate'),{params:Promise.resolve({id:'one'})})).status,403);
 console.log('Certificate tests passed: concurrency, stable references, legacy receipts, privacy, escaping, invoice number lock.');
}
main();
