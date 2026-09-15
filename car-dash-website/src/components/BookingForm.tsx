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
import type { SiteContent } from "@/lib/site-defaults";
import BookingDatePicker from "@/components/BookingDatePicker";


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
type AppliedDiscount = Pick<DiscountCode, "code" | "label" | "type" | "amount" | "appliesTo">;

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

async function compressBookingPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose image files only.");
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

  const maxDimension = 1400;
  const ratio = Math.min(1, maxDimension / Math.max(source.naturalWidth, source.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(source.naturalHeight * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare that photo.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(source.src);

  let quality = 0.8;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > 580000 && quality > 0.42) {
    quality -= 0.08;
    result = canvas.toDataURL("image/jpeg", quality);
  }
  if (result.length > 650000) throw new Error("One of those photos is still too large. Try a smaller photo.");
  return result;
}

export default function BookingForm({ prefill, onClose, initialSiteContent }: { prefill?: { service?: string }; onClose?: () => void; initialSiteContent?: SiteContent }) {
  const [form, setForm] = useState<FormState>({ ...initialState, selectedPackage: prefill?.service || "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [packageSelection, setPackageSelection] = useState<PackageSelection | null>(null);
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfigs>(() => ({
    packages: parsePricingConfig(initialSiteContent?.pricingPackagesConfig, DEFAULT_PRICING_PAGES.packages),
    exterior: parsePricingConfig(initialSiteContent?.pricingExteriorConfig, DEFAULT_PRICING_PAGES.exterior),
    interior: parsePricingConfig(initialSiteContent?.pricingInteriorConfig, DEFAULT_PRICING_PAGES.interior),
  }));
  const [bookingPricing, setBookingPricing] = useState<BookingPricingConfig>(() =>
    initialSiteContent ? parseBookingPricingConfig(initialSiteContent.bookingPricingConfig) : DEFAULT_BOOKING_PRICING
  );
  const [setupMessage, setSetupMessage] = useState("");
  const [chatUrl, setChatUrl] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [bookingPhotos, setBookingPhotos] = useState<string[]>([]);
  const [photoMessage, setPhotoMessage] = useState("");

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
  const discountAmount = subtotal == null ? 0 : calculateDiscount(subtotal, appliedDiscount, baseTotal ?? subtotal);
  const bookingTotal = subtotal == null ? null : Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  const packageChoiceValue = packageSelection ? `package:${packageSelection.pricingPage}:${packageSelection.packageId}` : "";
  const serviceChoiceValue = packageChoiceValue || (form.serviceId ? `service:${form.serviceId}` : "");
  const bookingDiscountTarget = packageSelection
    ? `package:${packageSelection.pricingPage}:${packageSelection.packageId}`
    : quote
      ? null
      : form.serviceId
        ? `service:${form.serviceId}`
        : null;

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
        setSetupMessage(`${service.title} needs an exact quote before booking. Use Get an Exact Quote and then book after accepting the final price.`);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const contentRequest = initialSiteContent
        ? Promise.resolve(null)
        : fetch("/api/site-content", { cache: "no-store" });
      const [servicesResponse, authResponse, contentResponse] = await Promise.all([
        fetch("/api/services", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
        contentRequest,
      ]);

      const serviceData = servicesResponse.ok ? await servicesResponse.json() : [];
      const loadedServices: Service[] = Array.isArray(serviceData) ? serviceData : [];
      const content = initialSiteContent ?? (contentResponse?.ok ? await contentResponse.json() : {});
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
          if (match.pricingType !== "fixed" || match.price <= 0) setSetupMessage(`${match.title} needs an exact quote before booking. Use Get an Exact Quote, then book after accepting the final price.`);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [prefill?.service, initialSiteContent]);

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

  const chooseBookingPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoMessage("");
    const files = [...(event.target.files || [])].slice(0, 3);
    if (!files.length) {
      setBookingPhotos([]);
      return;
    }
    try {
      const prepared = await Promise.all(files.map(compressBookingPhoto));
      setBookingPhotos(prepared);
      setPhotoMessage(`${prepared.length} photo${prepared.length === 1 ? "" : "s"} ready to send with your booking.`);
    } catch (error) {
      setBookingPhotos([]);
      setPhotoMessage(error instanceof Error ? error.message : "Could not prepare those photos.");
    }
  };

  useEffect(() => {
    if (!appliedDiscount?.appliesTo) return;
    if (appliedDiscount.appliesTo === bookingDiscountTarget) return;
    setAppliedDiscount(null);
    setDiscountMessage("That discount was removed because it only applies to a different service.");
  }, [bookingDiscountTarget, appliedDiscount?.appliesTo]);

  const applyDiscount = async () => {
    if (!discountInput.trim()) { setDiscountMessage("Enter a discount code."); return; }
    setDiscountLoading(true);
    setDiscountMessage("");
    try {
      const response = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountInput, email: form.email, phone: form.phone, bookingTarget: bookingDiscountTarget }),
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
    if (!form.preferredDate || !form.preferredTime) {
      setStatus("error");
      setMessage("Choose an available date and time before submitting.");
      return;
    }
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
      body.append("attachments", JSON.stringify(bookingPhotos));
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
    <form onSubmit={submit} className="space-y-6 text-white">
      <div className="border-b border-white/10 pb-5">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF2D2D]">Appointment</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Book your detail</h2>
        <p className="mt-2 text-sm leading-6 text-white/42">Choose the service, enter the car, pick an open time, and submit. You can attach photos too.</p>
        <p className="mt-3 text-xs text-white/34">Not sure which detail you need? <a href="/quote" className="font-semibold text-[#FF2D2D]">Get a free photo quote →</a></p>
      </div>

      {setupMessage && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[.07] p-4 text-sm text-amber-100"><p>{setupMessage}</p><a href="/quote" className="mt-3 inline-block font-semibold text-[#FF2D2D]">Get an Exact Quote →</a></div>}

      <section>
        <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#111]">1</span><div><h3 className="font-semibold">Service</h3><p className="text-xs text-white/35">Pick what you want done.</p></div></div>

        {quoteLocked ? (
          <div className="rounded-2xl border border-[#FF2D2D]/25 bg-[#FF2D2D]/[.055] p-4">
            <p className="text-xs uppercase tracking-[.18em] text-[#FF2D2D]">Accepted quote</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><p className="text-lg font-semibold">{form.selectedPackage}</p><p className="mt-1 text-xs text-white/35">Quote #{form.quoteThreadId.slice(-7)}</p></div><p className="text-2xl font-semibold">${Number(baseTotal || 0).toFixed(2)}</p></div>
          </div>
        ) : (
          <label className="block text-sm text-white/55">
            Service or package
            <select className={input} value={serviceChoiceValue} onChange={(event) => chooseBookingOption(event.target.value)} required>
              <option value="">Choose a service</option>
              <optgroup label="Full Detailing">{pricingConfigs.packages.packages.map((pkg) => <option key={`packages-${pkg.id}`} value={`package:packages:${pkg.id}`}>{pkg.name}</option>)}</optgroup>
              <optgroup label="Interior Only">{pricingConfigs.interior.packages.map((pkg) => <option key={`interior-${pkg.id}`} value={`package:interior:${pkg.id}`}>{pkg.name}</option>)}</optgroup>
              <optgroup label="Exterior Only">{pricingConfigs.exterior.packages.map((pkg) => <option key={`exterior-${pkg.id}`} value={`package:exterior:${pkg.id}`}>{pkg.name}</option>)}</optgroup>
              <optgroup label="Standalone"><option value={`service:${STANDALONE_HEADLIGHT_SERVICE_ID}`}>Headlight Restoration — ${bookingPricing.headlightStandalonePrice.toFixed(0)}</option></optgroup>
              {databaseServices.length > 0 && <optgroup label="Other Services">{databaseServices.map((service) => <option key={service.id} value={`service:${service.id}`}>{service.title} — {formatPricingType(service)}</option>)}</optgroup>}
            </select>
          </label>
        )}

        {packageSelection && !quoteLocked && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{packageSelection.packageName}</p><p className="mt-1 text-xs text-white/35">Choose vehicle size</p></div><p className="text-2xl font-semibold">${packageSelection.price.toFixed(0)}</p></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">{(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((key) => <button key={key} type="button" onClick={() => changePackageVehicleClass(key)} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${packageSelection.vehicleClass === key ? "border-[#FF2D2D]/55 bg-[#FF2D2D]/10 text-white" : "border-white/10 bg-black/20 text-white/45"}`}>{VEHICLE_LABELS[key]} · ${Number(pricingConfigs[packageSelection.pricingPage].packages.find((item) => item.id === packageSelection.packageId)?.prices?.[key] || 0).toFixed(0)}</button>)}</div>
          </div>
        )}
      </section>

      <section className="border-t border-white/8 pt-6">
        <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#111]">2</span><div><h3 className="font-semibold">Your car + contact</h3><p className="text-xs text-white/35">Just enough info to know who and what we’re booking.</p></div></div>

        {vehicles.length > 0 && !quoteLocked && <label className="mb-4 block text-sm text-white/55">Saved vehicle<select className={input} value={form.vehicleId} onChange={(event) => chooseVehicle(event.target.value)}><option value="">Enter vehicle manually</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</option>)}</select></label>}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-white/55">Name<input className={input} value={form.name} onChange={(event) => set("name", event.target.value)} required /></label>
          <label className="text-sm text-white/55">Phone<input className={input} value={form.phone} onChange={(event) => set("phone", event.target.value)} required /></label>
          <label className="text-sm text-white/55 sm:col-span-2">Email<input type="email" className={input} value={form.email} onChange={(event) => set("email", event.target.value)} required /></label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-white/55">Year<input className={input} value={form.vehicleYear} onChange={(event) => set("vehicleYear", event.target.value)} required /></label>
          <label className="text-sm text-white/55">Make<input className={input} value={form.vehicleMake} onChange={(event) => set("vehicleMake", event.target.value)} required /></label>
          <label className="text-sm text-white/55">Model<input className={input} value={form.vehicleModel} onChange={(event) => set("vehicleModel", event.target.value)} required /></label>
        </div>
      </section>

      <section className="border-t border-white/8 pt-6">
        <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#111]">3</span><div><h3 className="font-semibold">Date + time</h3><p className="text-xs text-white/35">Grey dates are unavailable. Booked times are removed.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="text-sm text-white/55"><p>Day</p><BookingDatePicker value={form.preferredDate} onChange={(value) => { set("preferredDate", value); set("preferredTime", ""); }} /></div>
          <label className="text-sm text-white/55">Time<select className={input} value={form.preferredTime} onChange={(event) => set("preferredTime", event.target.value)} required><option value="">Choose a time</option>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select>{form.preferredDate && slots.length === 0 && <span className="mt-2 block text-xs text-[#FF2D2D]">No times left on this day. Choose another date.</span>}</label>
        </div>
      </section>

      {(allowCarAddOns || baseTotal != null) && (
        <section className="border-t border-white/8 pt-6">
          <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#111]">4</span><div><h3 className="font-semibold">Optional</h3><p className="text-xs text-white/35">Only open these if you need them.</p></div></div>

          <div className="space-y-3">
            {allowCarAddOns && (
              <details className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
                <summary className="cursor-pointer text-sm font-semibold">Add-ons <span className="ml-2 text-xs font-normal text-white/35">Pet hair, shampoo, wax, engine bay, etc.</span></summary>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{activeAddOns.map((item) => <label key={item.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm ${form.addOns.includes(item.id) ? "border-[#FF2D2D]/35 bg-[#FF2D2D]/8 text-white" : "border-white/10 bg-black/20 text-white/52"}`}><span className="flex items-center gap-3"><input type="checkbox" checked={form.addOns.includes(item.id)} onChange={() => toggleAddOn(item.id)} />{item.name}</span><strong className="text-white">+${item.price.toFixed(0)}</strong></label>)}</div>
              </details>
            )}

            {baseTotal != null && (
              <details className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
                <summary className="cursor-pointer text-sm font-semibold">Have a discount code?</summary>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm text-white/55">Discount code<input className={`${input} uppercase`} value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} placeholder="Enter code" /></label><button type="button" onClick={applyDiscount} disabled={discountLoading} className="rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold disabled:opacity-50">{discountLoading ? "Checking…" : "Apply"}</button>{appliedDiscount && <button type="button" onClick={() => { setAppliedDiscount(null); setDiscountInput(""); setDiscountMessage(""); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/50">Remove</button>}</div>
                {discountMessage && <p className={`mt-2 text-xs ${appliedDiscount ? "text-green-300" : "text-red-300"}`}>{discountMessage}</p>}
              </details>
            )}

            <details className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <summary className="cursor-pointer text-sm font-semibold">Attach photos <span className="ml-2 text-xs font-normal text-white/35">Optional · up to 3</span></summary>
              <div className="mt-4">
                <p className="text-xs leading-5 text-white/40">Show us stains, pet hair, paint condition, scratches, or anything you want us to see before the appointment.</p>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple onChange={chooseBookingPhotos} className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/60" />
                {photoMessage && <p className="mt-2 text-xs text-white/45">{photoMessage}</p>}
                {bookingPhotos.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{bookingPhotos.map((src, index) => <img key={index} src={src} alt={`Vehicle upload ${index + 1}`} className="h-24 w-full rounded-xl object-cover" />)}</div>}
              </div>
            </details>

            <details className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <summary className="cursor-pointer text-sm font-semibold">Add a note</summary>
              <label className="mt-4 block text-sm text-white/55">Anything we should know?<textarea className={`${input} min-h-24`} value={form.serviceNotes} onChange={(event) => set("serviceNotes", event.target.value)} placeholder="Stains, pet hair, parking notes, anything important…" /></label>
            </details>
          </div>
        </section>
      )}

      {baseTotal != null && (
        <section className="rounded-[22px] border border-white/10 bg-black/35 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/48"><span>Service</span><span>${Number(baseTotal).toFixed(2)}</span></div>
            {selectedAddOns.map((item) => <div key={item.id} className="flex justify-between text-white/42"><span>{item.name}</span><span>+${item.price.toFixed(2)}</span></div>)}
            {discountAmount > 0 && <div className="flex justify-between text-green-300"><span>Discount {appliedDiscount?.code ? `(${appliedDiscount.code})` : ""}</span><span>−${discountAmount.toFixed(2)}</span></div>}
            <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-4"><div><p className="text-[10px] uppercase tracking-[.18em] text-white/28">Total</p><p className="mt-1 text-xs text-white/32">Checked again when you submit</p></div><p className="text-3xl font-semibold">${Number(bookingTotal || 0).toFixed(2)}</p></div>
          </div>
        </section>
      )}

      <section className="space-y-3 border-t border-white/8 pt-6">
        <label className="flex items-start gap-3 text-sm leading-6 text-white/50"><input type="checkbox" checked={form.policyAgreed} onChange={(event) => set("policyAgreed", event.target.checked)} className="mt-1" /><span>I understand this is a booking request with the displayed total and Car Dash will confirm availability. I agree to the <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Terms and Conditions</a> and acknowledge the <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Privacy Policy</a>.</span></label>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><label className="flex items-start gap-3 text-sm leading-6 text-white/52"><input type="checkbox" checked={form.smsConsent} onChange={(event) => set("smsConsent", event.target.checked)} className="mt-1" /><span><strong className="font-semibold text-white/80">Yes, text me my booking confirmation and appointment updates — no spam or promotional messages.</strong> Car Dash Detailing will only text you about your quote, scheduling, appointment updates, or other messages directly related to your service. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.</span></label><p className="mt-3 pl-6 text-xs leading-5 text-white/32">See our <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Privacy Policy</a> and <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#FF2D2D]">Terms and Conditions</a>.</p></div>
      </section>

      {status !== "idle" && <div className={`rounded-2xl border p-4 text-sm ${status === "success" ? "border-green-800 bg-green-950/30 text-green-200" : "border-red-800 bg-red-950/30 text-red-200"}`}><p>{message}</p>{status === "success" && chatUrl && <a href={chatUrl} className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black">Open booking chat</a>}</div>}

      <div className="flex flex-wrap gap-3">
        <button disabled={status === "submitting" || status === "success" || quote?.status === "booked" || !form.policyAgreed || !form.preferredDate || !form.preferredTime || bookingTotal == null || !baseTotal || Boolean(setupMessage)} className="min-w-[180px] rounded-full bg-[#FF2D2D] px-6 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{status === "submitting" ? "Sending…" : status === "success" ? "Booking submitted" : bookingTotal != null ? `Book for $${bookingTotal.toFixed(2)}` : "Choose a service"}</button>
        {onClose && <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-6 py-3.5">Close</button>}
      </div>
    </form>
  );

}