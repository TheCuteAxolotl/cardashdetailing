"use client";

import { useEffect, useState } from "react";

type LineItem = { id: string; description: string; quantity: number; rate: number };
type Payment = { id: string; amount: number; method: string; reference?: string; paidAt: string };
type Invoice = {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  assetType: string;
  assetDescription: string;
  serviceDate: string;
  dueDate: string;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes: string;
  terms: string;
  paymentOptions: {
    check: boolean;
    cash: boolean;
    online: boolean;
    other: boolean;
    checkPayableTo: string;
    onlineLabel: string;
    onlinePaymentUrl: string;
    otherInstructions: string;
  };
  payments: Payment[];
  status: string;
  createdAt: string;
  totals: { subtotal: number; discount: number; tax: number; total: number; paid: number; balance: number };
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function prettyDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { token } = await params;
        const query = new URLSearchParams(window.location.search);
        const sessionId = query.get("session_id");
        const paymentState = query.get("payment");

        if (sessionId && paymentState === "success") {
          const confirmResponse = await fetch(
            `/api/invoices/public/${encodeURIComponent(token)}/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`,
            { method: "POST", cache: "no-store" }
          );
          const confirmation = await confirmResponse.json().catch(() => ({}));
          if (confirmResponse.ok) {
            if (confirmation.paymentStatus === "paid") {
              setPaymentMessage("Payment received. Thank you!");
            } else {
              setPaymentMessage("Payment submitted. Bank payments can take time to finish processing; this invoice will update automatically when Stripe confirms settlement.");
            }
          }
          window.history.replaceState({}, "", `/invoice/${token}`);
        } else if (paymentState === "cancelled") {
          setPaymentMessage("Online payment was cancelled. Your invoice is still available below.");
          window.history.replaceState({}, "", `/invoice/${token}`);
        }

        const response = await fetch(`/api/invoices/public/${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Invoice not found");
        if (!cancelled) setInvoice(data.invoice);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Invoice not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params]);

  async function startOnlinePayment() {
    if (!invoice || paying) return;
    if (invoice.paymentOptions.onlinePaymentUrl) {
      window.location.assign(invoice.paymentOptions.onlinePaymentUrl);
      return;
    }

    setPaying(true);
    setPaymentMessage("");
    try {
      const { token } = await params;
      const response = await fetch(`/api/invoices/public/${encodeURIComponent(token)}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not start online payment.");
      if (!data.url) throw new Error("Stripe did not return a checkout link.");
      window.location.assign(data.url);
    } catch (err) {
      setPaymentMessage(err instanceof Error ? err.message : "Could not start online payment.");
      setPaying(false);
    }
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#07131B] text-white"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-b-[#6EAEC6]" /><p className="mt-4 text-sm text-white/45">Loading invoice…</p></div></main>;
  }

  if (!invoice || error) {
    return <main className="grid min-h-screen place-items-center bg-[#07131B] px-6 text-white"><div className="max-w-md text-center"><p className="text-xs font-semibold uppercase tracking-[.24em] text-[#6EAEC6]">Car Dash Detailing</p><h1 className="mt-3 text-3xl font-semibold">Invoice unavailable</h1><p className="mt-3 text-sm text-white/50">{error || "This invoice link is no longer available."}</p></div></main>;
  }

  const paid = invoice.totals.balance <= 0;

  return (
    <main className="min-h-screen bg-[#07131B] px-4 py-8 text-white sm:px-6 print:bg-white print:p-0 print:text-black">
      <meta name="robots" content="noindex,nofollow" />
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-4 print:hidden">
          <a href="/" className="text-sm text-[#8EC5D8] hover:text-white">Car Dash Detailing</a>
          <button onClick={() => window.print()} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white">Print / Save PDF</button>
        </div>

        {paymentMessage && <div className="mb-5 rounded-2xl border border-[#6EAEC6]/20 bg-[#6EAEC6]/10 px-4 py-3 text-sm leading-6 text-[#C7E6F0] print:hidden">{paymentMessage}</div>}

        <article className="overflow-hidden rounded-[2rem] border border-[#27404F] bg-[#0B1822] shadow-2xl shadow-black/20 print:rounded-none print:border-0 print:bg-white print:shadow-none">
          <header className="border-b border-white/8 bg-gradient-to-br from-[#102838] to-[#0B1822] p-7 sm:p-10 print:border-black/10 print:bg-white">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#6EAEC6]/25 bg-[#6EAEC6]/10 text-lg font-bold text-[#A9D6E5] print:border-black/15 print:bg-transparent print:text-black">CD</div><div><p className="text-lg font-semibold tracking-wide">CAR DASH DETAILING</p><p className="text-xs uppercase tracking-[.2em] text-white/40 print:text-black/45">Professional Detailing</p></div></div>
                <p className="mt-6 text-sm leading-6 text-white/45 print:text-black/55">South Elgin, Illinois<br />cardashdetailing.com</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#6EAEC6] print:text-black/50">Invoice</p>
                <h1 className="mt-2 text-3xl font-semibold">{invoice.invoiceNumber}</h1>
                <div className="mt-3 flex sm:justify-end"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${paid ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200 print:text-black" : "border-[#6EAEC6]/25 bg-[#6EAEC6]/10 text-[#B9E0EC] print:text-black"}`}>{paid ? "PAID" : `${currency.format(invoice.totals.balance)} DUE`}</span></div>
              </div>
            </div>
          </header>

          <div className="p-7 sm:p-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoBlock title="Bill to"><p className="text-lg font-semibold">{invoice.customerName}</p>{invoice.customerEmail && <p>{invoice.customerEmail}</p>}{invoice.customerPhone && <p>{invoice.customerPhone}</p>}</InfoBlock>
              <InfoBlock title="Job"><p className="font-medium text-white/80 print:text-black/80">{invoice.assetType}{invoice.assetDescription ? ` · ${invoice.assetDescription}` : ""}</p>{invoice.serviceDate && <p>Service date: {prettyDate(invoice.serviceDate)}</p>}{invoice.dueDate && <p>Due: {prettyDate(invoice.dueDate)}</p>}</InfoBlock>
            </div>

            <div className="mt-9 overflow-hidden rounded-2xl border border-white/8 print:border-black/15">
              <div className="hidden grid-cols-[1fr_90px_130px_130px] bg-white/[0.035] px-4 py-3 text-xs font-semibold uppercase tracking-[.14em] text-white/35 sm:grid print:bg-black/[.03] print:text-black/50"><span>Description</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Amount</span></div>
              {invoice.lineItems.map((item) => <div key={item.id} className="grid gap-2 border-t border-white/6 px-4 py-4 first:border-t-0 sm:grid-cols-[1fr_90px_130px_130px] print:border-black/10"><div><p className="font-medium">{item.description}</p><p className="mt-1 text-xs text-white/35 sm:hidden print:text-black/45">Qty {item.quantity} · {currency.format(item.rate)} each</p></div><span className="hidden text-right text-white/55 sm:block print:text-black/60">{item.quantity}</span><span className="hidden text-right text-white/55 sm:block print:text-black/60">{currency.format(item.rate)}</span><span className="text-right font-semibold">{currency.format(item.quantity * item.rate)}</span></div>)}
            </div>

            <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
              <Row label="Subtotal" value={invoice.totals.subtotal} />
              {invoice.totals.discount > 0 && <Row label="Discount" value={-invoice.totals.discount} />}
              {invoice.totals.tax > 0 && <Row label={`Tax (${invoice.taxRate}%)`} value={invoice.totals.tax} />}
              <div className="my-3 border-t border-white/8 print:border-black/10" />
              <Row label="Total" value={invoice.totals.total} strong />
              {invoice.totals.paid > 0 && <Row label="Payments" value={-invoice.totals.paid} />}
              <div className="mt-4 flex items-end justify-between rounded-2xl bg-[#6EAEC6]/10 p-4 print:border print:border-black/15 print:bg-transparent"><span className="text-sm text-[#B9E0EC] print:text-black/60">Balance due</span><span className="text-2xl font-bold">{currency.format(invoice.totals.balance)}</span></div>
            </div>

            {!paid && <section className="mt-9 rounded-2xl border border-[#6EAEC6]/18 bg-[#6EAEC6]/[0.055] p-5 sm:p-6 print:border-black/15 print:bg-transparent"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8EC5D8] print:text-black/50">Payment options</p><div className="mt-4 grid gap-3 sm:grid-cols-2">
              {invoice.paymentOptions.online && <button onClick={startOnlinePayment} disabled={paying} className="flex min-h-28 flex-col justify-between rounded-2xl border border-[#6EAEC6]/35 bg-[#6EAEC6]/12 p-4 text-left transition hover:bg-[#6EAEC6]/18 disabled:cursor-wait disabled:opacity-55 print:hidden"><div><p className="font-semibold text-white">Pay online</p><p className="mt-1 text-sm leading-6 text-white/50">Secure Stripe checkout with card or U.S. bank account.</p></div><span className="mt-4 text-sm font-bold text-[#A9D6E5]">{paying ? "Opening secure checkout…" : `${invoice.paymentOptions.onlineLabel || "Pay online"} · ${currency.format(invoice.totals.balance)} →`}</span></button>}
              {invoice.paymentOptions.check && <PaymentCard title="Check"><p>Make check payable to <strong className="text-white print:text-black">{invoice.paymentOptions.checkPayableTo || "Car Dash Detailing"}</strong>.</p></PaymentCard>}
              {invoice.paymentOptions.cash && <PaymentCard title="Cash"><p>Cash payment accepted directly by Car Dash Detailing.</p></PaymentCard>}
              {invoice.paymentOptions.other && invoice.paymentOptions.otherInstructions && <PaymentCard title="Other"><p className="whitespace-pre-wrap">{invoice.paymentOptions.otherInstructions}</p></PaymentCard>}
            </div></section>}

            {invoice.payments.length > 0 && <section className="mt-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/35 print:text-black/45">Payments recorded</p><div className="mt-3 space-y-2">{invoice.payments.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-xl border border-white/7 px-4 py-3 text-sm print:border-black/10"><div><p className="font-medium">{payment.method}</p><p className="mt-1 text-xs text-white/35 print:text-black/45">{new Date(payment.paidAt).toLocaleDateString("en-US")}{payment.reference ? ` · Ref ${payment.reference}` : ""}</p></div><span className="font-semibold">{currency.format(payment.amount)}</span></div>)}</div></section>}

            {(invoice.notes || invoice.terms) && <div className="mt-9 grid gap-5 border-t border-white/8 pt-7 sm:grid-cols-2 print:border-black/10">{invoice.notes && <InfoBlock title="Notes"><p className="whitespace-pre-wrap">{invoice.notes}</p></InfoBlock>}{invoice.terms && <InfoBlock title="Terms"><p className="whitespace-pre-wrap">{invoice.terms}</p></InfoBlock>}</div>}

            <footer className="mt-10 border-t border-white/8 pt-6 text-center text-xs leading-5 text-white/30 print:border-black/10 print:text-black/40">Thank you for choosing Car Dash Detailing.<br />This secure invoice link was issued directly by Car Dash Detailing.</footer>
          </div>
        </article>
      </div>
    </main>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-white/32 print:text-black/45">{title}</p><div className="space-y-1 text-sm leading-6 text-white/55 print:text-black/60">{children}</div></div>;
}

function PaymentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/8 bg-black/10 p-4 print:border-black/10 print:bg-transparent"><p className="font-semibold text-white print:text-black">{title}</p><div className="mt-1 text-sm leading-6 text-white/50 print:text-black/60">{children}</div></div>;
}

function Row({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-5 ${strong ? "text-base font-semibold" : "text-white/55 print:text-black/60"}`}><span>{label}</span><span className={strong ? "text-white print:text-black" : ""}>{value < 0 ? `−${currency.format(Math.abs(value))}` : currency.format(value)}</span></div>;
}
