"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PRICING_PAGES,
  PricingPageConfig,
  VEHICLE_LABELS,
  VehicleClass,
  parsePricingConfig,
} from "@/lib/pricing-config";
import {
  BookingPricingConfig,
  DEFAULT_BOOKING_PRICING,
  DiscountCode,
  STANDALONE_HEADLIGHT_SERVICE_ID,
  calculateDiscount,
  parseBookingPricingConfig,
} from "@/lib/booking-pricing";

 type PricingKind = "packages" | "exterior" | "interior";

type FormState = {
  name: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim: string;
  vehicleId: string;
  serviceId: string;
  quoteThreadId: string;
  serviceNotes: string;
  preferredDate: string;
  preferredTime: string;
  selectedPackage: string;
  serviceMethod: string;
  vehicleType: string;
  serviceAddress: string;
  interiorCondition: string;
  exteriorCondition: string;
  addOns: string[];
  smsConsent: boolean;
  policyAgreed: boolean;
};

type Service = {
  id: string;
  title: string;
  price: number;
  pricingType: string;
  category: string;
  subcategory?: string;
  active: boolean;
};

type Vehicle = {
  id: string;
  nickname: string | null;
  year: string;
  make: string;
  model: string;
  trim: string | null;
  vehicleType: string;
};

type Quote = {
  id: string;
  subject: string;
  status: string;
  quotedPrice: number | null;
  service: { id: string; title: string } | null;
  vehicle: Vehicle | null;
};

type PackageSelection = {
  pricingPage: PricingKind;
  packageId: string;
  vehicleClass: VehicleClass;
  packageName: string;
  price: number;
};

type PricingConfigs = Record<PricingKind, PricingPageConfig>;
type AppliedDiscount = Pick<DiscountCode, "code" | "label" | "type" | "amount">;

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleTrim: "",
  vehicleId: "",
  serviceId: "",
  quoteThreadId: "",
  serviceNotes: "",
  preferredDate: "",
  preferredTime: "",
  selectedPackage: "",
  serviceMethod: "shop",
  vehicleType: "Sedan",
  serviceAddress: "",
  interiorCondition: "Light",
  exteriorCondition: "Light",
  addOns: [],
  smsConsent: false,
  policyAgreed: false,
};

const input = "mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#FF2D2D]/60";

function vehicleTypeToClass(value: string): VehicleClass {
  const normalized = value.toLowerCase();
  if (normalized.includes("truck") || normalized.includes("suv")) return "truckSuv";
  if (normalized.includes("coupe")) return "coupe";
  return "sedan";
}

function formatPricingType(service: Service) {
  if (service.pricingType === "fixed" && service.price > 0) return `$${service.price.toFixed(2)}`;
  if (service.pricingType === "starting") return "starting price · quote first";
  if (service.pricingType === "range") return "estimate range · quote first";
  return "quote required";
}

export default function BookingForm({ prefill, onClose }: { prefill?: { service?: string }; onClose?: () => void }) {
  const [form, setForm] = useState<FormState>({ ...initialState, selectedPackage: prefill?.service || "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [packageSelection, setPackageSelection] = useState<PackageSelection | null>(null);
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfigs>({
    packages: DEFAULT_PRICING_PAGES.packages,
    exterior: DEFAULT_PRICING_PAGES.exterior,
    interior: DEFAULT_PRICING_PAGES.interior,
  });
  const [bookingPricing, setBookingPricing] = useState<BookingPricingConfig>(DEFAULT_BOOKING_PRICING);
  const [setupMessage, setSetupMessage] = useState("");
  const [chatUrl, setChatUrl] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

  const set = (key: keyof FormState, value: unknown) => setForm((current) => ({ ...current, [key]: value }));

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.serviceId) || null,
    [services, form.serviceId]
  );

  const isStandaloneHeadlight = form.serviceId === STANDALONE_HEADLIGHT_SERVICE_ID || selectedService?.title.trim().toLowerCase() === "headlight restoration";
  const quoteLocked = Boolean(quote);

  const baseTotal = useMemo(() => {
    if (packageSelection) return packageSelection.price;
    if (quote?.quotedPrice && quote.quotedPrice > 0) return quote.quotedPrice;
    if (isStandaloneHeadlight) return bookingPricing.headlightStandalonePrice;
    if (selectedService?.pricingType === "fixed" && selectedService.price > 0) return selectedService.price;
    return null;
  }, [packageSelection, quote?.quotedPrice, isStandaloneHeadlight, bookingPricing.headlightStandalonePrice, selectedService]);

  const allowCarAddOns = Boolean(baseTotal) && !quoteLocked && !isStandaloneHeadlight && (
    Boolean(packageSelection) || !String(selectedService?.category || "").toLowerCase().includes("marine")
  );

  const activeAddOns = useMemo(() => bookingPricing.addOns.filter((item) => item.active), [bookingPricing.addOns]);
  const selectedAddOns = useMemo(
    () => allowCarAddOns ? activeAddOns.filter((item) => form.addOns.includes(item.id)) : [],
    [allowCarAddOns, activeAddOns, form.addOns]
  );
  const addOnTotal = useMemo(() => selectedAddOns.reduce((sum, item) => sum + Number(item.price || 0), 0), [selectedAddOns]);
  const subtotal = baseTotal == null ? null : Math.max(0, baseTotal + addOnTotal);
  const discountAmount = subtotal == null ? 0 : calculateDiscount(subtotal, appliedDiscount);
  const bookingTotal = subtotal == null ? null : Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  const packageChoiceValue = packageSelection ? `package:${packageSelection.pricingPage}:${packageSelection.packageId}` : "";
  const serviceChoiceValue = packageChoiceValue || (form.serviceId ? `service:${form.serviceId}` : "");

  const selectPackage = (kind: PricingKind, packageId: string, vehicleClass: VehicleClass) => {
    const pkg = pricingConfigs[kind].packages.find((item) => item.id === packageId);
    const price = Number(pkg?.prices?.[vehicleClass] || 0);
    if (!pkg || !price) {
      setPackageSelection(null);
      setSetupMessage("That package price could not be loaded. Please choose another package.");
      return;
    }
    setQuote(null);
    setPackageSelection({ pricingPage: kind, packageId, vehicleClass, packageName: pkg.name, price });
    setForm((current) => ({
      ...current,
      serviceId: "",
      quoteThreadId: "",
      selectedPackage: pkg.name,
      vehicleType: VEHICLE_LABELS[vehicleClass],
      addOns: current.addOns,
    }));
    setSetupMessage("");
  };

  const chooseBookingOption = (value: string) => {
    setSetupMessage("");
    setPackageSelection(null);
    setQuote(null);

    if (!value) {
      setForm((current) => ({ ...current, serviceId: "", selectedPackage: "", quoteThreadId: "", addOns: [] }));
      return;
    }

    const parts = value.split(":");
    if (parts[0] === "package") {
      const kind = parts[1] as PricingKind;
      const packageId = parts.slice(2).join(":");
      selectPackage(kind, packageId, vehicleTypeToClass(form.vehicleType));
      return;
    }

    if (parts[0] === "service") {
      const id = parts.slice(1).join(":");
      if (id === STANDALONE_HEADLIGHT_SERVICE_ID) {
        setForm((current) => ({
          ...current,
          serviceId: STANDALONE_HEADLIGHT_SERVICE_ID,
          quoteThreadId: "",
          selectedPackage: "Headlight Restoration",
          addOns: [],
        }));
        return;
      }
      const service = services.find((item) => item.id === id);
      setForm((current) => ({ ...current, serviceId: id, quoteThreadId: "", selectedPackage: service?.title || "", addOns: [] }));
      if (service && (service.pricingType !== "fixed" || service.price <= 0)) {
        setSetupMessage(`${service.title} needs an exact quote before booking. Use Chat to a Specialist and then book after accepting the final price.`);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [servicesResponse, authResponse, contentResponse] = await Promise.all([
        fetch("/api/services", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/site-content", { cache: "no-store" }),
      ]);

      const serviceData = servicesResponse.ok ? await servicesResponse.json() : [];
      const loadedServices: Service[] = Array.isArray(serviceData) ? serviceData : [];
      const content = contentResponse.ok ? await contentResponse.json() : {};
      const loadedPricing: PricingConfigs = {
        packages: parsePricingConfig(content?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages),
        exterior: parsePricingConfig(content?.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior),
        interior: parsePricingConfig(content?.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior),
      };
      const loadedBookingPricing = parseBookingPricingConfig(content?.bookingPricingConfig);

      if (!cancelled) {
        setServices(loadedServices);
        setPricingConfigs(loadedPricing);
        setBookingPricing(loadedBookingPricing);
      }

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (!cancelled && authData?.user) {
          setForm((current) => ({ ...current, name: authData.user.name || current.name, email: authData.user.email || current.email }));
          const vehicleResponse = await fetch("/api/vehicles", { cache: "no-store" });
          if (vehicleResponse.ok && !cancelled) setVehicles(await vehicleResponse.json());
        }
      }

      const params = new URLSearchParams(window.location.search);
      const quoteId = params.get("quote");
      const requestedService = params.get("service") || prefill?.service || "";
      const pricingPage = params.get("pricingPage") as PricingKind | null;
      const packageId = params.get("packageId") || "";
      const vehicleClass = params.get("vehicleClass") as VehicleClass | null;

      if (!quoteId && pricingPage && packageId && vehicleClass && ["packages", "exterior", "interior"].includes(pricingPage) && Object.prototype.hasOwnProperty.call(VEHICLE_LABELS, vehicleClass)) {
        const pkg = loadedPricing[pricingPage].packages.find((item) => item.id === packageId);
        const price = Number(pkg?.prices?.[vehicleClass] || 0);
        if (pkg && price > 0) {
          if (!cancelled) {
            setPackageSelection({ pricingPage, packageId, vehicleClass, packageName: pkg.name, price });
            setForm((current) => ({ ...current, serviceId: "", selectedPackage: pkg.name, vehicleType: VEHICLE_LABELS[vehicleClass] }));
          }
          return;
        }
        if (!cancelled) setSetupMessage("That package price could not be loaded. Return to the pricing page and choose the package again.");
        return;
      }

      if (quoteId) {
        const quoteResponse = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}`, { cache: "no-store" });
        const quoteData = quoteResponse.ok ? ((await quoteResponse.json()) as Quote) : null;
        if (!quoteResponse.ok || !quoteData) {
          if (!cancelled) setSetupMessage("That quote could not be loaded. Sign in with the account that owns the quote and try again.");
          return;
        }
        if (quoteData.status !== "accepted" || !quoteData.quotedPrice || quoteData.quotedPrice <= 0) {
          if (!cancelled) setSetupMessage("This quote is not ready to book yet. Accept the final quote first.");
          return;
        }
        if (!cancelled) {
          setQuote(quoteData);
          setPackageSelection(null);
          setForm((current) => ({
            ...current,
            quoteThreadId: quoteData.id,
            serviceId: quoteData.service?.id || "",
            selectedPackage: quoteData.service?.title || quoteData.subject,
            vehicleId: quoteData.vehicle?.id || current.vehicleId,
            vehicleYear: quoteData.vehicle?.year || current.vehicleYear,
            vehicleMake: quoteData.vehicle?.make || current.vehicleMake,
            vehicleModel: quoteData.vehicle?.model || current.vehicleModel,
            vehicleTrim: quoteData.vehicle?.trim || current.vehicleTrim,
            vehicleType: quoteData.vehicle?.vehicleType || current.vehicleType,
            addOns: [],
          }));
        }
        return;
      }

      if (requestedService) {
        const requestedLower = requestedService.toLowerCase();
        if (requestedLower.includes("headlight restoration")) {
          if (!cancelled) setForm((current) => ({ ...current, serviceId: STANDALONE_HEADLIGHT_SERVICE_ID, selectedPackage: "Headlight Restoration", addOns: [] }));
          return;
        }
        const match = loadedServices.find((service) => service.id === requestedService || service.title.toLowerCase() === requestedLower);
        if (!match) return;
        if (!cancelled) {
          setForm((current) => ({ ...current, serviceId: match.id, selectedPackage: match.title, addOns: [] }));
          if (match.pricingType !== "fixed" || match.price <= 0) setSetupMessage(`${match.title} needs an exact quote before booking. Use Chat to a Specialist, then book after accepting the final price.`);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [prefill?.service]);

  useEffect(() => {
    if (!form.preferredDate) { setSlots([]); return; }
    fetch(`/api/availability?date=${encodeURIComponent(form.preferredDate)}`)
      .then((response) => response.json())
      .then((data) => { setSlots(data.slots || []); set("preferredTime", ""); })
      .catch(() => setSlots([]));
  }, [form.preferredDate]);

  const chooseVehicle = (id: string) => {
    const vehicle = vehicles.find((item) => item.id === id);
    if (!vehicle) { set("vehicleId", ""); return; }
    const vehicleClass = vehicleTypeToClass(vehicle.vehicleType || "Sedan");
    if (packageSelection) selectPackage(packageSelection.pricingPage, packageSelection.packageId, vehicleClass);
    setSetupMessage("");
    setForm((current) => ({
      ...current,
      vehicleId: id,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehicleTrim: vehicle.trim || "",
      vehicleType: VEHICLE_LABELS[vehicleClass],
    }));
  };

  const changePackageVehicleClass = (vehicleClass: VehicleClass) => {
    if (!packageSelection) return;
    selectPackage(packageSelection.pricingPage, packageSelection.packageId, vehicleClass);
  };

  const toggleAddOn = (id: string) => {
    set("addOns", form.addOns.includes(id) ? form.addOns.filter((value) => value !== id) : [...form.addOns, id]);
  };

  const applyDiscount = async () => {
    if (!discountInput.trim()) { setDiscountMessage("Enter a discount code."); return; }
    setDiscountLoading(true);
    setDiscountMessage("");
    try {
      const response = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountInput }),
      });
      const data = await response.json();
      if (!response.ok || !data?.valid) throw new Error(data?.message || "That code is not valid.");
      setAppliedDiscount(data.discount);
      setDiscountInput(data.discount.code);
      setDiscountMessage(data.discount.label || "Discount applied.");
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountMessage(error instanceof Error ? error.message : "That code is not valid.");
    } finally {
      setDiscountLoading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    if (bookingTotal == null || bookingTotal < 0 || !baseTotal) {
      setStatus("error");
      setMessage("Choose a fixed-price service or book from an accepted quote so the appointment has an exact total.");
      return;
    }

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value)));
      body.append("displayedBookingTotal", String(bookingTotal));
      body.append("discountCode", appliedDiscount?.code || "");
      if (packageSelection) {
        body.append("pricingPage", packageSelection.pricingPage);
        body.append("packageId", packageSelection.packageId);
        body.append("vehicleClass", packageSelection.vehicleClass);
      }
      const response = await fetch("/api/bookings", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Could not submit booking");
      setStatus("success");
      setMessage(data.message || "Booking request submitted.");
      setChatUrl(String(data.chatUrl || ""));
      if (quote) setQuote((current) => (current ? { ...current, status: "booked" } : current));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit booking");
    }
  };

  const databaseServices = services.filter((service) => service.active && service.title.trim().toLowerCase() !== "headlight restoration");

  return (
    <form onSubmit={submit} className="space-y-5 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#FF2D2D]">{quoteLocked ? "Accepted quote" : packageSelection ? "Selected pricing package" : "Fixed-price booking"}</p>
        <h2 className="mt-2 text-2xl font-semibold">Request an appointment</h2>
        <p className="mt-1 text-sm text-white/40">Choose a service, add any extras, apply a valid discount code, and see the exact total before submitting.</p>
      </div>

      {setupMessage && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[.07] p-4 text-sm text-amber-100"><p>{setupMessage}</p><a href="/quote" className="mt-3 inline-block font-semibold text-[#FF2D2D]">Chat to a Specialist →</a></div>}

      {quoteLocked ? (
        <div className="rounded-3xl border border-[#FF2D2D]/25 bg-[#FF2D2D]/[.055] p-5">
          <p className="text-xs uppercase tracking-[.22em] text-[#FF2D2D]">Accepted quote</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xl font-semibold">{form.selectedPackage}</p><p className="mt-1 text-xs text-white/35">Quote #{form.quoteThreadId.slice(-7)}</p></div><p className="text-3xl font-semibold">${Number(baseTotal || 0).toFixed(2)}</p></div>
        </div>
      ) : (
        <label className="block text-sm text-white/60">
          Service or package
          <select className={input} value={serviceChoiceValue} onChange={(event) => chooseBookingOption(event.target.value)} required>
            <option value="">Choose a service</option>
            <optgroup label="Car Detailing Packages">{pricingConfigs.packages.packages.map((pkg) => <option key={`packages-${pkg.id}`} value={`package:packages:${pkg.id}`}>{pkg.name}</option>)}</optgroup>
            <optgroup label="Exterior Detailing">{pricingConfigs.exterior.packages.map((pkg) => <option key={`exterior-${pkg.id}`} value={`package:exterior:${pkg.id}`}>{pkg.name}</option>)}</optgroup>
            <optgroup label="Interior Detailing">{pricingConfigs.interior.packages.map((pkg) => <option key={`interior-${pkg.id}`} value={`package:interior:${pkg.id}`}>{pkg.name}</option>)}</optgroup>
            <optgroup label="Standalone Services"><option value={`service:${STANDALONE_HEADLIGHT_SERVICE_ID}`}>Headlight Restoration — ${bookingPricing.headlightStandalonePrice.toFixed(2)}</option></optgroup>
            {databaseServices.length > 0 && <optgroup label="Other Services">{databaseServices.map((service) => <option key={service.id} value={`service:${service.id}`}>{service.title} — {formatPricingType(service)}</option>)}</optgroup>}
          </select>
        </label>
      )}

      {packageSelection && !quoteLocked && (
        <div className="rounded-3xl border border-[#FF2D2D]/25 bg-[#FF2D2D]/[.055] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Package selection</p><h3 className="mt-2 text-xl font-semibold">{packageSelection.packageName}</h3></div><p className="text-3xl font-semibold">${packageSelection.price.toFixed(2)}</p></div>
          <div className="mt-4"><p className="text-xs uppercase tracking-[.18em] text-white/35">Vehicle size</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((key) => <button key={key} type="button" onClick={() => changePackageVehicleClass(key)} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${packageSelection.vehicleClass === key ? "border-[#FF2D2D]/55 bg-[#FF2D2D]/10" : "border-white/10 bg-black/20 text-white/55"}`}>{VEHICLE_LABELS[key]} · ${Number(pricingConfigs[packageSelection.pricingPage].packages.find((item) => item.id === packageSelection.packageId)?.prices?.[key] || 0).toFixed(0)}</button>)}</div></div>
        </div>
      )}

      {vehicles.length > 0 && !quoteLocked && <label className="block text-sm text-white/60">Saved vehicle<select className={input} value={form.vehicleId} onChange={(event) => chooseVehicle(event.target.value)}><option value="">Enter vehicle manually</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</option>)}</select></label>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-white/60">Name<input className={input} value={form.name} onChange={(event) => set("name", event.target.value)} required /></label>
        <label className="text-sm text-white/60">Phone<input className={input} value={form.phone} onChange={(event) => set("phone", event.target.value)} required /></label>
        <label className="text-sm text-white/60 sm:col-span-2">Email<input type="email" className={input} value={form.email} onChange={(event) => set("email", event.target.value)} required /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm text-white/60">Year<input className={input} value={form.vehicleYear} onChange={(event) => set("vehicleYear", event.target.value)} required /></label>
        <label className="text-sm text-white/60">Make<input className={input} value={form.vehicleMake} onChange={(event) => set("vehicleMake", event.target.value)} required /></label>
        <label className="text-sm text-white/60">Model<input className={input} value={form.vehicleModel} onChange={(event) => set("vehicleModel", event.target.value)} required /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-white/60">Preferred date<input type="date" className={input} value={form.preferredDate} onChange={(event) => set("preferredDate", event.target.value)} required /></label>
        <label className="text-sm text-white/60">Available time<select className={input} value={form.preferredTime} onChange={(event) => set("preferredTime", event.target.value)} required><option value="">Choose a time</option>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select>{form.preferredDate && slots.length === 0 && <span className="mt-2 block text-xs text-[#FF2D2D]">No standard slots available. Try another date or chat with a specialist.</span>}</label>
      </div>

      {allowCarAddOns && (
        <section className="rounded-[26px] border border-white/10 bg-white/[.025] p-5">
          <div><p className="text-sm font-semibold">Car Detailing Add-Ons</p><p className="mt-1 text-xs text-white/35">Every selected add-on is added to the booking total immediately. Headlight Restoration is ${bookingPricing.addOns.find((item) => item.id === "headlight-restoration")?.price.toFixed(0) || "80"} with a detail, or ${bookingPricing.headlightStandalonePrice.toFixed(0)} when booked alone.</p></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{activeAddOns.map((item) => <label key={item.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition ${form.addOns.includes(item.id) ? "border-[#FF2D2D]/35 bg-[#FF2D2D]/8 text-white" : "border-white/10 bg-black/20 text-white/55"}`}><span className="flex items-center gap-3"><input type="checkbox" checked={form.addOns.includes(item.id)} onChange={() => toggleAddOn(item.id)} />{item.name}</span><strong className="text-[#FF2D2D]">+${item.price.toFixed(2)}</strong></label>)}</div>
        </section>
      )}

      {baseTotal != null && (
        <section className="rounded-[26px] border border-white/10 bg-black/35 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm text-white/60">Discount code<input className={`${input} uppercase`} value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} placeholder="Enter code" /></label>
            <button type="button" onClick={applyDiscount} disabled={discountLoading} className="rounded-2xl border border-[#FF2D2D]/35 bg-[#FF2D2D]/8 px-5 py-3 text-sm font-semibold text-[#FF2D2D] disabled:opacity-50">{discountLoading ? "Checking…" : "Apply Code"}</button>
            {appliedDiscount && <button type="button" onClick={() => { setAppliedDiscount(null); setDiscountInput(""); setDiscountMessage(""); }} className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/55">Remove</button>}
          </div>
          {discountMessage && <p className={`mt-2 text-xs ${appliedDiscount ? "text-green-300" : "text-red-300"}`}>{discountMessage}</p>}

          <div className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between text-white/55"><span>Service / package</span><span>${Number(baseTotal).toFixed(2)}</span></div>
            {selectedAddOns.map((item) => <div key={item.id} className="flex justify-between text-white/50"><span>{item.name}</span><span>+${item.price.toFixed(2)}</span></div>)}
            {addOnTotal > 0 && <div className="flex justify-between text-white/65"><span>Add-ons subtotal</span><span>+${addOnTotal.toFixed(2)}</span></div>}
            {discountAmount > 0 && <div className="flex justify-between text-green-300"><span>Discount {appliedDiscount?.code ? `(${appliedDiscount.code})` : ""}</span><span>−${discountAmount.toFixed(2)}</span></div>}
            <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-4"><div><p className="text-[10px] uppercase tracking-[.18em] text-white/30">Exact booking total</p><p className="mt-1 text-xs text-white/35">Verified again when submitted</p></div><p className="text-3xl font-semibold">${Number(bookingTotal || 0).toFixed(2)}</p></div>
          </div>
        </section>
      )}

      <label className="block text-sm text-white/60">Notes<textarea className={`${input} min-h-28`} value={form.serviceNotes} onChange={(event) => set("serviceNotes", event.target.value)} placeholder="Anything we should know?" /></label>

      <label className="flex items-start gap-3 text-sm text-white/55"><input type="checkbox" checked={form.policyAgreed} onChange={(event) => set("policyAgreed", event.target.checked)} className="mt-1" /><span>I understand this is a booking request with the displayed total and Car Dash will confirm availability. I agree to the <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Terms and Conditions</a> and acknowledge the <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Privacy Policy</a>.</span></label>

      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><label className="flex items-start gap-3 text-sm text-white/60"><input type="checkbox" checked={form.smsConsent} onChange={(event) => set("smsConsent", event.target.checked)} className="mt-1" /><span>I agree to receive transactional and customer-care text messages from Car Dash Detailing about my quote, booking, appointment, and service updates. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.</span></label><p className="mt-3 pl-6 text-xs leading-5 text-white/38">See our <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Privacy Policy</a> and <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Terms and Conditions</a>.</p></div>

      {status !== "idle" && <div className={`rounded-2xl border p-4 text-sm ${status === "success" ? "border-green-800 bg-green-950/30 text-green-200" : "border-red-800 bg-red-950/30 text-red-200"}`}><p>{message}</p>{status === "success" && chatUrl && <a href={chatUrl} className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black">Open booking chat</a>}</div>}

      <div className="flex gap-3">
        <button disabled={status === "submitting" || status === "success" || quote?.status === "booked" || !form.policyAgreed || bookingTotal == null || !baseTotal || Boolean(setupMessage)} className="rounded-full bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D] disabled:cursor-not-allowed disabled:opacity-50">{status === "submitting" ? "Sending…" : status === "success" ? "Booking submitted" : bookingTotal != null ? `Submit $${bookingTotal.toFixed(2)} booking` : "Choose a service"}</button>
        {onClose && <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-6 py-3">Close</button>}
      </div>
    </form>
  );
}
