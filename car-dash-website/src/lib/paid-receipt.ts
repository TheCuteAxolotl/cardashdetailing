import type { InvoicePayment, InvoiceRecord } from "@/lib/invoices";
import { calculateInvoiceTotals } from "@/lib/invoices";

export function paidReceiptInvoiceId(bookingId: string) {
  return `booking-paid-${bookingId}`;
}

export function isInvoiceFullyPaid(invoice: InvoiceRecord) {
  const totals = calculateInvoiceTotals(invoice);
  return invoice.status !== "void" && totals.total > 0 && totals.balance === 0 && totals.paid >= totals.total;
}

function smsText(text: string) {
  return text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

export function invoiceSmsText(invoice: InvoiceRecord, url: string) {
  const totals = calculateInvoiceTotals(invoice);
  const firstName = smsText(invoice.customerName).split(" ")[0] || "there";
  const formattedMoney = (amount: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
  }).format(amount);

  if (isInvoiceFullyPaid(invoice)) {
    return `Hi ${firstName}! Car Dash Detailing confirms we received your payment of ${formattedMoney(totals.total)} for invoice ${smsText(invoice.invoiceNumber)}. Your balance is $0.00. Thank you for choosing us! View or save your PAID receipt: ${url}`;
  }

  return `Hi ${firstName}, here is your Car Dash Detailing invoice ${smsText(invoice.invoiceNumber)}. Balance due: ${formattedMoney(totals.balance)}. View your invoice: ${url}`;
}

/** An acknowledgement for one payment, including the actual outstanding balance. */
export function paymentReceiptSmsText(invoice: InvoiceRecord, url: string, payment: InvoicePayment) {
  const totals = calculateInvoiceTotals(invoice);
  const money = (amount: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
  }).format(amount);
  const firstName = smsText(invoice.customerName).split(" ")[0] || "there";
  const due = invoice.dueDate && totals.balance > 0
    ? ` Due date: ${invoice.dueDate}.`
    : "";

  if (isInvoiceFullyPaid(invoice)) {
    return `Hi ${firstName}! Car Dash Detailing received your payment of ${money(payment.amount)} for invoice ${smsText(invoice.invoiceNumber)}. Total paid: ${money(totals.paid)}. Your balance is $0.00. View or save your PAID receipt: ${url}`;
  }

  return `Hi ${firstName}! Car Dash Detailing received your payment of ${money(payment.amount)} toward invoice ${smsText(invoice.invoiceNumber)}. Invoice total: ${money(totals.total)}. Total paid: ${money(totals.paid)}. Remaining balance: ${money(totals.balance)}.${due} View your payment receipt: ${url}`;
}
