"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_DETAIL_BUILDER_CATALOG,
  DETAIL_BUILDER_CATEGORIES,
  DETAIL_BUILDER_VEHICLE_LABELS,
  type DetailBuilderCatalog,
  type DetailBuilderCatalogItem,
  type DetailBuilderVehicleClass,
} from "@/lib/detail-builder";
import {
  DEFAULT_PRICING_PAGES,
  parsePricingConfig,
  type PricingPageConfig,
} from "@/lib/pricing-config";

type SelectedItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  rate: number;
};

type CreatedInvoice = {
  id: string;
  invoiceNumber: string;
  shareToken: string;
  customerPhone?: string;
  status?: string;
  totals?: { total?: number; balance?: number };
  [key: string]: unknown;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const ESSENTIAL_IDS = [
  "mobile-setup",
  "interior-vacuum",
  "crevices-tracks",
  "dash-console",
  "door-panels",
  "interior-glass",
  "floor-mats",
  "pre-rinse",
  "foam-pre-soak",
  "hand-wash",
  "wheels-tires",
  "exterior-glass",
  "dry-finish",
  "tire-dressing",
  "spray-protection",
];

const FULL_IDS = [
  ...ESSENTIAL_IDS,
  "seat-cleaning",
  "under-seats",
  "cargo-area",
  "carpet-deep-clean",
  "light-stain",
  "interior-disinfect",
  "vents-controls",
  "bug-removal",
  "door-jambs",
];

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pricingKey(vehicle: DetailBuilderVehicleClass) {
  if (vehicle === "sedan") return "coupe" as const;
  if (vehicle === "suv") return "sedan" as const;
  return "truckSuv" as const;
}

export default function DetailBuilderPage() {
  const [catalog, setCatalog] = useState<DetailBuilderCatalog>(DEFAULT_DETAIL_BUILDER_CATALOG);
  const [packageConfig, setPackageConfig] = useState<PricingPageConfig>(DEFAULT_PRICING_PAGES.packages);
  const [vehicleClass, setVehicleClass] = useState<DetailBuilderVehicleClass>("sedan");
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [invoiceMode, setInvoiceMode] = useState<"summary" | "itemized">("summary");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingPrices, setEditingPrices] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<CreatedInvoice | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [catalogResponse, contentResponse] = await Promise.all([
          fetch("/api/detail-builder/catalog", { cache: "no-store" }),
          fetch("/api/site-content", { cache: "no-store" }),
        ]);
        if (catalogResponse.ok) {
          const data = await catalogResponse.json();
          if (data?.catalog) setCatalog(data.catalog);
        }
        if (contentResponse.ok) {
          const content = await contentResponse.json();
          setPackageConfig(parsePricingConfig(content?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages));
        }
      } catch {
        setMessage("Could not load saved component pricing. Default pricing is shown.");
      }
    })();
  }, []);

  const activeItems = useMemo(() => catalog.items.filter((item) => item.active), [catalog]);
  const selectedTotal = useMemo(
    () => selected.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.rate), 0),
    [selected]
  );

  const packagePrices = useMemo(() => {
    const key = pricingKey(vehicleClass);
    const essential = packageConfig.packages.find((item) => item.id === "essential");
    const full = packageConfig.packages.find((item) => item.id === "complete");
    return {
      essential: Number(essential?.prices?.[key] || 0),
      full: Number(full?.prices?.[key] || 0),
    };
  }, [packageConfig, vehicleClass]);

  const bundleMessage = useMemo(() => {
    if (!selectedTotal) return null;
    if (packagePrices.full > 0 && selectedTotal >= packagePrices.full) {
      return {
        tone: "warn",
        title: `Full Detail is cheaper by ${currency.format(selectedTotal - packagePrices.full)}`,
        body: `Your custom build is ${currency.format(selectedTotal)}. The current Full Detail price for this vehicle is ${currency.format(packagePrices.full)}.`,
      };
    }
    if (packagePrices.essential > 0 && selectedTotal >= packagePrices.essential) {
      return {
        tone: "info",
        title: "Check the Essential package before quoting",
        body: `This custom build is ${currency.format(selectedTotal)}. Essential Detail is ${currency.format(packagePrices.essential)} if its included work covers what the vehicle needs.`,
      };
    }
    return null;
  }, [packagePrices, selectedTotal]);

  function defaultRate(item: DetailBuilderCatalogItem) {
    return Number(item.prices[vehicleClass] || 0);
  }

  function toggleItem(item: DetailBuilderCatalogItem) {
    setCreatedInvoice(null);
    setSelected((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      if (exists) return current.filter((entry) => entry.id !== item.id);
      return [...current, { id: item.id, name: item.name, category: item.category, quantity: 1, rate: defaultRate(item) }];
    });
  }

  function changeVehicle(next: DetailBuilderVehicleClass) {
    setVehicleClass(next);
    setSelected((current) => current.map((entry) => {
      const catalogItem = catalog.items.find((item) => item.id === entry.id);
      return catalogItem ? { ...entry, rate: Number(catalogItem.prices[next] || 0) } : entry;
    }));
    setCreatedInvoice(null);
  }

  function loadPreset(ids: string[]) {
    const next = ids
      .map((itemId) => catalog.items.find((item) => item.id === itemId && item.active))
      .filter((item): item is DetailBuilderCatalogItem => Boolean(item))
      .map((item) => ({ id: item.id, name: item.name, category: item.category, quantity: 1, rate: defaultRate(item) }));
    setSelected(next);
    setCreatedInvoice(null);
  }

  function addCustomItem() {
    setSelected((current) => [
      ...current,
      { id: `custom-${id()}`, name: "Custom labor / service", category: "Custom", quantity: 1, rate: 0 },
    ]);
  }

  function updateSelected(itemId: string, patch: Partial<SelectedItem>) {
    setSelected((current) => current.map((item) => item.id === itemId ? { ...item, ...patch } : item));
    setCreatedInvoice(null);
  }

  function updateCatalogItem(itemId: string, patch: Partial<DetailBuilderCatalogItem>) {
    setCatalog((current) => ({
      ...current,
      items: current.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
    }));
  }

  function addCatalogItem() {
    setCatalog((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: `service-${id()}`,
          name: "New internal service",
          category: "Condition add-ons",
          description: "",
          prices: { sedan: 0, suv: 0, truck: 0 },
          active: true,
        },
      ],
    }));
  }

  async function saveCatalog() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/detail-builder/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save component pricing");
      setCatalog(data.catalog);
      setMessage("Internal component prices saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save component pricing");
    } finally {
      setSaving(false);
    }
  }

  async function createInvoice(action: "draft" | "send" | "paid") {
    if (!customerName.trim()) return setMessage("Add the customer's name first.");
    if (!vehicleDescription.trim()) return setMessage("Add the vehicle description first.");
    if (!selected.length || selectedTotal <= 0) return setMessage("Add at least one priced service.");
    if (action === "send" && !customerPhone.trim()) return setMessage("Add the customer's phone number before sending.");

    setSaving(true);
    setMessage("");
    setCreatedInvoice(null);

    try {
      const publicLineItems = invoiceMode === "itemized"
        ? selected.map((item) => ({
            id: item.id,
            description: item.name,
            quantity: item.quantity,
            rate: item.rate,
          }))
        : [{ id: `custom-detail-${id()}`, description: "Custom Detail", quantity: 1, rate: selectedTotal }];

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          assetType: "Vehicle",
          assetDescription: vehicleDescription.trim(),
          serviceDate,
          dueDate: serviceDate,
          lineItems: publicLineItems,
          discountAmount: 0,
          taxRate: 0,
          notes: customerNotes.trim(),
          terms: "Payment is due upon receipt unless otherwise noted.",
          paymentOptions: {
            check: true,
            cash: true,
            online: true,
            other: false,
            checkPayableTo: "Car Dash Detailing",
            onlineLabel: "Pay online",
            onlinePaymentUrl: "",
            otherInstructions: "",
          },
          payments: [],
          status: "draft",
          source: "detail-builder",
          internalInspectionNotes: inspectionNotes.trim(),
          internalBreakdown: selected.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            rate: item.rate,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create invoice");
      let invoice = data.invoice as CreatedInvoice;

      if (action === "paid") {
        const paidTotal = Number(invoice.totals?.total || selectedTotal);
        const payment = {
          id: `payment-${id()}`,
          amount: paidTotal,
          method: paymentMethod,
          note: "Recorded from Detail Builder",
          paidAt: new Date().toISOString(),
        };
        const paidResponse = await fetch(`/api/invoices/${invoice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...invoice, payments: [payment] }),
        });
        const paidData = await paidResponse.json().catch(() => ({}));
        if (!paidResponse.ok) throw new Error(paidData.error || "Invoice created, but payment could not be recorded.");
        invoice = paidData.invoice;
        setMessage(`${invoice.invoiceNumber} created and marked paid by ${paymentMethod}.`);
      } else if (action === "send") {
        const smsResponse = await fetch(`/api/invoices/${invoice.id}/sms`, { method: "POST" });
        const smsData = await smsResponse.json().catch(() => ({}));
        if (!smsResponse.ok) throw new Error(smsData.error || "Invoice created, but the text could not be sent.");
        invoice = { ...invoice, status: "sent" };
        setMessage(`${invoice.invoiceNumber} created and texted to ${customerPhone}.`);
      } else {
        setMessage(`${invoice.invoiceNumber} created.`);
      }

      setCreatedInvoice(invoice);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create invoice");
    } finally {
      setSaving(false);
    }
  }

  async function copyInvoiceLink() {
    if (!createdInvoice) return;
    const link = `${window.location.origin}/invoice/${createdInvoice.shareToken}`;
    await navigator.clipboard.writeText(link);
    setMessage("Invoice link copied.");
  }

  async function shareInvoice() {
    if (!createdInvoice) return;
    const link = `${window.location.origin}/invoice/${createdInvoice.shareToken}`;
    if (navigator.share) {
      await navigator.share({
        title: `Car Dash invoice ${createdInvoice.invoiceNumber}`,
        text: `Here is your Car Dash Detailing invoice: ${link}`,
        url: link,
      }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(link);
      setMessage("Invoice link copied.");
    }
  }

  function resetInspection() {
    setSelected([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setVehicleDescription("");
    setInspectionNotes("");
    setCustomerNotes("");
    setCreatedInvoice(null);
    setMessage("");
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1420px]">
        <div className="mb-7 flex flex-col gap-4 border-b border-black/[.08] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/36">Owner-only inspection checkout</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#111] sm:text-4xl">Build a Detail</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-black/48">Walk the vehicle, add only the work it needs, and build the price in real time. The micro-pricing stays private to the owner unless you choose an itemized invoice.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEditingPrices((value) => !value)} className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/60 hover:border-black/20 hover:text-black">{editingPrices ? "Close price editor" : "Edit component prices"}</button>
            <button onClick={resetInspection} className="rounded-md bg-[#111] px-4 py-2.5 text-sm font-semibold text-white">New inspection</button>
          </div>
        </div>

        {message && <div className="mb-6 rounded-md border border-black/10 bg-white px-4 py-3 text-sm text-black/60">{message}</div>}

        {editingPrices && (
          <section className="mb-7 rounded-lg border border-black/[.08] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-black/[.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#111]">Internal component pricing</h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-black/42">These prices never appear on the public pricing pages. They are your private à-la-carte estimating catalog and can be changed anytime.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={addCatalogItem} className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold">+ Add item</button>
                <button disabled={saving} onClick={saveCatalog} className="rounded-md bg-[#111] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save prices"}</button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-black/[.08] text-black/38"><th className="px-2 py-3 font-semibold">Service</th><th className="px-2 py-3 font-semibold">Category</th><th className="px-2 py-3 font-semibold">Sedan</th><th className="px-2 py-3 font-semibold">SUV / CRV</th><th className="px-2 py-3 font-semibold">Truck / 3-row</th><th className="px-2 py-3 font-semibold">Active</th></tr></thead>
                <tbody>
                  {catalog.items.map((item) => (
                    <tr key={item.id} className="border-b border-black/[.06]">
                      <td className="px-2 py-2"><input value={item.name} onChange={(e) => updateCatalogItem(item.id, { name: e.target.value })} className="w-full rounded border border-black/10 bg-[#fafafa] px-2.5 py-2 text-sm outline-none focus:border-black/30" /></td>
                      <td className="px-2 py-2"><input value={item.category} onChange={(e) => updateCatalogItem(item.id, { category: e.target.value })} className="w-full rounded border border-black/10 bg-[#fafafa] px-2.5 py-2 outline-none focus:border-black/30" /></td>
                      {(["sedan", "suv", "truck"] as DetailBuilderVehicleClass[]).map((vehicle) => (
                        <td key={vehicle} className="px-2 py-2"><input type="number" min="0" step="1" value={item.prices[vehicle]} onChange={(e) => updateCatalogItem(item.id, { prices: { ...item.prices, [vehicle]: Number(e.target.value) } })} className="w-24 rounded border border-black/10 bg-[#fafafa] px-2.5 py-2 outline-none focus:border-black/30" /></td>
                      ))}
                      <td className="px-2 py-2"><input type="checkbox" checked={item.active} onChange={(e) => updateCatalogItem(item.id, { active: e.target.checked })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_370px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-black/[.08] bg-white p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/35">Step 1</p>
                  <h3 className="mt-2 text-lg font-semibold">Vehicle + customer</h3>
                  <div className="mt-4 grid gap-3">
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-sm outline-none focus:border-black/30" />
                    <div className="grid gap-3 sm:grid-cols-2"><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-sm outline-none focus:border-black/30" /><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (optional)" className="rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-sm outline-none focus:border-black/30" /></div>
                    <input value={vehicleDescription} onChange={(e) => setVehicleDescription(e.target.value)} placeholder="2024 Lexus ES350 · Black" className="rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-sm outline-none focus:border-black/30" />
                    <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-sm outline-none focus:border-black/30" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/35">Vehicle size</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    {(Object.keys(DETAIL_BUILDER_VEHICLE_LABELS) as DetailBuilderVehicleClass[]).map((vehicle) => (
                      <button key={vehicle} onClick={() => changeVehicle(vehicle)} className={`flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm ${vehicleClass === vehicle ? "border-[#111] bg-[#111] text-white" : "border-black/10 bg-[#fafafa] text-black/60 hover:border-black/20"}`}>
                        <span className="font-semibold">{DETAIL_BUILDER_VEHICLE_LABELS[vehicle]}</span>
                        <span className={vehicleClass === vehicle ? "text-white/45" : "text-black/30"}>{vehicle === "sedan" ? "Car" : vehicle === "suv" ? "2-row" : "Large"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 border-t border-black/[.08] pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/35">Quick starting point</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setSelected([])} className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold">Blank</button>
                      <button onClick={() => loadPreset(ESSENTIAL_IDS)} className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold">Essential checklist</button>
                      <button onClick={() => loadPreset(FULL_IDS)} className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold">Full checklist</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-black/[.08] bg-white p-5 sm:p-6">
              <div className="border-b border-black/[.08] pb-5">
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/35">Step 2 · Inspect the vehicle</p>
                <h3 className="mt-2 text-lg font-semibold">Tap only what this vehicle needs.</h3>
                <p className="mt-1 text-xs leading-5 text-black/42">Each price is private. Tap a selected service again to remove it; adjust the exact rate or quantity in the estimate panel.</p>
              </div>

              <div className="mt-6 space-y-8">
                {DETAIL_BUILDER_CATEGORIES.map((category) => {
                  const items = activeItems.filter((item) => item.category === category);
                  if (!items.length) return null;
                  return (
                    <div key={category}>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#111]">{category}</h4>
                        <span className="text-[10px] uppercase tracking-[.12em] text-black/28">{items.filter((item) => selected.some((entry) => entry.id === item.id)).length} selected</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => {
                          const isSelected = selected.some((entry) => entry.id === item.id);
                          return (
                            <button key={item.id} onClick={() => toggleItem(item)} className={`min-h-[112px] rounded-md border p-4 text-left transition ${isSelected ? "border-[#111] bg-[#111] text-white" : "border-black/[.08] bg-[#fafafa] hover:border-black/20"}`}>
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-sm font-semibold">{item.name}</span>
                                <span className={`shrink-0 text-sm font-semibold ${isSelected ? "text-white" : "text-black/60"}`}>{currency.format(defaultRate(item))}</span>
                              </div>
                              <p className={`mt-2 text-xs leading-5 ${isSelected ? "text-white/50" : "text-black/38"}`}>{item.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {activeItems.some((item) => !DETAIL_BUILDER_CATEGORIES.includes(item.category as typeof DETAIL_BUILDER_CATEGORIES[number])) && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold">Other</h4>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {activeItems.filter((item) => !DETAIL_BUILDER_CATEGORIES.includes(item.category as typeof DETAIL_BUILDER_CATEGORIES[number])).map((item) => {
                        const isSelected = selected.some((entry) => entry.id === item.id);
                        return <button key={item.id} onClick={() => toggleItem(item)} className={`rounded-md border p-4 text-left ${isSelected ? "border-[#111] bg-[#111] text-white" : "border-black/[.08] bg-[#fafafa]"}`}><div className="flex justify-between gap-3"><span className="text-sm font-semibold">{item.name}</span><span className="text-sm font-semibold">{currency.format(defaultRate(item))}</span></div></button>;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 grid gap-4 border-t border-black/[.08] pt-6 sm:grid-cols-2">
                <label className="text-xs font-medium text-black/45">Private inspection notes
                  <textarea value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-sm text-black outline-none focus:border-black/30" placeholder="Heavy crumbs under rear seats, passenger mat stain, front bumper bugs… Only owner records this." />
                </label>
                <label className="text-xs font-medium text-black/45">Customer invoice note
                  <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-black/10 bg-[#fafafa] px-3.5 py-3 text-sm text-black outline-none focus:border-black/30" placeholder="Optional note the customer can see." />
                </label>
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <section className="overflow-hidden rounded-lg border border-black/[.09] bg-white">
              <div className="border-b border-black/[.08] bg-[#111] px-5 py-5 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/35">Live estimate</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div><p className="text-4xl font-semibold tracking-[-.05em]">{currency.format(selectedTotal)}</p><p className="mt-1 text-xs text-white/38">{selected.length} selected item{selected.length === 1 ? "" : "s"}</p></div>
                  <span className="text-xs text-white/45">{DETAIL_BUILDER_VEHICLE_LABELS[vehicleClass]}</span>
                </div>
              </div>

              <div className="max-h-[390px] overflow-y-auto px-4">
                {selected.length ? selected.map((item) => (
                  <div key={item.id} className="border-b border-black/[.07] py-4">
                    <div className="flex items-start justify-between gap-3">
                      <input value={item.name} onChange={(e) => updateSelected(item.id, { name: e.target.value })} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111] outline-none" />
                      <button onClick={() => setSelected((current) => current.filter((entry) => entry.id !== item.id))} className="text-lg leading-none text-black/25 hover:text-black">×</button>
                    </div>
                    <div className="mt-2 grid grid-cols-[72px_1fr_auto] items-center gap-2">
                      <input type="number" min="0.25" step="0.25" value={item.quantity} onChange={(e) => updateSelected(item.id, { quantity: Number(e.target.value) })} className="rounded border border-black/10 bg-[#fafafa] px-2 py-2 text-xs outline-none" />
                      <input type="number" min="0" step="1" value={item.rate} onChange={(e) => updateSelected(item.id, { rate: Number(e.target.value) })} className="rounded border border-black/10 bg-[#fafafa] px-2 py-2 text-xs outline-none" />
                      <span className="text-xs font-semibold text-black/55">{currency.format(item.quantity * item.rate)}</span>
                    </div>
                  </div>
                )) : <p className="py-8 text-center text-sm text-black/35">Tap services during the inspection to build the price.</p>}
              </div>

              <div className="border-t border-black/[.08] p-4">
                <button onClick={addCustomItem} className="w-full rounded-md border border-dashed border-black/15 px-3 py-2.5 text-xs font-semibold text-black/48 hover:border-black/30 hover:text-black">+ Add custom labor / service</button>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-[#f5f4f1] p-3"><span className="block text-black/35">Essential</span><strong className="mt-1 block text-sm">{packagePrices.essential ? currency.format(packagePrices.essential) : "—"}</strong></div>
                  <div className="rounded-md bg-[#f5f4f1] p-3"><span className="block text-black/35">Full Detail</span><strong className="mt-1 block text-sm">{packagePrices.full ? currency.format(packagePrices.full) : "—"}</strong></div>
                </div>

                {bundleMessage && <div className={`mt-3 rounded-md px-3.5 py-3 text-xs leading-5 ${bundleMessage.tone === "warn" ? "border border-amber-300/50 bg-amber-50 text-amber-950" : "border border-black/10 bg-[#fafafa] text-black/55"}`}><strong className="block">{bundleMessage.title}</strong><span className="mt-1 block opacity-75">{bundleMessage.body}</span></div>}

                <div className="mt-5 border-t border-black/[.08] pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/35">Customer invoice</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => setInvoiceMode("summary")} className={`rounded-md border px-3 py-2 text-xs font-semibold ${invoiceMode === "summary" ? "border-[#111] bg-[#111] text-white" : "border-black/10"}`}>One clean total</button>
                    <button onClick={() => setInvoiceMode("itemized")} className={`rounded-md border px-3 py-2 text-xs font-semibold ${invoiceMode === "itemized" ? "border-[#111] bg-[#111] text-white" : "border-black/10"}`}>Itemized</button>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-black/35">{invoiceMode === "summary" ? "Customer sees “Custom Detail” and the total. Your private component breakdown is still saved." : "Customer sees each selected service and its price."}</p>
                </div>

                <div className="mt-5 grid gap-2">
                  <button disabled={saving} onClick={() => createInvoice("draft")} className="rounded-md bg-[#111] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Working…" : "Create invoice"}</button>
                  <button disabled={saving} onClick={() => createInvoice("send")} className="rounded-md border border-black/12 bg-white px-4 py-3 text-sm font-semibold text-black/65 disabled:opacity-50">Create + text invoice</button>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded-md border border-black/10 bg-[#fafafa] px-3 py-3 text-xs outline-none"><option>Cash</option><option>Card in person</option><option>Check</option><option>Other</option></select>
                    <button disabled={saving} onClick={() => createInvoice("paid")} className="rounded-md border border-black/12 bg-[#f5f4f1] px-3 py-3 text-xs font-semibold disabled:opacity-50">Create + mark paid</button>
                  </div>
                  <p className="text-[10px] leading-4 text-black/30">“Mark paid” records an in-person payment; it does not charge a card. Online invoice payment uses your existing Stripe Checkout flow.</p>
                </div>
              </div>
            </section>

            {createdInvoice && (
              <section className="mt-4 rounded-lg border border-black/[.09] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/35">Invoice ready</p><p className="mt-1 text-lg font-semibold">{createdInvoice.invoiceNumber}</p></div>
                  <span className="rounded border border-black/10 bg-[#f5f4f1] px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-black/45">{createdInvoice.status || "draft"}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={copyInvoiceLink} className="rounded-md border border-black/10 px-3 py-2.5 text-xs font-semibold">Copy link</button>
                  <button onClick={shareInvoice} className="rounded-md border border-black/10 px-3 py-2.5 text-xs font-semibold">Share</button>
                  <a href={`/invoice/${createdInvoice.shareToken}`} target="_blank" rel="noreferrer" className="rounded-md border border-black/10 px-3 py-2.5 text-center text-xs font-semibold">Customer view</a>
                  <a href="/owner/invoices" className="rounded-md border border-black/10 px-3 py-2.5 text-center text-xs font-semibold">Invoices</a>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
