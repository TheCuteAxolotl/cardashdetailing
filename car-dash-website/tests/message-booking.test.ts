import assert from "node:assert/strict";
import {prisma} from "../src/lib/prisma";
import {createBookingWithSlotProtection,BookingSlotConflictError} from "../src/lib/booking-slot";
let creates=0,busy=false;
const links=new Map<string,string>(),bookings=new Map<string,any>();
const tx={
 $queryRaw:async()=>[],
 siteContent:{findUnique:async({where}:any)=>links.has(where.key)?{value:links.get(where.key)}:null,upsert:async({where,create}:any)=>{links.set(where.key,create.value);}},
 booking:{findUnique:async({where}:any)=>bookings.get(where.id)||null,findMany:async()=>busy?[{preferredTime:"10:00 AM",serviceName:"Full Detail",notes:null}]:[],create:async({data}:any)=>{const booking={id:`booking-${++creates}`,...data};bookings.set(booking.id,booking);return booking;}},
};
(prisma as any).$transaction=async(fn:any)=>fn(tx);
const data={customerName:"Test",customerEmail:"test@example.com",customerPhone:"",vehicleMake:"Test",vehicleModel:"Test",vehicleYear:"2020",serviceName:"Full Detail",status:"confirmed",preferredDate:"2026-11-01",preferredTime:"10:00",notes:"Booking source: SMS"};
async function main(){
 const a=await createBookingWithSlotProtection(data,{messageSourceKey:"message_booking_a"});
 assert.equal(a.status,"confirmed");assert.equal(links.get("message_booking_a"),a.id);
 const retry=await createBookingWithSlotProtection(data,{messageSourceKey:"message_booking_a"});
 assert.equal(retry.id,a.id);assert.equal(creates,1);
 busy=true;await assert.rejects(()=>createBookingWithSlotProtection(data,{messageSourceKey:"message_booking_b"}),BookingSlotConflictError);
 assert.equal(creates,1);assert.ok(!links.has("message_booking_b"));
 console.log("Message booking confirms schedule status, reuses duplicate conversion, and rejects overlapping appointments.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
