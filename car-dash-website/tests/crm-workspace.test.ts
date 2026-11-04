import assert from "node:assert/strict";
import { revenueForMonth,serviceCategory } from "../src/lib/revenue-by-service";
import type { InvoiceRecord } from "../src/lib/invoices";

assert.equal(serviceCategory("Full Detail"),"Full Detail");
assert.equal(serviceCategory("Ceramic Coating 5-Year"),"Ceramic Coating");
assert.equal(serviceCategory("Paint Correction 2 Step"),"Paint Correction");
assert.equal(serviceCategory("Full Interior Detail"),"Interior Detail");
assert.equal(serviceCategory("Maintenance Wash"),"Maintenance Wash");
const invoice={
 id:"invoice1",status:"partial",
 lineItems:[{id:"1",description:"Full Detail",quantity:1,rate:200},
            {id:"2",description:"Ceramic Coating",quantity:1,rate:300}],
 payments:[{id:"p1",paidAt:"2026-11-02T11:00:00.000Z",amount:250,method:"Cash"},
           {id:"p2",paidAt:"2026-12-10T11:00:00.000Z",amount:250,method:"Cash"}],
} as InvoiceRecord;
const voidInvoice={...invoice,id:"void",status:"void"} as InvoiceRecord;
const nov=revenueForMonth([invoice,voidInvoice],"2026-11");
assert.equal(nov.total,250);
assert.equal(nov.paymentCount,1);
assert.equal(nov.invoiceCount,1);
assert.equal(nov.categories.find(x=>x.service==="Full Detail")?.received,100);
assert.equal(nov.categories.find(x=>x.service==="Ceramic Coating")?.received,150);
const dec=revenueForMonth([invoice],"2026-12");
assert.equal(dec.total,250);
assert.equal(dec.categories.length,2);
assert.equal(revenueForMonth([invoice],"2026-10").total,0);
console.log("CRM revenue uses real paid invoice entries, excludes void invoices and allocates split receipts correctly.");
