import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasJobAccess, jobAccount, JobError, jobResponseError, lockedJob, noStore } from "@/lib/jobs";
import { type JobRow } from "@/lib/job-workflow";
import { calculateInvoiceTotals, sanitizeInvoiceInput, type InvoiceRecord } from "@/lib/invoices";
import { paidReceiptInvoiceId } from "@/lib/paid-receipt";
import { newBookingReference } from "@/lib/booking-reference";
import { hasStaffPermission, isOwnerAccount } from "@/lib/permissions";

type Context = {params: Promise<{id:string}>};
type Actor = Awaited<ReturnType<typeof jobAccount>>;
function supervisor(actor: Actor) {
  return isOwnerAccount(actor) || (hasStaffPermission(actor,"invoices") &&
    (actor.role === "admin" || actor.customRoles.some(r => r.name.toLowerCase() === "manager")));
}
function validMoney(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100000 && Math.abs(value*100-Math.round(value*100)) < 0.00001;
}
export async function GET(req: NextRequest, context: Context) {
  try {
    const actor = await jobAccount(req);
    const {id} = await context.params;
    const [job] = await prisma.$queryRaw<JobRow[]>`SELECT * FROM "DetailJob" WHERE id=${id}`;
    if (!job || !await hasJobAccess(prisma,actor,job)) throw new JobError("Job unavailable.",404);
    const [booking, invoice, rows] = await Promise.all([
      prisma.booking.findUnique({where:{id},select:{quotedPrice:true}}),
      prisma.siteContent.findUnique({where:{key:"invoice:"+paidReceiptInvoiceId(id)}}),
      prisma.siteContent.findMany({where:{key:{startsWith:"collection:"+id+":"}},orderBy:{createdAt:"desc"}}),
    ]);
    const doc: InvoiceRecord | null = invoice && JSON.parse(invoice.value);
    return NextResponse.json({balance:doc ? (doc.status === "void" ? null : calculateInvoiceTotals(doc).balance) : rows.length ? null : booking?.quotedPrice,
      supervisor:supervisor(actor), rows: rows.map(r=>JSON.parse(r.value))}, {headers:noStore});
  } catch(e) { return jobResponseError(e); }
}
export async function POST(req: NextRequest, context: Context) {
  try {
    const actor = await jobAccount(req,true);
    const {id} = await context.params;
    const b = await req.json();
    if (!/^[a-f0-9-]{36}$/.test(String(b.requestId))) throw new JobError("Invalid payment reference.");
    const key = "collection:"+id+":"+b.requestId;
    await prisma.$transaction(async tx=>{
      await lockedJob(tx,id,actor,b.version);
      const prior = await tx.siteContent.findUnique({where:{key}});
      if (b.action === "handoff") {
        if (!supervisor(actor) || !prior) throw new JobError("Supervisor access required.",403);
        const record = JSON.parse(prior.value);
        if (record.method !== "Cash" || record.collectorId === actor.id) throw new JobError("A separate supervisor must receive this cash.");
        if (record.handoff) return;
        if (typeof b.counted !== "number" || !validMoney(b.counted)) throw new JobError("Enter counted cash.");
        record.handoff = {counted:b.counted,variance:Math.round((b.counted-record.received)*100)/100,by:actor.name,byId:actor.id,at:new Date().toISOString()};
        await tx.siteContent.update({where:{key},data:{value:JSON.stringify(record)}});
        return;
      }
      if (b.action !== "collect") throw new JobError("Unknown action.");
      if (prior) return;
      const booking = await tx.booking.findUniqueOrThrow({where:{id}});
      if (!["confirmed","completed"].includes(booking.status)) throw new JobError("Booking must be confirmed.");
      const invoiceId = paidReceiptInvoiceId(id), invoiceKey = "invoice:"+invoiceId;
      const row = await tx.siteContent.findUnique({where:{key:invoiceKey}});
      let invoice:InvoiceRecord;
      if (row) invoice=JSON.parse(row.value);
      else {
        if(await tx.siteContent.findFirst({where:{key:{startsWith:"collection:"+id+":"}},select:{id:true}}))throw new JobError("Restore the original invoice before collecting another payment.",409);
        if (booking.quotedPrice == null || booking.quotedPrice <= 0) throw new JobError("Set the booking price before collecting.");
        const refKey="booking-reference:"+id;
        const saved=await tx.siteContent.findUnique({where:{key:refKey}});
        const number=saved?.value || newBookingReference();
        if(!saved)await tx.siteContent.createMany({data:[{key:refKey,value:number},{key:"booking-lookup:"+number,value:id}]});
        invoice=sanitizeInvoiceInput({id:invoiceId,invoiceNumber:number,customerName:booking.customerName,customerEmail:booking.customerEmail,customerPhone:booking.customerPhone,serviceDate:booking.preferredDate,source:"booking-paid:"+id,lineItems:[{id:"service",description:booking.serviceName,quantity:1,rate:booking.quotedPrice}]});
        invoice.createdById=actor.id; invoice.createdByName=actor.name;
      }
      const shown=calculateInvoiceTotals(invoice).balance;
      if (invoice.status==="void" || b.shown!==shown) throw new JobError("Invoice changed. Refresh the balance.",409);
      if (typeof b.amount!=="number" || !validMoney(b.amount) || b.amount<=0 || b.amount>shown) throw new JobError("Enter a payment within the outstanding balance.");
      if (!["Cash","Card (outside website)","Check","Zelle","Venmo","Other"].includes(b.method)) throw new JobError("Choose a payment method.");
      if (invoice.payments.length>=100) throw new JobError("Invoice payment limit reached.");
      const at=new Date().toISOString(), reference=String(b.reference||"").trim().slice(0,120);
      const updated=sanitizeInvoiceInput({...invoice,status:"partial",payments:[...invoice.payments,{id:b.requestId,amount:b.amount,method:b.method,reference,paidAt:at}]},invoice);
      const value=JSON.stringify(updated);
      if (row) {
        const changed=await tx.siteContent.updateMany({where:{key:invoiceKey,value:row.value},data:{value}});
        if (!changed.count) throw new JobError("Invoice changed. Refresh the balance.",409);
      } else await tx.siteContent.create({data:{key:invoiceKey,value}});
      await tx.siteContent.create({data:{key,value:JSON.stringify({id:b.requestId,at,shown,received:b.amount,balance:calculateInvoiceTotals(updated).balance,method:b.method,reference,collector:actor.name,collectorId:actor.id,handoff:null})}});
    });
    return NextResponse.json({ok:true});
  } catch(e) { return jobResponseError(e); }
}
