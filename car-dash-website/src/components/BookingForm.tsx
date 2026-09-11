"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PRICING_PAGES, VEHICLE_LABELS, VehicleClass, parsePricingConfig } from "@/lib/pricing-config";

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
  pricingPage: "packages" | "exterior" | "interior";
  packageId: string;
  vehicleClass: VehicleClass;
  packageName: string;
  price: number;
};

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

const addOnsList = [
  "Pet Hair Removal",
  "Seat Shampoo",
  "Carpet Extraction",
  "Heavy Stain Removal",
  "Leather Protection",
  "Odor Treatment",
  "Engine Bay Cleaning",
  "Iron Decontamination",
  "Clay Bar Treatment",
  "Headlight Restoration",
];

const input = "mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#FF2D2D]/60";

function vehicleTypeToClass(value: string): VehicleClass {
  const normalized = value.toLowerCase();
  if (normalized.includes("truck") || normalized.includes("suv")) return "truckSuv";
  if (normalized.includes("coupe")) return "coupe";
  return "sedan";
}

export default function BookingForm({
  prefill,
  onClose,
}: {
  prefill?: { service?: string };
  onClose?: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    selectedPackage: prefill?.service || "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [packageSelection, setPackageSelection] = useState<PackageSelection | null>(null);
  const [setupMessage, setSetupMessage] = useState("");
  const [chatUrl, setChatUrl] = useState("");

  const set = (key: keyof FormState, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));

  const fixedServices = useMemo(
    () => services.filter((service) => service.active && service.pricingType === "fixed" && service.price > 0),
    [services]
  );

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.serviceId) || null,
    [services, form.serviceId]
  );

  const bookingTotal = packageSelection?.price ?? quote?.quotedPrice ?? selectedService?.price ?? null;
  const quoteLocked = Boolean(quote);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [servicesResponse, authResponse] = await Promise.all([
        fetch("/api/services", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      const serviceData = servicesResponse.ok ? await servicesResponse.json() : [];
      const loadedServices: Service[] = Array.isArray(serviceData) ? serviceData : [];
      if (!cancelled) setServices(loadedServices);

      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (!cancelled && authData?.user) {
          setForm((current) => ({
            ...current,
            name: authData.user.name || current.name,
            email: authData.user.email || current.email,
          }));

          const vehicleResponse = await fetch("/api/vehicles", { cache: "no-store" });
          if (vehicleResponse.ok && !cancelled) setVehicles(await vehicleResponse.json());
        }
      }

      const params = new URLSearchParams(window.location.search);
      const quoteId = params.get("quote");
      const requestedService = params.get("service") || prefill?.service || "";
      const pricingPage = params.get("pricingPage") as "packages" | "exterior" | "interior" | null;
      const packageId = params.get("packageId") || "";
      const vehicleClass = params.get("vehicleClass") as VehicleClass | null;

      if (!quoteId && pricingPage && packageId && vehicleClass && ["packages", "exterior", "interior"].includes(pricingPage) && Object.prototype.hasOwnProperty.call(VEHICLE_LABELS, vehicleClass)) {
        const contentResponse = await fetch("/api/site-content", { cache: "no-store" });
        const content = contentResponse.ok ? await contentResponse.json() : {};
        const key = pricingPage === "packages" ? "pricingPackagesConfig" : pricingPage === "exterior" ? "pricingExteriorConfig" : "pricingInteriorConfig";
        const config = parsePricingConfig(content?.[key], DEFAULT_PRICING_PAGES[pricingPage]);
        const pkg = config.packages.find((item) => item.id === packageId);
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
          }));
        }
        return;
      }

      if (requestedService && loadedServices.length) {
        const match = loadedServices.find(
          (service) => service.id === requestedService || service.title.toLowerCase() === requestedService.toLowerCase()
        );

        if (!match) return;
        if (match.pricingType !== "fixed" || match.price <= 0) {
          if (!cancelled) {
            setSetupMessage(
              `${match.title} needs an exact quote before booking. Use Chat to a Specialist, then book after accepting the final price.`
            );
          }
          return;
        }

        if (!cancelled) {
          setForm((current) => ({
            ...current,
            serviceId: match.id,
            selectedPackage: match.title,
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prefill?.service]);

  useEffect(() => {
    if (!form.preferredDate) {
      setSlots([]);
      return;
    }

    fetch(`/api/availability?date=${encodeURIComponent(form.preferredDate)}`)
      .then((response) => response.json())
      .then((data) => {
        setSlots(data.slots || []);
        set("preferredTime", "");
      })
      .catch(() => setSlots([]));
  }, [form.preferredDate]);

  const chooseVehicle = (id: string) => {
    const vehicle = vehicles.find((item) => item.id === id);
    if (!vehicle) {
      set("vehicleId", "");
      return;
    }

    if (packageSelection && vehicleTypeToClass(vehicle.vehicleType || "Sedan") !== packageSelection.vehicleClass) {
      setSetupMessage(`This saved vehicle is listed as ${vehicle.vehicleType || "Sedan"}, but the selected package price is for ${VEHICLE_LABELS[packageSelection.vehicleClass]}. Return to the pricing page and choose the matching vehicle type.`);
      return;
    }

    setSetupMessage("");
    setForm((current) => ({
      ...current,
      vehicleId: id,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehicleTrim: vehicle.trim || "",
      vehicleType: packageSelection ? VEHICLE_LABELS[packageSelection.vehicleClass] : (vehicle.vehicleType || "Sedan"),
    }));
  };

  const chooseService = (id: string) => {
    setPackageSelection(null);
    const service = fixedServices.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      serviceId: id,
      selectedPackage: service?.title || "",
    }));
    setSetupMessage("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    if (!bookingTotal || bookingTotal <= 0) {
      setStatus("error");
      setMessage("Choose a fixed-price service or book from an accepted quote so the appointment has an exact total.");
      return;
    }

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value))
      );
      body.append("displayedBookingTotal", String(bookingTotal));
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

  return (
    <form onSubmit={submit} className="space-y-5 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#FF2D2D]">
          {quoteLocked ? "Accepted quote" : packageSelection ? "Selected pricing package" : "Fixed-price booking"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Request an appointment</h2>
        <p className="mt-1 text-sm text-white/40">
          Every new booking has an exact total before it is submitted. Car Dash will confirm the requested time.
        </p>
      </div>

      {setupMessage && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[.07] p-4 text-sm text-amber-100">
          <p>{setupMessage}</p>
          <a href="/quote" className="mt-3 inline-block font-semibold text-[#FF2D2D] hover:text-[#FF2D2D]">
            Chat to a Specialist →
          </a>
        </div>
      )}

      {packageSelection && !quoteLocked && (
        <div className="rounded-3xl border border-[#FF2D2D]/25 bg-[#FF2D2D]/[.055] p-5">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FF2D2D]">Pricing page selection</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h3 className="text-xl font-semibold">{packageSelection.packageName}</h3><p className="mt-1 text-sm text-white/45">{VEHICLE_LABELS[packageSelection.vehicleClass]} · fixed total</p></div><p className="text-3xl font-semibold">${packageSelection.price.toFixed(2)}</p></div>
        </div>
      )}

      {quoteLocked ? (
        <div className="rounded-3xl border border-[#FF2D2D]/25 bg-[#FF2D2D]/[.055] p-5">
          <p className="text-xs uppercase tracking-[.22em] text-[#FF2D2D]">Locked booking total</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xl font-semibold">{form.selectedPackage}</p>
              <p className="mt-1 text-xs text-white/35">Accepted quote #{form.quoteThreadId.slice(-7)}</p>
            </div>
            <p className="text-4xl font-semibold">${bookingTotal?.toFixed(2)}</p>
          </div>
        </div>
      ) : packageSelection ? null : (
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm text-white/60">
            Fixed-price service
            <select className={input} value={form.serviceId} onChange={(event) => chooseService(event.target.value)} required>
              <option value="">Choose a service</option>
              {fixedServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title} — ${service.price.toFixed(2)}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] px-5 py-3.5 sm:min-w-44">
            <p className="text-[10px] uppercase tracking-[.18em] text-white/30">Booking total</p>
            <p className="mt-1 text-2xl font-semibold">{bookingTotal ? `$${bookingTotal.toFixed(2)}` : "—"}</p>
          </div>
        </div>
      )}

      <p className="text-xs leading-5 text-white/30">
        Services with starting, range, or quote-only pricing must receive an exact specialist quote before booking.
      </p>

      {vehicles.length > 0 && !quoteLocked && (
        <label className="block text-sm text-white/60">
          Saved vehicle
          <select className={input} value={form.vehicleId} onChange={(event) => chooseVehicle(event.target.value)}>
            <option value="">Enter vehicle manually</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-white/60">
          Name
          <input className={input} value={form.name} onChange={(event) => set("name", event.target.value)} required />
        </label>
        <label className="text-sm text-white/60">
          Phone
          <input className={input} value={form.phone} onChange={(event) => set("phone", event.target.value)} required />
        </label>
        <label className="text-sm text-white/60 sm:col-span-2">
          Email
          <input type="email" className={input} value={form.email} onChange={(event) => set("email", event.target.value)} required />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm text-white/60">
          Year
          <input className={input} value={form.vehicleYear} onChange={(event) => set("vehicleYear", event.target.value)} required />
        </label>
        <label className="text-sm text-white/60">
          Make
          <input className={input} value={form.vehicleMake} onChange={(event) => set("vehicleMake", event.target.value)} required />
        </label>
        <label className="text-sm text-white/60">
          Model
          <input className={input} value={form.vehicleModel} onChange={(event) => set("vehicleModel", event.target.value)} required />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-white/60">
          Preferred date
          <input type="date" className={input} value={form.preferredDate} onChange={(event) => set("preferredDate", event.target.value)} required />
        </label>
        <label className="text-sm text-white/60">
          Available time
          <select className={input} value={form.preferredTime} onChange={(event) => set("preferredTime", event.target.value)} required>
            <option value="">Choose a time</option>
            {slots.map((slot) => (
              <option key={slot}>{slot}</option>
            ))}
          </select>
          {form.preferredDate && slots.length === 0 && (
            <span className="mt-2 block text-xs text-[#FF2D2D]">No standard slots available. Try another date or chat with a specialist.</span>
          )}
        </label>
      </div>

      <label className="block text-sm text-white/60">
        Notes
        <textarea
          className={`${input} min-h-28`}
          value={form.serviceNotes}
          onChange={(event) => set("serviceNotes", event.target.value)}
          placeholder="Anything we should know?"
        />
      </label>

      <div>
        <p className="text-sm text-white/60">Special needs to review</p>
        <p className="mt-1 text-xs text-white/30">These do not change the displayed booking total automatically. If they change the scope, Car Dash will discuss it before work is added.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {addOnsList.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm text-white/55">
              <input
                type="checkbox"
                checked={form.addOns.includes(item)}
                onChange={() =>
                  set(
                    "addOns",
                    form.addOns.includes(item) ? form.addOns.filter((value) => value !== item) : [...form.addOns, item]
                  )
                }
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-white/55">
        <input type="checkbox" checked={form.policyAgreed} onChange={(event) => set("policyAgreed", event.target.checked)} className="mt-1" />
        <span>
          I understand this is a booking request with the displayed total and Car Dash will confirm availability. I agree to the{" "}
          <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#FF2D2D] hover:text-[#FF2D2D]">Terms and Conditions</a>{" "}
          and acknowledge the{" "}
          <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#FF2D2D] hover:text-[#FF2D2D]">Privacy Policy</a>.
        </span>
      </label>

      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
        <label className="flex items-start gap-3 text-sm text-white/60">
          <input type="checkbox" checked={form.smsConsent} onChange={(event) => set("smsConsent", event.target.checked)} className="mt-1" />
          <span>
            I agree to receive transactional and customer-care text messages from Car Dash Detailing about my quote, booking,
            appointment, and service updates. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or
            HELP for help. Consent is not a condition of purchase.
          </span>
        </label>
        <p className="mt-3 pl-6 text-xs leading-5 text-white/38">
          See our{" "}
          <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#FF2D2D] hover:text-[#FF2D2D]">Privacy Policy</a>{" "}
          and{" "}
          <a href="/terms-and-conditions" target="_blank" rel="noreferrer" className="text-[#FF2D2D] hover:text-[#FF2D2D]">Terms and Conditions</a>.
        </p>
      </div>

      {status !== "idle" && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            status === "success"
              ? "border-green-800 bg-green-950/30 text-green-200"
              : "border-red-800 bg-red-950/30 text-red-200"
          }`}
        >
          <p>{message}</p>
          {status === "success" && chatUrl && (
            <a
              href={chatUrl}
              className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/85"
            >
              Open booking chat
            </a>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          disabled={status === "submitting" || status === "success" || quote?.status === "booked" || !form.policyAgreed || !bookingTotal || bookingTotal <= 0 || Boolean(setupMessage)}
          className="rounded-full bg-[#FF2D2D] px-6 py-3 font-semibold text-[#0D0D0D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? "Sending…" : status === "success" ? "Booking submitted" : bookingTotal ? `Submit $${bookingTotal.toFixed(2)} booking` : "Choose a service"}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-6 py-3">
            Close
          </button>
        )}
      </div>
    </form>
  );
}
