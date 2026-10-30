import assert from "node:assert/strict";
import { invoiceSmsText, isInvoiceFullyPaid, paidReceiptInvoiceId, paymentReceiptSmsText } from "../src/lib/paid-receipt";
import type { InvoiceRecord } from "../src/lib/invoices";

const invoice: InvoiceRecord = {
  id: paidReceiptInvoiceId("booking-123"),
  invoiceNumber: "CD-2026-0045",
  shareToken: "test-token",
  customerName: "Michael Johnson",
  customerPhone: "(630) 555-0110",
  customerEmail: "michael@example.com",
  assetType: "Vehicle",
  assetDescription: "2024 Toyota Camry",
  serviceDate: "2026-10-29",
  dueDate: "",
  lineItems: [{ id: "service", description: "Full Detail", quantity: 1, rate: 249 }],
  discountAmount: 0,
  taxRate: 0,
  notes: "Thank you!",
  terms: "",
  paymentOptions: {
    check: false, cash: false, online: false, other: false,
    checkPayableTo: "Car Dash Detailing", onlineLabel: "Pay online",
    onlinePaymentUrl: "", otherInstructions: "",
  },
  payments: [{ id: "paid-1", amount: 249, method: "Cash", paidAt: "2026-10-29T16:00:00.000Z" }],
  status: "paid",
  sentAt: null,
  viewedAt: null,
  createdAt: "2026-10-29T16:00:00.000Z",
  updatedAt: "2026-10-29T16:00:00.000Z",
};
const url = "https://cardashdetailing.com/invoice/test-token";
assert.equal(invoice.id, "booking-paid-booking-123");
assert.equal(isInvoiceFullyPaid(invoice), true);
const message = invoiceSmsText(invoice, url);
assert.match(message, /Hi Michael!/);
assert.match(message, /received your payment of \$249\.00/);
assert.match(message, /Your balance is \$0\.00/);
assert.match(message, /PAID receipt/);
assert.match(message, /CD-2026-0045/);
assert.ok(message.includes(url));
assert.doesNotMatch(message, /Balance due|Please pay/);

const unpaid = { ...invoice, status: "sent" as const, payments: [] };
assert.equal(isInvoiceFullyPaid(unpaid), false);
assert.match(invoiceSmsText(unpaid, url), /Balance due: \$249\.00/);
assert.doesNotMatch(invoiceSmsText(unpaid, url), /PAID receipt/);

const partial = { ...invoice, status: "partial" as const, payments: [{ ...invoice.payments[0], amount: 100 }] };
assert.equal(isInvoiceFullyPaid(partial), false);
assert.match(invoiceSmsText(partial, url), /Balance due: \$149\.00/);

const voidInvoice = { ...invoice, status: "void" as const };
assert.equal(isInvoiceFullyPaid(voidInvoice), false);

console.log("Invoice SMS: paid versus outstanding and partial balances produce correct wording.");


const partialReceipt = paymentReceiptSmsText(
  { ...invoice, status: "partial", dueDate: "2026-11-06", payments: [{ ...invoice.payments[0], amount: 124.50 }] },
  url,
  { ...invoice.payments[0], amount: 124.50 }
);
assert.match(partialReceipt, /received your payment of \$124\.50/);
assert.match(partialReceipt, /Invoice total: \$249\.00/);
assert.match(partialReceipt, /Total paid: \$124\.50/);
assert.match(partialReceipt, /Remaining balance: \$124\.50/);
assert.match(partialReceipt, /Due date: 2026-11-06/);
assert.match(partialReceipt, /payment receipt/);
assert.doesNotMatch(partialReceipt, /PAID receipt|balance is \$0\.00/);

const finalPayment = { id: "paid-2", amount: 124.50, method: "Zelle", paidAt: "2026-11-06T16:00:00.000Z" };
const settled = {
  ...invoice,
  payments: [{ ...invoice.payments[0], amount: 124.50 }, finalPayment],
  status: "paid" as const,
};
const finalReceipt = paymentReceiptSmsText(settled, url, finalPayment);
assert.match(finalReceipt, /received your payment of \$124\.50/);
assert.match(finalReceipt, /Total paid: \$249\.00/);
assert.match(finalReceipt, /balance is \$0\.00/);
assert.match(finalReceipt, /PAID receipt/);
assert.doesNotMatch(finalReceipt, /Remaining balance: \$124\.50/);

console.log("Partial and final payment receipts show the right amounts and payment status.");
