import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRoleForEmail } from "@/lib/auth";

const INVOICE_PREFIX = "invoice:";

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceInternalBreakdownItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  rate: number;
};

export type InvoicePayment = {
  id: string;
  amount: number;
  method: string;
  reference?: string;
  note?: string;
  paidAt: string;
};

export type InvoicePaymentOptions = {
  check: boolean;
  cash: boolean;
  online: boolean;
  other: boolean;
  checkPayableTo: string;
  onlineLabel: string;
  onlinePaymentUrl: string;
  otherInstructions: string;
};

export type InvoiceRecord = {
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
  lineItems: InvoiceLineItem[];
  discountAmount: number;
  taxRate: number;
  notes: string;
  terms: string;
  paymentOptions: InvoicePaymentOptions;
  payments: InvoicePayment[];
  status: "draft" | "sent" | "viewed" | "partial" | "paid" | "void";
  sentAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  source?: string;
  internalInspectionNotes?: string;
  internalBreakdown?: InvoiceInternalBreakdownItem[];
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
};

export function money(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
}

export function calculateInvoiceTotals(invoice: Pick<InvoiceRecord, "lineItems" | "discountAmount" | "taxRate" | "payments">): InvoiceTotals {
  const subtotal = money(
    invoice.lineItems.reduce(
      (sum, item) => sum + Math.max(0, money(item.quantity)) * Math.max(0, money(item.rate)),
      0
    )
  );
  const discount = Math.min(Math.max(0, money(invoice.discountAmount)), subtotal);
  const taxableAmount = money(Math.max(0, subtotal - discount));
  const tax = money(taxableAmount * (Math.max(0, money(invoice.taxRate)) / 100));
  const total = money(taxableAmount + tax);
  const paid = money(
    invoice.payments.reduce((sum, payment) => sum + Math.max(0, money(payment.amount)), 0)
  );
  const balance = money(Math.max(0, total - paid));

  return { subtotal, discount, taxableAmount, tax, total, paid, balance };
}

function cleanString(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanLineItems(value: unknown): InvoiceLineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 40)
    .map((item, index) => ({
      id: cleanString(item?.id, 80) || `item-${index + 1}`,
      description: cleanString(item?.description, 220),
      quantity: Math.max(0, money(item?.quantity || 1)),
      rate: Math.max(0, money(item?.rate)),
    }))
    .filter((item) => item.description || item.rate > 0);
}

function cleanInternalBreakdown(value: unknown): InvoiceInternalBreakdownItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((item, index) => ({
      id: cleanString(item?.id, 80) || `internal-${index + 1}`,
      name: cleanString(item?.name, 160),
      category: cleanString(item?.category, 80),
      quantity: Math.max(0, money(item?.quantity || 1)),
      rate: Math.max(0, money(item?.rate)),
    }))
    .filter((item) => item.name || item.rate > 0);
}

function cleanPayments(value: unknown): InvoicePayment[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((payment, index) => ({
    id: cleanString(payment?.id, 80) || `payment-${index + 1}`,
    amount: Math.max(0, money(payment?.amount)),
    method: cleanString(payment?.method, 80) || "Other",
    reference: cleanString(payment?.reference, 120) || undefined,
    note: cleanString(payment?.note, 220) || undefined,
    paidAt: cleanString(payment?.paidAt, 80) || new Date().toISOString(),
  }));
}

function cleanPaymentOptions(value: unknown): InvoicePaymentOptions {
  const input = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return {
    check: Boolean(input.check ?? true),
    cash: Boolean(input.cash ?? false),
    online: Boolean(input.online ?? false),
    other: Boolean(input.other ?? false),
    checkPayableTo: cleanString(input.checkPayableTo, 120) || "Car Dash Detailing",
    onlineLabel: cleanString(input.onlineLabel, 80) || "Pay online",
    onlinePaymentUrl: cleanString(input.onlinePaymentUrl, 600),
    otherInstructions: cleanString(input.otherInstructions, 500),
  };
}

function normalizeStatus(input: unknown): InvoiceRecord["status"] {
  const allowed: InvoiceRecord["status"][] = ["draft", "sent", "viewed", "partial", "paid", "void"];
  const status = cleanString(input, 20) as InvoiceRecord["status"];
  return allowed.includes(status) ? status : "draft";
}

function withCalculatedStatus(invoice: InvoiceRecord): InvoiceRecord {
  if (invoice.status === "void") return invoice;
  const totals = calculateInvoiceTotals(invoice);
  if (totals.total > 0 && totals.balance <= 0) return { ...invoice, status: "paid" };
  if (totals.paid > 0) return { ...invoice, status: "partial" };
  return invoice;
}

export function sanitizeInvoiceInput(input: unknown, existing?: InvoiceRecord): InvoiceRecord {
  const body = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
  const now = new Date().toISOString();
  const id = existing?.id || cleanString(body.id, 80) || randomBytes(10).toString("hex");
  const shareToken = existing?.shareToken || randomBytes(18).toString("hex");

  const invoice: InvoiceRecord = {
    id,
    invoiceNumber: cleanString(body.invoiceNumber, 80) || existing?.invoiceNumber || "",
    shareToken,
    customerName: cleanString(body.customerName, 160),
    customerPhone: cleanString(body.customerPhone, 80),
    customerEmail: cleanString(body.customerEmail, 200),
    assetType: cleanString(body.assetType, 80) || "Vehicle",
    assetDescription: cleanString(body.assetDescription, 220),
    serviceDate: cleanString(body.serviceDate, 80),
    dueDate: cleanString(body.dueDate, 80),
    lineItems: cleanLineItems(body.lineItems),
    discountAmount: Math.max(0, money(body.discountAmount)),
    taxRate: Math.max(0, money(body.taxRate)),
    notes: cleanString(body.notes, 2000),
    terms: cleanString(body.terms, 2000),
    paymentOptions: cleanPaymentOptions(body.paymentOptions),
    payments: cleanPayments(body.payments ?? existing?.payments ?? []),
    status: normalizeStatus(body.status ?? existing?.status ?? "draft"),
    sentAt: existing?.sentAt || null,
    viewedAt: existing?.viewedAt || null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source: cleanString(body.source ?? existing?.source, 80) || undefined,
    internalInspectionNotes: cleanString(body.internalInspectionNotes ?? existing?.internalInspectionNotes, 4000) || undefined,
    internalBreakdown: cleanInternalBreakdown(body.internalBreakdown ?? existing?.internalBreakdown ?? []),
  };

  return withCalculatedStatus(invoice);
}

export async function requireOwner() {
  const auth = await getCurrentUser();
  if (!auth) return null;
  const user = await prisma.user.findUnique({ where: { id: auth.id }, select: { id: true, email: true, role: true } });
  if (!user) return null;
  const role = getRoleForEmail(user.email, user.role);
  return role === "owner" ? user : null;
}

export async function listInvoices() {
  const rows = await prisma.siteContent.findMany({
    where: { key: { startsWith: INVOICE_PREFIX } },
    orderBy: { updatedAt: "desc" },
  });

  return rows
    .map((row) => {
      try {
        return JSON.parse(row.value) as InvoiceRecord;
      } catch {
        return null;
      }
    })
    .filter((invoice): invoice is InvoiceRecord => Boolean(invoice));
}

export async function getInvoice(id: string) {
  const row = await prisma.siteContent.findUnique({ where: { key: `${INVOICE_PREFIX}${id}` } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as InvoiceRecord;
  } catch {
    return null;
  }
}

export async function getInvoiceByShareToken(token: string) {
  const invoices = await listInvoices();
  return invoices.find((invoice) => invoice.shareToken === token) || null;
}

export async function saveInvoice(invoice: InvoiceRecord) {
  const normalized = withCalculatedStatus({ ...invoice, updatedAt: new Date().toISOString() });
  await prisma.siteContent.upsert({
    where: { key: `${INVOICE_PREFIX}${normalized.id}` },
    create: { key: `${INVOICE_PREFIX}${normalized.id}`, value: JSON.stringify(normalized) },
    update: { value: JSON.stringify(normalized) },
  });
  return normalized;
}

export async function deleteInvoice(id: string) {
  await prisma.siteContent.delete({ where: { key: `${INVOICE_PREFIX}${id}` } }).catch(() => null);
}

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const invoices = await listInvoices();
  let max = 0;
  for (const invoice of invoices) {
    const match = invoice.invoiceNumber.match(new RegExp(`^CD-${year}-(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]) || 0);
  }
  return `CD-${year}-${String(max + 1).padStart(4, "0")}`;
}
