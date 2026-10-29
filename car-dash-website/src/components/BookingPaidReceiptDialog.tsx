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
  const [amount, setAmount] = useState(booking.quotedPrice && booking.quotedPrice > 0 ? booking.quotedPrice.toFixed(2) : "");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [smsConsentConfirmed, setSmsConsentConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/paid-receipt`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not check for existing receipts.");
        if (active) {
          setReceipt(payload.invoice || null);
          setLink(payload.link || "");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load existing receipts.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [booking.id]);

  async function createAndText(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (sending) return;
    if (!paymentReceived || !smsConsentConfirmed) {
      setError("Confirm both the payment and the customer's permission to receive a text.");
      return;
    }
    if (!receipt && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
      setError("Enter the amount you received.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/paid-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount), method, reference: reference.trim(),
          paymentReceived, smsConsentConfirmed,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (payload.invoice) setReceipt(payload.invoice);
      if (payload.link) setLink(payload.link);
      if (!response.ok) throw new Error(payload.error || "Could not send the receipt.");
      if (payload.sending) {
        setSuccess("This receipt is already being sent. Check the message history before trying again.");
      } else if (payload.alreadySent) {
        setSuccess("The paid receipt was already sent. No duplicate SMS was created.");
      } else {
        setSuccess("Payment recorded and paid receipt text submitted to the SMS provider!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the receipt.");
    } finally {
      setSending(false);
    }
  }

  const alreadyTexted = Boolean(receipt?.sentAt);
  const bookingVehicle = [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel]
    .filter((part) => part && part !== "Not specified").join(" ");

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="paid-receipt-heading">
      <button aria-label="Close paid receipt dialog" className="fixed inset-0 cursor-default" onClick={onClose} />
      <form onSubmit={createAndText} className="relative z-10 my-0 max-h-[95dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/15 bg-[#10202A] p-5 text-white shadow-2xl sm:my-8 sm:rounded-3xl sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8BC1D4]">Car Dash · Billing</p>
            <h2 id="paid-receipt-heading" className="mt-2 text-2xl font-bold">Create &amp; text paid receipt</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Record an actual payment, create a PAID invoice, and text the customer a receipt they can save or print.</p>
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

        {loading ? <p className="mt-5 text-sm text-white/60">Checking existing invoices…</p> : receipt ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
            <p className="font-semibold text-emerald-200">Paid invoice already created: {receipt.invoiceNumber}</p>
            <p className="mt-1 text-sm text-white/75">Recorded: {currency.format(receipt.totals.paid)} · Balance: {currency.format(receipt.totals.balance)}</p>
            <p className="mt-1 text-sm text-white/65">{alreadyTexted ? "Receipt already sent via SMS." : "Saved, but an SMS has not been confirmed as submitted yet."}</p>
            {link && <a href={link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-[#B9E0EC] underline">Open customer receipt</a>}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-white/80">Amount already received ($)
              <input className={field} type="number" min="0.01" max="100000" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </label>
            <label className="text-sm font-semibold text-white/80">Payment method
              <select className={field} value={method} onChange={(e) => setMethod(e.target.value)}>
                {methods.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-white/80 sm:col-span-2">Transaction reference (optional)
              <input className={field} maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Check number, transfer ID, or payment note" />
            </label>
          </div>
        )}

        {!alreadyTexted && !loading && (
          <section className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/80">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={paymentReceived} onChange={(e) => setPaymentReceived(e.target.checked)} className="mt-1 h-4 w-4 accent-[#6EAEC6]" />
              <span>I confirm Car Dash Detailing actually received this payment. This is a receipt, not a payment request.</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={smsConsentConfirmed} onChange={(e) => setSmsConsentConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#6EAEC6]" />
              <span>I confirm the customer agreed to receive this receipt by SMS at the phone number above.</span>
            </label>
          </section>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {!alreadyTexted && <button type="submit" disabled={loading || sending || !paymentReceived || !smsConsentConfirmed} className="rounded-xl bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-[#07131B] disabled:opacity-40">{sending ? "Saving & texting…" : receipt ? "Text saved paid receipt" : "Create PAID invoice & send SMS"}</button>}
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/65">{alreadyTexted ? "Done" : "Close"}</button>
          {receipt && <a href="/owner/invoices" className="self-center text-sm font-semibold text-[#B9E0EC] underline">Manage invoices</a>}
        </div>
        <p className="mt-4 text-xs leading-5 text-white/40">No automatic charge is made. This records payment you have already received. The receipt uses your existing customer text conversation.</p>
      </form>
    </div>
  );
}
