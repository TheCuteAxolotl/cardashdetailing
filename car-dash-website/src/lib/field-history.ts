import type {Prisma} from "@prisma/client";
import {archiveDeletion,type DeletedRecord} from "@/lib/deletion-history";

const bookingGraph = {detailJob:{include:{photos:true}},conversation:{include:{messages:true}}} as const;
type Graph = Prisma.BookingGetPayload<{include:typeof bookingGraph}>;
export async function archiveBooking(tx:Prisma.TransactionClient,id:string,actor:{id:string;name:string}) {
  await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${id} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "DetailJob" WHERE id=${id} FOR UPDATE`;
  const booking=await tx.booking.findUnique({where:{id},include:bookingGraph});
  if(!booking || !["completed","cancelled"].includes(booking.status)) return false;
  const job=booking.detailJob;
  const snapshot={...booking,detailJob:job && {...job,photos:job.photos.map(p=>({...p,bytes:Buffer.from(p.bytes).toString("base64")}))}};
  await archiveDeletion(tx,{kind:"booking",entityId:id,actor,scope:"owner",summary:booking.serviceName+" · "+booking.customerName,snapshot});
  await tx.booking.delete({where:{id}});
  return true;
}
export async function restoreBooking(tx:Prisma.TransactionClient,record:DeletedRecord) {
  const {conversation,detailJob,...booking}=record.snapshot as Graph;
  await tx.booking.create({data:booking});
  if(conversation){
    const {messages,...thread}=conversation;
    await tx.bookingConversation.create({data:thread});
    if(messages.length) await tx.bookingMessage.createMany({data:messages});
  }
  if(detailJob){
    const {photos,...job}=detailJob;
    await tx.detailJob.create({data:{...job,data:job.data as Prisma.InputJsonValue}});
    if(photos.length)await tx.detailJobPhoto.createMany({data:photos.map(p=>({...p,bytes:Buffer.from(String(p.bytes),"base64")}))});
  }
}
