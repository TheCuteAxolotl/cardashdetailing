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
import { DEFAULT_PROMOTIONS, matchingPromotion, parsePromotions, promotionalPrice, type PromotionSettings } from "@/lib/promotions";
import type { SiteContent } from "@/lib/site-defaults";
import BookingDatePicker from "@/components/BookingDatePicker";
import BookingServiceCatalog from "@/components/BookingServiceCatalog";
import { recommendedServiceMinutes, totalBookingMinutes } from "@/lib/booking-duration";


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
  messages?: { sender: string; body: string }[];
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
  serviceMethod: "mobile",
  vehicleType: "Sedan",
  serviceAddress: "",
  interiorCondition: "Light",
  exteriorCondition: "Light",
  addOns: [],
  smsConsent: false,
  policyAgreed: false,
};

const input = "customer-input mt-2 w-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#C0AB9A]/55";

function vehicleTypeToClass(value: string): VehicleClass {
  const normalized = value.toLowerCase();
  if (normalized.includes("truck")) return "truckSuv";
  if (normalized.includes("suv") || normalized.includes("crv") || normalized.includes("crossover")) return "sedan";
  return "coupe";
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

export default function BookingForm({ prefill, onClose, initialSiteContent, bookingSearch }: { prefill?: { service?: string }; onClose?: () => void; initialSiteContent?: SiteContent; bookingSearch?: string }) {
  const [form, setForm] = useState<FormState>({ ...initialState, selectedPackage: prefill?.service || "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [pastSlots, setPastSlots] = useState<string[]>([]);
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
  const [promotions, setPromotions] = useState<PromotionSettings>(DEFAULT_PROMOTIONS);
  const [bookingPhotos, setBookingPhotos] = useState<string[]>([]);
  const [photoMessage, setPhotoMessage] = useState("");
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [category, setCategory] = useState<PricingKind | "other">("packages");
  const [stepMessage, setStepMessage] = useState("");

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
  const saleCategory=packageSelection?.pricingPage || (isStandaloneHeadlight ? "service" : String(selectedService?.category || "service"));
  const saleId=packageSelection?.packageId || (isStandaloneHeadlight ? STANDALONE_HEADLIGHT_SERVICE_ID : selectedService?.id || "");
  const autoSale=quoteLocked || !saleId ? null : matchingPromotion(promotions,saleCategory,saleId,packageSelection?"package":"service");
  const saleBase=baseTotal==null?null:promotionalPrice(baseTotal,autoSale);
  const discountedAddOns=selectedAddOns.map(item=>({...item, salePrice:promotionalPrice(item.price,matchingPromotion(promotions,"addon",item.id,"addon"))}));
  const saleAddOnTotal=discountedAddOns.reduce((sum,item)=>sum+item.salePrice,0);
  const subtotal = baseTotal == null ? null : Math.max(0, (saleBase ?? baseTotal) + saleAddOnTotal);
  const durationTarget = packageSelection
    ? `package:${packageSelection.pricingPage}:${packageSelection.packageId}:${packageSelection.vehicleClass}`
    : isStandaloneHeadlight ? `service:${STANDALONE_HEADLIGHT_SERVICE_ID}` : selectedService ? `service:${selectedService.id}` : null;
  const durationServiceName = packageSelection?.packageName || quote?.subject || selectedService?.title || (isStandaloneHeadlight ? "Headlight Restoration" : "Detail");
  const baseMinutes = durationTarget ? bookingPricing.serviceDurations[durationTarget] ?? recommendedServiceMinutes(durationTarget, durationServiceName) : recommendedServiceMinutes(null, durationServiceName);
  const estimatedDuration = totalBookingMinutes(durationServiceName, selectedAddOns, baseMinutes);
  const needsOdorQuote = selectedAddOns.some((item) => item.quoteRequired);
  const hasAutomaticSale = (saleBase != null && baseTotal != null && saleBase < baseTotal) || saleAddOnTotal < addOnTotal;
  const discountAmount = subtotal == null || hasAutomaticSale ? 0 : calculateDiscount(subtotal, appliedDiscount, baseTotal ?? subtotal);
  const bookingTotal = subtotal == null ? null : Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  useEffect(() => {
    if (hasAutomaticSale && appliedDiscount) {
      setAppliedDiscount(null);
      setDiscountMessage("The automatic sale replaced the coupon; promotions cannot be stacked.");
    }
  }, [hasAutomaticSale, appliedDiscount]);

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
        setSetupMessage(`${service.title} needs an exact quote before booking. Use Get a Quote and then book after accepting the final price.`);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const contentRequest = initialSiteContent
        ? Promise.resolve(null)
        : fetch("/api/site-content", { cache: "no-store" });
      const [servicesResponse, authResponse, contentResponse, promoResponse] = await Promise.all([
        fetch("/api/services", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
        contentRequest,
        fetch("/api/promotions", { cache: "no-store" }),
      ]);

      if(!cancelled && promoResponse.ok) setPromotions(parsePromotions(JSON.stringify(await promoResponse.json())));
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

      const params = new URLSearchParams(bookingSearch ?? window.location.search);
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
            serviceAddress: current.serviceAddress || quoteData.messages?.find((message) => message.sender === "system" && message.body.startsWith("Service address: "))?.body.slice("Service address: ".length) || "",
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
          if (match.pricingType !== "fixed" || match.price <= 0) setSetupMessage(`${match.title} needs an exact quote before booking. Use Get a Quote, then book after accepting the final price.`);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [prefill?.service, initialSiteContent]);

  useEffect(() => {
    if (!form.preferredDate) { setSlots([]); setPastSlots([]); return; }
    fetch(`/api/availability?date=${encodeURIComponent(form.preferredDate)}&duration=${estimatedDuration}`)
      .then((response) => response.json())
      .then((data) => { setSlots(data.slots || []); setPastSlots(data.pastSlots || []); set("preferredTime", ""); })
      .catch(() => { setSlots([]); setPastSlots([]); });
  }, [form.preferredDate, estimatedDuration]);

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
    const current = form.addOns;
    if (current.includes(id)) { set("addOns", current.filter((value) => value !== id)); return; }
    const odorIds = ["odor-treatment", "odor-smoke", "odor-severe"];
    set("addOns", odorIds.includes(id) ? [...current.filter((value) => !odorIds.includes(value)), id] : [...current, id]);
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
    if (hasAutomaticSale) { setDiscountMessage("An automatic sale is already applied. Coupon codes cannot be combined."); return; }
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
    if (step !== 3 || status === "submitting" || status === "success") return;
    setStatus("submitting");
    setMessage("");
    if (!form.serviceAddress.trim()) {
      setStatus("error");
      setMessage("Enter the full address where we should detail your vehicle.");
      return;
    }
    if (needsOdorQuote) { setStatus("error"); setMessage("Severe odor restoration needs a custom inspection and quote before booking."); return; }
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

  const stageNames = ["Service", "Date & time", "Your details", "Review"] as const;
  const selectedName = packageSelection?.packageName || (quoteLocked ? form.selectedPackage : selectedService?.title || (isStandaloneHeadlight ? "Headlight Restoration" : ""));
  const selectedVehicleSize = packageSelection ? VEHICLE_LABELS[packageSelection.vehicleClass] : form.vehicleType;
  const serviceReady = Boolean(baseTotal != null && baseTotal > 0 && selectedName && !setupMessage && !needsOdorQuote);
  const scheduleReady = Boolean(form.preferredDate && form.preferredTime && slots.includes(form.preferredTime));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const detailsReady = Boolean(
    form.name.trim() && form.phone.trim() && emailValid && form.serviceAddress.trim() &&
    form.vehicleYear.trim() && form.vehicleMake.trim() && form.vehicleModel.trim()
  );
  const advance = () => {
    setStepMessage("");
    if (step === 0 && !serviceReady) { setStepMessage("Choose a fixed-price detail or an accepted quote first."); return; }
    if (step === 1 && !scheduleReady) { setStepMessage("Choose an available date and start time."); return; }
    if (step === 2 && !detailsReady) { setStepMessage("Fill in your name, phone, valid email, service address, and vehicle details."); return; }
    setStep(current => Math.min(3, current + 1) as 0 | 1 | 2 | 3);
    window.requestAnimationFrame(() => document.getElementById("car-dash-booking-scroll")?.scrollTo({top:0,behavior:"smooth"}));
  };
  const previous = () => {
    setStep(current => Math.max(0, current - 1) as 0 | 1 | 2 | 3);
    setStepMessage("");
    window.requestAnimationFrame(() => document.getElementById("car-dash-booking-scroll")?.scrollTo({top:0,behavior:"smooth"}));
  };
  useEffect(() => {
    if (packageSelection) setCategory(packageSelection.pricingPage);
  }, [packageSelection?.pricingPage]);



  return (
    <form onSubmit={submit} className="luxury-booking-form car-dash-booking-app space-y-5 text-[#f4efe5]">
      {status === "success" ? (
        <section role="status" aria-live="polite" className="mx-auto max-w-xl py-6 text-center sm:py-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#d6b779]/40 bg-[#d6b779]/10 text-[#e5c995]">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m5 12 5 5L20 7"/></svg>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-[#d6b779]">Booking request received</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your detail is on its way.</h2>
          <p className="mt-3 text-sm leading-6 text-[#c5beb4]">{message}</p>
          <div className="mt-6 rounded-2xl border border-white/15 bg-[#232323] p-5 text-left">
            <p className="font-semibold">{selectedName}</p>
            <p className="mt-2 text-sm text-[#bcb5aa]">{form.preferredDate} · {form.preferredTime}</p>
            <p className="mt-2 text-sm text-[#bcb5aa]">{form.serviceAddress}</p>
            <p className="mt-4 text-2xl font-semibold text-[#e5c995]">{"$" + Number(bookingTotal || 0).toFixed(2)}</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#a8a095]">Car Dash will review your request and confirm the appointment details.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {chatUrl && <a href={chatUrl} className="rounded-xl bg-[#d6b779] px-5 py-3 text-sm font-bold text-[#161616]">Open booking chat</a>}
            {onClose && <button type="button" onClick={onClose} className="rounded-xl border border-white/20 px-5 py-3 text-sm">Close</button>}
          </div>
        </section>
      ) : (
        <>
          <header className="border-b border-white/10 pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#d6b779]">Car Dash · Online booking</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{stageNames[step]}</h2>
                <p className="mt-1.5 text-xs text-[#aaa399]">Step {step + 1} of 4 · Mobile detailing at your location</p>
              </div>
              <div className="rounded-xl border border-[#d6b779]/25 bg-[#d6b779]/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-[#bdb3a0]">Est. total</p>
                <p className="text-xl font-semibold tabular-nums text-[#ead5a8]">{bookingTotal != null ? "$" + bookingTotal.toFixed(2) : "—"}</p>
              </div>
            </div>
            <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Booking progress">
              {stageNames.map((title, index) => (
                <li key={title} className="min-w-0"><div className={"h-1 rounded-full " + (index <= step ? "bg-[#d6b779]" : "bg-white/10")} />
                  <span className={"mt-2 block truncate text-[10px] font-semibold " + (index === step ? "text-[#f4efe5]" : "text-[#928b80]")}>{title}</span></li>
              ))}
            </ol>
          </header>
          {setupMessage && <div role="alert" className="rounded-xl border border-amber-300/30 bg-amber-900/20 p-4 text-sm text-amber-100">{setupMessage} <a href="/quote" className="font-semibold text-[#e5c995] underline">Get a quote</a></div>}
          {step === 0 && <div className="space-y-6">
            {!quoteLocked && <BookingServiceCatalog
              category={category}
              onCategoryChange={setCategory}
              configs={pricingConfigs}
              vehicleClass={vehicleTypeToClass(form.vehicleType)}
              selected={serviceChoiceValue}
              onSelect={chooseBookingOption}
              otherServices={databaseServices}
              standaloneId={STANDALONE_HEADLIGHT_SERVICE_ID}
              headlightPrice={bookingPricing.headlightStandalonePrice}
            />}
      <section>
        <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-semibold text-white">1</span><div><h3 className="font-semibold">Service</h3><p className="text-xs text-white/35">Choose a service, then choose your vehicle size.</p></div></div>

        {quoteLocked ? (
          <div className="rounded-2xl border border-[#d6b779]/25 bg-[#d6b779]/[.055] p-4">
            <p className="text-xs uppercase tracking-[.18em] text-[#d6b779]">Accepted quote</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><p className="text-lg font-semibold">{form.selectedPackage}</p><p className="mt-1 text-xs text-white/35">Quote #{form.quoteThreadId.slice(-7)}</p></div><p className="text-2xl font-semibold">${Number(baseTotal || 0).toFixed(2)}</p></div>
          </div>
        ) : (
          <details className="mt-4 rounded-xl border border-white/10 bg-[#232323] p-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#e5c995]">Or browse services in a list</summary>
            <label className="mt-3 block text-sm text-white/55">
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
          </details>
        )}

        {packageSelection && !quoteLocked && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{packageSelection.packageName}</p><p className="mt-1 text-xs text-white/35">Choose vehicle size</p></div><p className="text-2xl font-semibold">${packageSelection.price.toFixed(0)}</p></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">{(Object.keys(VEHICLE_LABELS) as VehicleClass[]).map((key) => <button key={key} type="button" onClick={() => changePackageVehicleClass(key)} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${packageSelection.vehicleClass === key ? "border-[#d6b779]/55 bg-[#d6b779]/10 text-white" : "border-white/10 bg-[#07131B]/20 text-white/45"}`}>{VEHICLE_LABELS[key]} · ${Number(pricingConfigs[packageSelection.pricingPage].packages.find((item) => item.id === packageSelection.packageId)?.prices?.[key] || 0).toFixed(0)}</button>)}</div>
          </div>
        )}
      </section>

      {(allowCarAddOns || baseTotal != null) && (
        <section className="border-t border-white/8 pt-6">
          <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-semibold text-white">4</span><div><h3 className="font-semibold">Optional</h3><p className="text-xs text-white/35">Personalize your detail with add-ons, photos or a discount code.</p></div></div>

          <div className="space-y-3">
            {allowCarAddOns && (
              <details className="booking-option-panel border border-white/10 bg-white/[.02] p-4">
                <summary className="cursor-pointer text-sm font-semibold">Add-ons <span className="ml-2 text-xs font-normal text-white/35">Pet hair, shampoo, wax, engine bay, etc.</span></summary>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{activeAddOns.map((item) => <label key={item.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm ${form.addOns.includes(item.id) ? "border-[#d6b779]/35 bg-[#d6b779]/8 text-white" : "border-white/10 bg-[#07131B]/20 text-white/52"}`}><span className="flex items-center gap-3"><input type="checkbox" checked={form.addOns.includes(item.id)} onChange={() => toggleAddOn(item.id)} /><span>{item.name}{item.quoteRequired ? <span className="mt-1 block text-[10px] text-amber-200">Inspection and custom quote required</span> : null}{item.durationMinutes ? <span className="mt-0.5 block text-[10px] text-white/30">Approx. {item.durationMinutes} min</span> : null}</span></span><strong className="text-white">+${item.price.toFixed(0)}{item.quoteRequired ? "+" : ""}</strong></label>)}</div>
              </details>
            )}

            {baseTotal != null && (
              <details className="booking-option-panel border border-white/10 bg-white/[.02] p-4">
                <summary className="cursor-pointer text-sm font-semibold">Have a discount code?</summary>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm text-white/55">Discount code<input className={`${input} uppercase`} value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} placeholder="Enter code" /></label><button type="button" onClick={applyDiscount} disabled={discountLoading} className="rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold disabled:opacity-50">{discountLoading ? "Checking…" : "Apply"}</button>{appliedDiscount && <button type="button" onClick={() => { setAppliedDiscount(null); setDiscountInput(""); setDiscountMessage(""); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/50">Remove</button>}</div>
                {discountMessage && <p className={`mt-2 text-xs ${appliedDiscount ? "text-green-300" : "text-red-300"}`}>{discountMessage}</p>}
              </details>
            )}

            <details className="booking-option-panel border border-white/10 bg-white/[.02] p-4">
              <summary className="cursor-pointer text-sm font-semibold">Attach photos <span className="ml-2 text-xs font-normal text-white/35">Optional · up to 3</span></summary>
              <div className="mt-4">
                <p className="text-xs leading-5 text-white/40">Show us stains, pet hair, paint condition, scratches, or anything you want us to see before the appointment.</p>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple onChange={chooseBookingPhotos} className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/60" />
                {photoMessage && <p className="mt-2 text-xs text-white/45">{photoMessage}</p>}
                {bookingPhotos.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{bookingPhotos.map((src, index) => <img key={index} src={src} alt={`Vehicle upload ${index + 1}`} className="h-24 w-full rounded-xl object-cover" />)}</div>}
              </div>
            </details>

            <details className="booking-option-panel border border-white/10 bg-white/[.02] p-4">
              <summary className="cursor-pointer text-sm font-semibold">Add a note</summary>
              <label className="mt-4 block text-sm text-white/55">Anything we should know?<textarea className={`${input} min-h-24`} value={form.serviceNotes} onChange={(event) => set("serviceNotes", event.target.value)} placeholder="Stains, pet hair, parking notes, anything important…" /></label>
            </details>
          </div>
        </section>
      )}


          </div>}
          {step === 1 && <div className="space-y-6">
      <section className="border-t border-white/8 pt-6">
        <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-semibold text-white">3</span><div><h3 className="font-semibold">Date + time</h3><p className="text-xs text-white/35">Unavailable dates and times are disabled.</p></div></div>
        <p className="mb-3 text-sm text-white/60">Estimated appointment: {Math.floor(estimatedDuration/60)}h {estimatedDuration%60 ? `${estimatedDuration%60}m` : ""}. Available start times automatically account for this.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="text-sm text-white/55"><p>Day</p><BookingDatePicker duration={estimatedDuration} value={form.preferredDate} onChange={(value) => { set("preferredDate", value); set("preferredTime", ""); }} /></div>
          <label className="text-sm text-white/55">Time<select className={input} value={form.preferredTime} onChange={(event) => set("preferredTime", event.target.value)} required><option value="">Choose a time</option>{[...slots.map(slot=>({slot,disabled:false})),...pastSlots.map(slot=>({slot,disabled:true}))].sort((a,b)=>a.slot.localeCompare(b.slot)).map(({slot,disabled}) => <option key={slot} disabled={disabled} value={slot}>{slot}{disabled ? " — past" : ""}</option>)}</select>{form.preferredDate && slots.length === 0 && <span className="mt-2 block text-xs text-[#d6b779]">No times left on this day. Choose another date.</span>}</label>
        </div>
      </section>


          </div>}
          {step === 2 && <div className="space-y-6">
      <section className="border-t border-white/8 pt-6">
        <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-semibold text-white">2</span><div><h3 className="font-semibold">Your car + contact</h3><p className="text-xs text-white/35">Tell us about your car and where to meet you.</p></div></div>

        {vehicles.length > 0 && !quoteLocked && <label className="mb-4 block text-sm text-white/55">Saved vehicle<select className={input} value={form.vehicleId} onChange={(event) => chooseVehicle(event.target.value)}><option value="">Enter vehicle manually</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</option>)}</select></label>}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-white/55">Name<input className={input} value={form.name} onChange={(event) => set("name", event.target.value)} required /></label>
          <label className="text-sm text-white/55">Phone<input className={input} value={form.phone} onChange={(event) => set("phone", event.target.value)} required /></label>
          <label className="text-sm text-white/55 sm:col-span-2">Email<input type="email" className={input} value={form.email} onChange={(event) => set("email", event.target.value)} required /></label>
        </div>

        <label className="mt-4 block text-sm text-white/55">
          Service address (required)
          <input name="serviceAddress" autoComplete="street-address" className={input} value={form.serviceAddress} onChange={(event) => set("serviceAddress", event.target.value)} placeholder="Street address, unit, city, state, ZIP code" aria-describedby="service-address-help" required />
          <span id="service-address-help" className="mt-2 block text-xs text-white/45">We come to you. Enter the full address where your vehicle will be detailed.</span>
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-white/55">Year<input className={input} value={form.vehicleYear} onChange={(event) => set("vehicleYear", event.target.value)} required /></label>
          <label className="text-sm text-white/55">Make<input className={input} value={form.vehicleMake} onChange={(event) => set("vehicleMake", event.target.value)} required /></label>
          <label className="text-sm text-white/55">Model<input className={input} value={form.vehicleModel} onChange={(event) => set("vehicleModel", event.target.value)} required /></label>
        </div>
      </section>


          </div>}
          {step === 3 && <div className="space-y-6">
            <section className="rounded-2xl border border-[#d6b779]/25 bg-[#28251f] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#d6b779]">Please review your request</p>
              <h3 className="mt-3 text-xl font-semibold">{selectedName}</h3>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-[#aaa399]">Vehicle</dt><dd className="mt-1">{[form.vehicleYear,form.vehicleMake,form.vehicleModel].filter(Boolean).join(" ")} · {selectedVehicleSize}</dd></div>
                <div><dt className="text-xs text-[#aaa399]">Time</dt><dd className="mt-1">{form.preferredDate} at {form.preferredTime}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-[#aaa399]">Service address</dt><dd className="mt-1">{form.serviceAddress}</dd></div>
                <div><dt className="text-xs text-[#aaa399]">Customer</dt><dd className="mt-1">{form.name}</dd></div>
                <div><dt className="text-xs text-[#aaa399]">Est. duration</dt><dd className="mt-1">{Math.floor(estimatedDuration / 60)} hr {estimatedDuration % 60 ? estimatedDuration % 60 + " min" : ""}</dd></div>
              </dl>
              <button type="button" onClick={() => setStep(2)} className="mt-4 text-xs font-semibold text-[#e5c995] underline">Edit your details</button>
            </section>
      {baseTotal != null && (
        <section className="booking-total-panel border border-white/10 bg-black/20 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/48"><span>Service</span><span>{saleBase != null && saleBase < Number(baseTotal) ? <><s className="mr-2 text-white/30">${Number(baseTotal).toFixed(2)}</s><strong className="text-red-300">${saleBase.toFixed(2)}</strong></> : `${Number(baseTotal).toFixed(2)}`}</span></div>
            {discountedAddOns.map((item) => <div key={item.id} className="flex justify-between text-white/42"><span>{item.name}</span><span>{item.salePrice < item.price && <s className="mr-2 text-white/30">${item.price.toFixed(2)}</s>}+${item.salePrice.toFixed(2)}</span></div>)}
            {hasAutomaticSale && <div className="flex justify-between text-red-300"><span>You save with this promotion</span><span>${(Number(baseTotal) + addOnTotal - Number(subtotal)).toFixed(2)}</span></div>}
            {discountAmount > 0 && <div className="flex justify-between text-green-300"><span>Discount {appliedDiscount?.code ? `(${appliedDiscount.code})` : ""}</span><span>−${discountAmount.toFixed(2)}</span></div>}
            <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-4"><div><p className="text-[10px] uppercase tracking-[.18em] text-white/28">Total</p><p className="mt-1 text-xs text-white/32">We’ll double-check this when you submit</p></div><p className="text-3xl font-semibold">${Number(bookingTotal || 0).toFixed(2)}</p></div>
          </div>
        </section>
      )}

      <section className="space-y-3 border-t border-white/8 pt-6">
        <label className="flex items-start gap-3 text-sm leading-6 text-white/50"><input type="checkbox" checked={form.policyAgreed} onChange={(event) => set("policyAgreed", event.target.checked)} className="mt-1" /><span>I understand this is a booking request at the total shown, and Car Dash will confirm availability. I agree to the <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#d6b779]">Terms and Conditions</a> and acknowledge the <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#d6b779]">Privacy Policy</a>.</span></label>

        {needsOdorQuote && <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">Severe odor restoration starts at $199 and requires an inspection and custom price before scheduling. <a href="/quote" className="font-semibold underline">Request a quote</a>.</div>}
        <div className="booking-option-panel border border-white/10 bg-white/[.02] p-4"><label className="flex items-start gap-3 text-sm leading-6 text-white/52"><input type="checkbox" checked={form.smsConsent} onChange={(event) => set("smsConsent", event.target.checked)} className="mt-1" /><span><strong className="font-semibold text-white/80">Yes, text me my booking confirmation and appointment updates — no spam or promotional messages.</strong> Car Dash Detailing will only text you about your quote, scheduling, appointment updates, or other messages directly related to your service. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.</span></label><p className="mt-3 pl-6 text-xs leading-5 text-white/32">See our <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#d6b779]">Privacy Policy</a> and <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#d6b779]">Terms and Conditions</a>.</p></div>
      </section>


          </div>}
          {stepMessage && <p role="alert" className="rounded-xl border border-amber-300/30 bg-amber-900/20 p-3 text-sm text-amber-100">{stepMessage}</p>}
          {status === "error" && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-900/20 p-4 text-sm text-red-100">{message}</p>}
          <nav aria-label="Booking step navigation" className="sticky bottom-0 z-20 -mx-4 mt-6 flex items-center gap-3 border-t border-white/15 bg-[#161616]/95 px-4 py-4 shadow-[0_-12px_35px_#101010cc] backdrop-blur-xl sm:-mx-8 sm:px-8">
            {step > 0 && <button type="button" onClick={previous} disabled={status === "submitting"} className="rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold">Back</button>}
            {step < 3 ? (
              <button type="button" onClick={advance} disabled={status === "submitting" || (step === 0 && !serviceReady) || (step === 1 && !scheduleReady) || (step === 2 && !detailsReady)}
                className="ml-auto flex-1 rounded-xl bg-[#d6b779] px-5 py-3.5 text-sm font-bold text-[#171717] hover:bg-[#e8cf9e] disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-[245px]">
                {step === 0 ? "Choose a time" : step === 1 ? "Enter your details" : "Review appointment"}
              </button>
            ) : (
              <button type="submit" disabled={status === "submitting" || !form.policyAgreed || !serviceReady || !scheduleReady || !detailsReady}
                className="ml-auto flex-1 rounded-xl bg-[#d6b779] px-5 py-3.5 text-sm font-bold text-[#171717] hover:bg-[#e8cf9e] disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-[245px]">
                {status === "submitting" ? "Submitting…" : "Request detail · $" + Number(bookingTotal || 0).toFixed(2)}
              </button>
            )}
          </nav>
        </>
      )}
    </form>
  );
}
