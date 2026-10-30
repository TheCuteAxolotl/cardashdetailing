"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  preferredDate: string | null;
  quotedPrice: number | null;
};

type Receipt = {
  id: string;
  invoiceNumber: string;
  status: string;
  sentAt: string | null;
  dueDate: string;
  payments: Array<{ id: string; amount: number; method: string; reference?: string; paidAt: string }>;
  totals: { total: number; paid: number; balance: number };
};

const methods = ["Cash", "Check", "Card (outside website)", "Zelle", "Venmo", "ACH / Bank", "Other"];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const field = "mt-2 w-full rounded-xl border border-white/15 bg-[#07131B] px-4 py-3 text-white outline-none focus:border-[#6EAEC6]";

export default function BookingPaidReceiptDialog({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const [totalAmount, setTotalAmount] = useState(booking.quotedPrice && booking.quotedPrice > 0 ? booking.quotedPrice.toFixed(2) : "");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [paymentId, setPaymentId] = useState(() => crypto.randomUUID());
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [smsConsentConfirmed, setSmsConsentConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const endpoint = "/api/bookings/" + encodeURIComponent(booking.id) + "/paid-receipt";
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not check for existing receipts.");
        if (active) {
          setReceipt(payload.invoice || null);
          setLink(payload.link || "");
          if (payload.invoice) setDueDate(payload.invoice.dueDate || "");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load receipt.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [endpoint]);

  const total = receipt ? receipt.totals.total : Math.max(0, Number(totalAmount) || 0);
  const paidAlready = receipt?.totals.paid || 0;
  const balance = receipt ? receipt.totals.balance : total;
  const nextPayment = Number(paidAmount) || 0;
  const remainingAfter = Math.max(0, Math.round((balance - Math.max(0, nextPayment)) * 100) / 100);
  const canRecord = !loading && balance > 0 && Number.isFinite(nextPayment)
    && nextPayment > 0 && Math.round(nextPayment * 100) <= Math.round(balance * 100)
    && total > 0 && paymentReceived && smsConsentConfirmed;

  async function createAndText(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (sending) return;
    if (!canRecord) {
      setError("Enter a valid total and received payment. Payment cannot exceed the balance, and both confirmations are required.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: total, paidAmount: nextPayment, dueDate,
          method, reference: reference.trim(), paymentId,
          paymentReceived, smsConsentConfirmed,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (payload.invoice) setReceipt(payload.invoice);
      if (payload.link) setLink(payload.link);
      if (!response.ok) throw new Error(payload.error || "Could not send the receipt.");
      if (payload.sending) {
        setSuccess("This payment receipt is being sent. Check the message history before trying again.");
        return;
      }
      if (payload.alreadySent) {
        setSuccess("This payment was already recorded and its receipt text was sent. No duplicate payment was added.");
      } else {
        setSuccess("Payment recorded and receipt submitted to the SMS provider!");
      }
      setPaidAmount("");
      setReference("");
      setPaymentReceived(false);
      setSmsConsentConfirmed(false);
      setPaymentId(crypto.randomUUID());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the receipt.");
    } finally {
      setSending(false);
    }
  }

  const bookingVehicle = [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel]
    .filter((part) => part && part !== "Not specified").join(" ");

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="payment-receipt-heading">
      <button aria-label="Close receipt dialog" className="fixed inset-0 cursor-default" onClick={onClose} />
      <form onSubmit={createAndText} className="relative z-10 my-0 max-h-[95dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/15 bg-[#10202A] p-5 text-white shadow-2xl sm:my-8 sm:rounded-3xl sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8BC1D4]">Car Dash · Billing</p>
            <h2 id="payment-receipt-heading" className="mt-2 text-2xl font-bold">Create receipt</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Record how much is owed and how much was actually paid. Partial payments keep their outstanding balance until the final payment.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-3 py-2 text-white/65" aria-label="Close">✕</button>
        </header>

        <section className="mt-6 rounded-2xl border border-[#6EAEC6]/20 bg-[#6EAEC6]/5 p-4 text-sm">
          <p className="font-semibold text-[#B9E0EC]">{booking.customerName}</p>
          <p className="mt-1 text-white/65">{booking.customerPhone}</p>
          <p className="mt-3 text-white/85">{booking.serviceName}</p>
          {bookingVehicle && <p className="mt-1 text-white/55">{bookingVehicle}</p>}
          {booking.preferredDate && <p className="mt-1 text-white/55">Booked for {booking.preferredDate}</p>}
        </section>

        {loading ? <p className="mt-5 text-sm text-white/60">Checking existing invoices…</p> : (
          <>
            {receipt && (
              <div className="mt-5 rounded-2xl border border-white/15 p-4 text-sm">
                <p className="font-semibold text-[#B9E0EC]">Invoice {receipt.invoiceNumber} · {receipt.totals.balance <= 0 ? "PAID" : "Partially paid"}</p>
                <p className="mt-2 text-white/70">Total {currency.format(receipt.totals.total)} · Recorded payments {currency.format(receipt.totals.paid)}</p>
                <p className="mt-1 text-white/70">Remaining balance: <strong className="text-white">{currency.format(receipt.totals.balance)}</strong></p>
                {receipt.dueDate && receipt.totals.balance > 0 && <p className="mt-1 text-white/60">Balance due {receipt.dueDate}</p>}
                {link && <a href={link} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-[#B9E0EC] underline">Open customer receipt</a>}
                {receipt.payments?.length > 0 && <div className="mt-4 space-y-1 border-t border-white/10 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Payment history</p>
                  {receipt.payments.map((payment) => <div key={payment.id} className="flex justify-between gap-3 text-xs text-white/65">
                    <span>{new Date(payment.paidAt).toLocaleDateString("en-US")} · {payment.method}</span>
                    <span>{currency.format(payment.amount)}</span>
                  </div>)}
                </div>}
              </div>
            )}

            {balance > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {!receipt && <label className="text-sm font-semibold text-white/80">Total amount owed ($)
                <input className={field} type="number" inputMode="decimal" min="0.01" max="100000" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="300.00" required />
              </label>}
              <label className="text-sm font-semibold text-white/80">Payment received now ($)
                <input className={field} type="number" inputMode="decimal" min="0.01" max={balance} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="150.00" required />
              </label>
              <label className="text-sm font-semibold text-white/80">Payment method
                <select className={field} value={method} onChange={(e) => setMethod(e.target.value)}>
                  {methods.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-white/80">Remaining balance due date (optional)
                <input className={field} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-white/80 sm:col-span-2">Transaction reference (optional)
                <input className={field} maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Check number, transfer ID, or payment note" />
              </label>
            </div>}

            {balance > 0 && <section className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm">
              <p className="font-semibold text-white">Receipt preview</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="text-white/55">Service total</div><div className="text-right font-semibold">{currency.format(total)}</div>
                <div className="text-white/55">Previously paid</div><div className="text-right">{currency.format(paidAlready)}</div>
                <div className="text-white/55">Receiving now</div><div className="text-right">{currency.format(Math.max(0, nextPayment))}</div>
                <div className="border-t border-white/10 pt-3 font-semibold text-[#B9E0EC]">Balance after payment</div>
                <div className="border-t border-white/10 pt-3 text-right text-lg font-bold">{currency.format(remainingAfter)}</div>
              </div>
              {nextPayment > balance && <p role="alert" className="mt-2 text-red-200">Payment cannot exceed the amount owed.</p>}
              <p className="mt-3 text-xs text-white/45">{remainingAfter > 0 ? "The SMS and customer receipt will show PARTIAL PAYMENT and the amount still owed." : "The invoice will be marked PAID once the balance reaches $0.00."}</p>
            </section>}

            {balance > 0 && <section className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/80">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={paymentReceived} onChange={(e) => setPaymentReceived(e.target.checked)} className="mt-1 h-4 w-4 accent-[#6EAEC6]" />
                <span>I confirm Car Dash Detailing actually received this payment (not just a promise to pay).</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={smsConsentConfirmed} onChange={(e) => setSmsConsentConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#6EAEC6]" />
                <span>The customer agreed to receive this receipt by SMS at the number above.</span>
              </label>
            </section>}
            {balance <= 0 && <p className="mt-5 text-sm text-emerald-200">This invoice is fully paid. No further payment is owed.</p>}
          </>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {!loading && balance > 0 && <button type="submit" disabled={sending || !canRecord} className="rounded-xl bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-[#07131B] disabled:opacity-40">{sending ? "Saving & texting…" : "Record payment & text receipt"}</button>}
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/65">{balance <= 0 ? "Done" : "Close"}</button>
          {receipt && <a href="/owner/invoices" className="self-center text-sm font-semibold text-[#B9E0EC] underline">Manage invoices</a>}
        </div>
        <p className="mt-4 text-xs leading-5 text-white/40">This doesn't charge the customer. Only enter money already received. Future payments use this same invoice and customer text conversation.</p>
      </form>
    </div>
  );
}
