import type { InvoiceRecord } from "@/lib/invoices";

export type ServiceRevenue={service:string;received:number;invoices:number;share:number};
export type RevenueMonth={month:string;total:number;paymentCount:number;invoiceCount:number;categories:ServiceRevenue[]};
const CATEGORIES=["Full Detail","Ceramic Coating","Paint Correction","Maintenance Wash","Interior Detail","Exterior Detail","Detail Packages","Other"];
export function serviceCategory(text:string):string{
 const name=text.toLowerCase();
 if(/ceramic|coating|gtechniq|gyeon/.test(name))return "Ceramic Coating";
 if(/paint corr|polish|swirl removal|paint enhancement|compound/.test(name))return "Paint Correction";
 if(/maintenance|subscription wash/.test(name))return "Maintenance Wash";
 if(/interior|seat shampoo|carpet|headliner|pet hair|odor/.test(name))return "Interior Detail";
 if(/exterior|headlight|engine bay|wheel|trim restore/.test(name))return "Exterior Detail";
 if(/full detail|complete detail|signature detail/.test(name))return "Full Detail";
 if(/essential|detail|wash/.test(name))return "Detail Packages";
 return "Other";
}
function cents(value:number){return Math.round((Number.isFinite(value)?value:0)*100)/100;}
function paymentMonth(value:string){
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toISOString().slice(0,7):"";
}
/** Allocate actually recorded payments, not booking quotes.
 * Splits payments among an invoice's line items proportionally; discounts
 * and any tax therefore share the same proportional allocation. */
export function revenueForMonth(invoices:InvoiceRecord[],month:string):RevenueMonth{
 const map=new Map<string,{received:number;ids:Set<string>}>();
 let paymentCount=0;
 const paidInvoices=new Set<string>();
 for(const invoice of invoices){
   if(invoice.status==="void"||invoice.status==="draft")continue;
   const payments=(invoice.payments||[]).filter(p=>paymentMonth(p.paidAt)===month&&Number(p.amount)>0);
   if(!payments.length)continue;
   paymentCount+=payments.length;
   const amount=cents(payments.reduce((sum,p)=>sum+Math.max(0,Number(p.amount)||0),0));
   if(!amount)continue;
   paidInvoices.add(invoice.id);
   const lineItems=invoice.lineItems?.filter(i=>Number(i.quantity)>0&&Number(i.rate)>=0)||[];
   const weighted=lineItems.map(i=>({
     service:serviceCategory(i.description),
     value:Math.max(0,Number(i.quantity)*Number(i.rate)),
   }));
   const subtotal=weighted.reduce((sum,i)=>sum+i.value,0);
   const buckets=subtotal>0?weighted.map(i=>({service:i.service,share:i.value/subtotal})):
    [{service:"Other",share:1}];
   // Preserve full payment total by allocating any cent-rounding remainder.
   let allocated=0;
   buckets.forEach((part,index)=>{
     const value=index===buckets.length-1?cents(amount-allocated):cents(amount*part.share);
     allocated+=value;
     const row=map.get(part.service)||{received:0,ids:new Set<string>()};
     row.received=cents(row.received+value);
     row.ids.add(invoice.id);
     map.set(part.service,row);
   });
 }
 const total=cents([...map.values()].reduce((sum,v)=>sum+v.received,0));
 return {month,total,paymentCount,invoiceCount:paidInvoices.size,
   categories:CATEGORIES.map(service=>{
     const row=map.get(service);
     return {service,received:row?.received||0,invoices:row?.ids.size||0,
       share:total>0?cents((row?.received||0)/total*100):0};
   }).filter(row=>row.received>0).sort((a,b)=>b.received-a.received)};
}
