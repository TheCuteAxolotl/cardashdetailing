import assert from 'node:assert/strict';
import {prisma} from '../src/lib/prisma';
import {createBookingWithSlotProtection,BookingSlotConflictError} from '../src/lib/booking-slot';
let status='open',creates=0,busy=false;
const tx={$queryRaw:async()=>[],quoteThread:{findUnique:async()=>({status}),update:async({data}:any)=>{status=data.status;}},booking:{findMany:async()=>busy?[{preferredTime:'10:00 AM',serviceName:'Full Detail',notes:null}]:[],create:async({data}:any)=>{creates++;return {id:'booking',...data};}}};
(prisma as any).$transaction=async(fn:any)=>fn(tx);
const data={customerName:'Test',customerEmail:'',customerPhone:'',vehicleMake:'Test',vehicleModel:'Test',vehicleYear:'2020',serviceName:'Full Detail',status:'confirmed',preferredDate:'2026-11-01',preferredTime:'10:00',notes:'Quote ID: q'};
async function main(){
 await createBookingWithSlotProtection(data,{quoteThreadId:'q'});assert.equal(status,'booked');assert.equal(creates,1);
 await assert.rejects(()=>createBookingWithSlotProtection(data,{quoteThreadId:'q'}),BookingSlotConflictError);assert.equal(creates,1);
 status='open';busy=true;await assert.rejects(()=>createBookingWithSlotProtection(data,{quoteThreadId:'q'}),BookingSlotConflictError);assert.equal(status,'open');assert.equal(creates,1);
 console.log('Quote conversion: booking created, quote marked booked, duplicate and overlapping bookings rejected.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
