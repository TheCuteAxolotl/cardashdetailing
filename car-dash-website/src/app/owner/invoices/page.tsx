"use client";

import { useEffect, useMemo, useState } from "react";

type LineItem = { id: string; description: string; quantity: number; rate: number };
type Payment = { id: string; amount: number; method: string; reference?: string; note?: string; paidAt: string };
type PaymentOptions = {
  check: boolean;
  cash: boolean;
  online: boolean;
  other: boolean;
  checkPayableTo: string;
  onlineLabel: string;
  onlinePaymentUrl: string;
  otherInstructions: string;
};
type Totals = { subtotal: number; discount: number; tax: number; total: number; paid: number; balance: number };
type Invoice = {
  id: string;
  invoiceNumber: string;
  shareToken: string;
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
  paymentOptions: PaymentOptions;
  payments: Payment[];
  status: "draft" | "sent" | "viewed" | "partial" | "paid" | "void";
  sentAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totals: Totals;
};

type FormState = Omit<Invoice, "id" | "shareToken" | "createdAt" | "updatedAt" | "totals" | "sentAt" | "viewedAt"> & {
  id?: string;
  shareToken?: string;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function blankForm(): FormState {
  return {
    invoiceNumber: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    assetType: "Vehicle",
    assetDescription: "",
    serviceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    lineItems: [{ id: uid(), description: "Detailing service", quantity: 1, rate: 0 }],
    discountAmount: 0,
    taxRate: 0,
    notes: "",
    terms: "Payment is due upon receipt unless otherwise noted.",
    paymentOptions: {
      check: true,
      cash: false,
      online: false,
      other: false,
      checkPayableTo: "Car Dash Detailing",
      onlineLabel: "Pay online",
      onlinePaymentUrl: "",
      otherInstructions: "",
    },
    payments: [],
    status: "draft",
  };
}

function steveBoatForm(): FormState {
  return {
    ...blankForm(),
    customerName: "Steve 1",
    assetType: "Boat",
    assetDescription: "Boat detailing",
    lineItems: [{ id: uid(), description: "Boat Detailing", quantity: 1, rate: 900 }],
    taxRate: 0,
    notes: "Thank you for choosing Car Dash Detailing.",
    paymentOptions: {
      ...blankForm().paymentOptions,
      check: true,
      checkPayableTo: "Car Dash Detailing",
    },
  };
}

function localTotals(form: FormState): Totals {
  const subtotal = form.lineItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.rate) || 0), 0);
  const discount = Math.min(Math.max(0, Number(form.discountAmount) || 0), subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (Math.max(0, Number(form.taxRate) || 0) / 100);
  const total = taxable + tax;
  const paid = form.payments.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
  return {
    subtotal,
    discount,
    tax,
    total,
    paid,
    balance: Math.max(0, total - paid),
  };
}

function statusLabel(status: Invoice["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: Invoice["status"]) {
  if (status === "paid") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (status === "partial") return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (status === "void") return "border-white/10 bg-white/5 text-white/45";
  if (status === "viewed") return "border-sky-300/20 bg-sky-300/10 text-sky-100";
  return "border-[#6EAEC6]/20 bg-[#6EAEC6]/10 text-[#A9D6E5]";
}

export default function OwnerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState<FormState>(blankForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentDraft, setPaymentDraft] = useState({ amount: "", method: "Check", reference: "" });

  const totals = useMemo(() => localTotals(form), [form]);
  const selected = useMemo(() => invoices.find((item) => item.id === form.id) || null, [invoices, form.id]);

  async function loadInvoices() {
    setLoading(true);
    try {
      const response = await fetch("/api/invoices", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load invoices");
      const data = await response.json();
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  function editInvoice(invoice: Invoice) {
    setForm({
      id: invoice.id,
      shareToken: invoice.shareToken,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail,
      assetType: invoice.assetType,
      assetDescription: invoice.assetDescription,
      serviceDate: invoice.serviceDate,
      dueDate: invoice.dueDate,
      lineItems: invoice.lineItems,
      discountAmount: invoice.discountAmount,
      taxRate: invoice.taxRate,
      notes: invoice.notes,
      terms: invoice.terms,
      paymentOptions: invoice.paymentOptions,
      payments: invoice.payments,
      status: invoice.status,
    });
    setPaymentDraft({ amount: "", method: "Check", reference: "" });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveInvoice(customForm = form) {
    setSaving(true);
    setMessage("");
    try {
      const isEditing = Boolean(customForm.id);
      const response = await fetch(isEditing ? `/api/invoices/${customForm.id}` : "/api/invoices", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save invoice");
      setMessage(isEditing ? "Invoice updated." : "Invoice created.");
      await loadInvoices();
      editInvoice(data.invoice);
      return data.invoice as Invoice;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save invoice");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(invoice?: Invoice | null) {
    const current = invoice || selected;
    if (!current) {
      setMessage("Save the invoice first to create its share link.");
      return;
    }
    const link = `${window.location.origin}/invoice/${current.shareToken}`;
    await navigator.clipboard.writeText(link);
    setMessage("Invoice link copied.");
  }

  async function sendSms(invoice?: Invoice | null) {
    let current = invoice || selected;
    if (!current && form.customerName) current = await saveInvoice();
    if (!current) return;
    if (!current.customerPhone) {
      setMessage("Add the customer's phone number before sending by SMS.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/invoices/${current.id}/sms`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not send SMS");
      setMessage(`Invoice sent to ${current.customerPhone}.`);
      await loadInvoices();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send SMS");
    } finally {
      setSaving(false);
    }
  }

  async function removeInvoice(invoice: Invoice) {
    if (!window.confirm(`Delete ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    const response = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
    if (response.ok) {
      if (form.id === invoice.id) setForm(blankForm());
      setMessage("Invoice deleted.");
      await loadInvoices();
    } else {
      setMessage("Could not delete invoice.");
    }
  }

  async function recordPayment() {
    const amount = Number(paymentDraft.amount);
    if (!form.id) return setMessage("Save the invoice before recording a payment.");
    if (!Number.isFinite(amount) || amount <= 0) return setMessage("Enter a valid payment amount.");

    const updated: FormState = {
      ...form,
      payments: [
        ...form.payments,
        {
          id: uid(),
          amount,
          method: paymentDraft.method || "Other",
          reference: paymentDraft.reference.trim() || undefined,
          paidAt: new Date().toISOString(),
        },
      ],
    };
    setForm(updated);
    const saved = await saveInvoice(updated);
    if (saved) setPaymentDraft({ amount: "", method: "Check", reference: "" });
  }

  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.totals?.balance || 0), 0);
  const collected = invoices.reduce((sum, invoice) => sum + Number(invoice.totals?.paid || 0), 0);

  return (
    <main className="min-h-screen bg-[#07131B] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <a href="/owner/dashboard" className="text-sm text-[#8EC5D8] hover:text-white">← Owner Dashboard</a>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#6EAEC6]">Car Dash Billing</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Invoices</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Create fully custom invoices, text a secure link to customers, accept whichever payment methods you choose, and record checks or other payments without forcing the transaction through a processor.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { setForm(steveBoatForm()); setMessage("Steve 1 boat invoice prefilled. Add his phone number, save, then send."); }} className="rounded-xl border border-[#6EAEC6]/30 bg-[#6EAEC6]/10 px-4 py-2.5 text-sm font-semibold text-[#B9E0EC] hover:bg-[#6EAEC6]/15">Steve 1 · $900 Boat</button>
            <button onClick={() => { setForm(blankForm()); setMessage(""); }} className="rounded-xl bg-[#6EAEC6] px-4 py-2.5 text-sm font-bold text-[#07131B] hover:bg-[#8BC1D4]">+ New invoice</button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Invoices" value={String(invoices.length)} />
          <Metric label="Outstanding" value={currency.format(outstanding)} />
          <Metric label="Recorded payments" value={currency.format(collected)} />
        </div>

        {message && <div className="mb-6 rounded-2xl border border-[#6EAEC6]/20 bg-[#6EAEC6]/10 px-4 py-3 text-sm text-[#C5E5EF]">{message}</div>}

        <div className="grid gap-8 xl:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">{form.id ? "Edit invoice" : "New invoice"}</p>
                <h2 className="mt-1 text-xl font-semibold">{form.invoiceNumber || "Invoice number assigned when saved"}</h2>
              </div>
              {form.id && <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(form.status)}`}>{statusLabel(form.status)}</span>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name"><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input" placeholder="Customer name" /></Field>
              <Field label="Phone"><input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="input" placeholder="(555) 555-5555" /></Field>
              <Field label="Email"><input value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="input" placeholder="Optional" /></Field>
              <Field label="Invoice number"><input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} className="input" placeholder="Auto generated" /></Field>
              <Field label="Asset type"><input value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value })} className="input" placeholder="Vehicle, Boat, Motorcycle..." /></Field>
              <Field label="Asset / job description"><input value={form.assetDescription} onChange={(e) => setForm({ ...form, assetDescription: e.target.value })} className="input" placeholder="2026 Tesla Model Y, 24 ft boat..." /></Field>
              <Field label="Service date"><input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} className="input" /></Field>
              <Field label="Due date"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" /></Field>
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Line items</h3>
                <button onClick={() => setForm({ ...form, lineItems: [...form.lineItems, { id: uid(), description: "", quantity: 1, rate: 0 }] })} className="text-sm font-semibold text-[#8EC5D8] hover:text-white">+ Add item</button>
              </div>
              <div className="space-y-3">
                {form.lineItems.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-white/7 bg-white/[0.025] p-3 sm:grid-cols-[1fr_90px_120px_38px]">
                    <input value={item.description} onChange={(e) => setForm({ ...form, lineItems: form.lineItems.map((x, i) => i === index ? { ...x, description: e.target.value } : x) })} className="input" placeholder="Service / item" />
                    <input type="number" min="0" step="1" value={item.quantity} onChange={(e) => setForm({ ...form, lineItems: form.lineItems.map((x, i) => i === index ? { ...x, quantity: Number(e.target.value) } : x) })} className="input" aria-label="Quantity" />
                    <input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => setForm({ ...form, lineItems: form.lineItems.map((x, i) => i === index ? { ...x, rate: Number(e.target.value) } : x) })} className="input" aria-label="Rate" />
                    <button onClick={() => setForm({ ...form, lineItems: form.lineItems.filter((_, i) => i !== index) })} className="rounded-xl border border-white/8 text-white/35 hover:border-red-300/20 hover:text-red-200" aria-label="Remove line item">×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Discount ($)"><input type="number" min="0" step="0.01" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })} className="input" /></Field>
              <Field label="Sales tax (%)"><input type="number" min="0" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} className="input" /></Field>
            </div>
            <p className="mt-2 text-xs text-white/35">Tax is fully manual. Leave it at 0% when the invoice should not collect sales tax.</p>

            <div className="mt-7 rounded-2xl border border-white/7 bg-[#07131B]/60 p-5">
              <h3 className="font-semibold">Payment options shown to customer</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Toggle checked={form.paymentOptions.check} label="Check" onChange={(value) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, check: value } })} />
                <Toggle checked={form.paymentOptions.cash} label="Cash" onChange={(value) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, cash: value } })} />
                <Toggle checked={form.paymentOptions.online} label="Online payment link" onChange={(value) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, online: value } })} />
                <Toggle checked={form.paymentOptions.other} label="Other / custom" onChange={(value) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, other: value } })} />
              </div>
              {form.paymentOptions.check && <div className="mt-4"><Field label="Check payable to"><input value={form.paymentOptions.checkPayableTo} onChange={(e) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, checkPayableTo: e.target.value } })} className="input" /></Field></div>}
              {form.paymentOptions.online && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Button label"><input value={form.paymentOptions.onlineLabel} onChange={(e) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, onlineLabel: e.target.value } })} className="input" /></Field><Field label="Payment URL"><input value={form.paymentOptions.onlinePaymentUrl} onChange={(e) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, onlinePaymentUrl: e.target.value } })} className="input" placeholder="https://..." /></Field></div>}
              {form.paymentOptions.other && <div className="mt-4"><Field label="Custom payment instructions"><textarea value={form.paymentOptions.otherInstructions} onChange={(e) => setForm({ ...form, paymentOptions: { ...form.paymentOptions, otherInstructions: e.target.value } })} className="input min-h-24" placeholder="Zelle, bank transfer instructions, etc." /></Field></div>}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Customer notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-28" placeholder="Thank-you note, job details, warranty note..." /></Field>
              <Field label="Terms"><textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="input min-h-28" /></Field>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button disabled={saving} onClick={() => saveInvoice()} className="rounded-xl bg-[#6EAEC6] px-5 py-3 text-sm font-bold text-[#07131B] disabled:opacity-50">{saving ? "Saving…" : form.id ? "Save changes" : "Create invoice"}</button>
              <button disabled={saving || !form.id} onClick={() => sendSms()} className="rounded-xl border border-[#6EAEC6]/30 px-5 py-3 text-sm font-semibold text-[#B9E0EC] disabled:opacity-35">Send via SMS</button>
              <button disabled={!form.id} onClick={() => copyLink()} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 disabled:opacity-35">Copy link</button>
              {form.shareToken && <a href={`/invoice/${form.shareToken}`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/75">Preview</a>}
            </div>

            {form.id && (
              <div className="mt-8 rounded-2xl border border-white/7 bg-white/[0.025] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Record an offline payment</h3>
                    <p className="mt-1 text-xs text-white/40">Use this for checks, cash, Zelle, or anything paid outside the website.</p>
                  </div>
                  <span className="text-sm text-white/55">Balance {currency.format(totals.balance)}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
                  <input type="number" step="0.01" min="0" value={paymentDraft.amount} onChange={(e) => setPaymentDraft({ ...paymentDraft, amount: e.target.value })} className="input" placeholder="Amount" />
                  <select value={paymentDraft.method} onChange={(e) => setPaymentDraft({ ...paymentDraft, method: e.target.value })} className="input"><option>Check</option><option>Cash</option><option>ACH / Bank</option><option>Card</option><option>Zelle</option><option>Other</option></select>
                  <input value={paymentDraft.reference} onChange={(e) => setPaymentDraft({ ...paymentDraft, reference: e.target.value })} className="input" placeholder="Check # / reference (optional)" />
                  <button disabled={saving} onClick={recordPayment} className="rounded-xl border border-[#6EAEC6]/30 px-4 py-2 text-sm font-semibold text-[#B9E0EC]">Record</button>
                </div>
                {form.payments.length > 0 && <div className="mt-4 space-y-2">{form.payments.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-xl bg-black/10 px-3 py-2 text-sm"><span className="text-white/65">{payment.method}{payment.reference ? ` · ${payment.reference}` : ""}</span><span className="font-semibold">{currency.format(payment.amount)}</span></div>)}</div>}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Live total</p>
              <div className="mt-5 space-y-3 text-sm">
                <TotalRow label="Subtotal" value={totals.subtotal} />
                {totals.discount > 0 && <TotalRow label="Discount" value={-totals.discount} />}
                {totals.tax > 0 && <TotalRow label={`Tax (${form.taxRate || 0}%)`} value={totals.tax} />}
                <div className="my-3 border-t border-white/8" />
                <TotalRow label="Invoice total" value={totals.total} strong />
                <TotalRow label="Paid" value={-totals.paid} />
                <div className="mt-3 rounded-2xl bg-[#6EAEC6]/10 p-4"><div className="flex items-end justify-between gap-4"><span className="text-sm text-[#B9E0EC]">Balance due</span><span className="text-2xl font-bold text-white">{currency.format(totals.balance)}</span></div></div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Saved invoices</h2><button onClick={loadInvoices} className="text-xs text-white/45 hover:text-white">Refresh</button></div>
              {loading ? <p className="mt-4 text-sm text-white/40">Loading invoices…</p> : invoices.length === 0 ? <p className="mt-4 text-sm text-white/40">No invoices yet. Use the Steve 1 preset or create a new one.</p> : <div className="mt-4 space-y-3">{invoices.map((invoice) => (
                <div key={invoice.id} className={`rounded-2xl border p-4 transition ${form.id === invoice.id ? "border-[#6EAEC6]/45 bg-[#6EAEC6]/5" : "border-white/7 bg-white/[0.02]"}`}>
                  <button onClick={() => editInvoice(invoice)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{invoice.customerName}</p><p className="mt-1 text-xs text-white/40">{invoice.invoiceNumber} · {invoice.assetType}{invoice.assetDescription ? ` · ${invoice.assetDescription}` : ""}</p></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(invoice.status)}`}>{statusLabel(invoice.status)}</span></div>
                    <div className="mt-4 flex items-end justify-between"><span className="text-xs text-white/35">Balance</span><span className="text-lg font-bold">{currency.format(invoice.totals.balance)}</span></div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/6 pt-3">
                    <button onClick={() => sendSms(invoice)} className="rounded-lg border border-[#6EAEC6]/20 px-2.5 py-1.5 text-xs text-[#B9E0EC]">SMS</button>
                    <button onClick={() => copyLink(invoice)} className="rounded-lg border border-white/8 px-2.5 py-1.5 text-xs text-white/55">Copy link</button>
                    <a href={`/invoice/${invoice.shareToken}`} target="_blank" rel="noreferrer" className="rounded-lg border border-white/8 px-2.5 py-1.5 text-xs text-white/55">Open</a>
                    <button onClick={() => removeInvoice(invoice)} className="ml-auto rounded-lg border border-red-300/10 px-2.5 py-1.5 text-xs text-red-200/55 hover:text-red-200">Delete</button>
                  </div>
                </div>
              ))}</div>}
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,.09); background: #07131B; padding: .72rem .85rem; color: white; outline: none; }
        .input:focus { border-color: rgba(110,174,198,.55); box-shadow: 0 0 0 3px rgba(110,174,198,.08); }
        .input::placeholder { color: rgba(255,255,255,.25); }
        select.input option { color: white; background: #07131B; }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/38">{label}</span>{children}</label>;
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/7 bg-white/[0.02] px-3 py-2.5 text-sm text-white/65"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#6EAEC6]" />{label}</label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#27404F] bg-[#0B1822] p-5"><p className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function TotalRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-semibold" : "text-white/60"}`}><span>{label}</span><span className={strong ? "text-white" : ""}>{value < 0 ? `−${currency.format(Math.abs(value))}` : currency.format(value)}</span></div>;
}
