"use client";

import NumberInput from "@/components/NumberInput";
import { AddOnCards, ConditionTags } from "@/components/BookingExtras";
import { VEHICLE_LABELS, type VehicleClass } from "@/lib/pricing-config";
import {
  CUSTOM_SERVICE_KEY,
  KEEP_SERVICE_KEY,
  VEHICLE_CLASSES,
  catalogAddOns,
  catalogServices,
  resolveOwnerPricing,
  type CatalogSource,
} from "@/lib/booking-catalog";

export type ServicePricingValue = {
  vehicleClass: VehicleClass;
  serviceKey: string;
  customServiceName: string;
  pricingMode: "listed" | "custom";
  customPrice: string;
  addOnIds: string[];
  conditionTags: string[];
  /** Used only when keeping a booking request's original service. */
  serviceName: string;
  quotedPrice: string;
};

const input = "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#6EAEC6]/60";
const money = (value: number) => `$${value.toFixed(2)}`;

/**
 * Service, add-ons and price for an owner-entered booking. The owner picks a
 * service from the current price list (or types a custom one), ticks add-ons,
 * and chooses the listed price or a custom price. The total updates live and
 * the server recomputes it from the same saved menu.
 */
export default function OwnerServicePricing({ value, onChange, source, loading, allowKeep }: {
  value: ServicePricingValue;
  onChange: (patch: Partial<ServicePricingValue>) => void;
  source: CatalogSource | null;
  loading: boolean;
  allowKeep: boolean;
}) {
  const services = source ? catalogServices(source, value.vehicleClass) : [];
  const addOns = source ? catalogAddOns(source) : [];
  const groups = [...new Set(services.map((item) => item.group))];
  const keeping = value.serviceKey === KEEP_SERVICE_KEY;
  const custom = value.serviceKey === CUSTOM_SERVICE_KEY;
  const selected = services.find((item) => item.key === value.serviceKey) || null;
  const preview = source && !keeping && value.serviceKey ? resolveOwnerPricing(value, source) : null;
  const listPrice = (addOn: { price: number }) => ({ price: addOn.price, sale: addOn.price });
  const toggleAddOn = (id: string) =>
    onChange({ addOnIds: value.addOnIds.includes(id) ? value.addOnIds.filter((item) => item !== id) : [...value.addOnIds, id] });

  return (
    <fieldset className="rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
      <legend className="px-1 text-sm font-semibold text-white">Service and price</legend>

      <div className="mt-1">
        <p className="text-xs text-white/55" id="vehicle-size-label">Vehicle size</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="vehicle-size-label">
          {VEHICLE_CLASSES.map((vehicleClass) => (
            <button
              key={vehicleClass}
              type="button"
              aria-pressed={value.vehicleClass === vehicleClass}
              onClick={() => onChange({ vehicleClass })}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${value.vehicleClass === vehicleClass ? "border-[#6EAEC6] bg-[#6EAEC6] text-[#0B1822]" : "border-white/15 text-white/70 hover:border-white/35"}`}
            >
              {VEHICLE_LABELS[vehicleClass]}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block text-sm text-white/55">Service
        <select
          className={`${input} mt-2`}
          value={value.serviceKey}
          onChange={(event) => onChange({ serviceKey: event.target.value, pricingMode: event.target.value === CUSTOM_SERVICE_KEY ? "custom" : value.pricingMode })}
          required
        >
          {allowKeep && <option value={KEEP_SERVICE_KEY}>Keep requested: {value.serviceName}{value.quotedPrice ? ` (${money(Number(value.quotedPrice))})` : ""}</option>}
          {!allowKeep && <option value="">{loading ? "Loading price list…" : "Choose a service"}</option>}
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {services.filter((item) => item.group === group).map((item) => (
                <option key={item.key} value={item.key}>{item.label} · {money(item.price)}</option>
              ))}
            </optgroup>
          ))}
          <option value={CUSTOM_SERVICE_KEY}>Other service (type a name)</option>
        </select>
      </label>

      {custom && (
        <label className="mt-3 block text-sm text-white/55">Custom service name
          <input className={`${input} mt-2`} value={value.customServiceName} maxLength={160} onChange={(event) => onChange({ customServiceName: event.target.value })} placeholder="Ceramic coating, boat detail, paint correction…" required />
        </label>
      )}

      {keeping ? (
        <label className="mt-3 block text-sm text-white/55">Price
          <NumberInput type="number" min="0" step="0.01" className={`${input} mt-2`} value={value.quotedPrice} onChange={(event) => onChange({ quotedPrice: event.target.value })} />
          <span className="mt-1 block text-xs text-white/40">To change the service or add-ons, pick a service from the list above.</span>
        </label>
      ) : (
        <>
          <div className="mt-4">
            <p className="text-xs text-white/55" id="price-mode-label">Price</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="price-mode-label">
              <label className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm ${!custom && value.pricingMode === "listed" ? "border-[#6EAEC6]/60 bg-[#6EAEC6]/10 text-white" : "border-white/10 text-white/65"} ${custom ? "opacity-40" : "cursor-pointer"}`}>
                <input type="radio" name="pricing-mode" className="h-4 w-4 accent-[#6EAEC6]" disabled={custom} checked={!custom && value.pricingMode === "listed"} onChange={() => onChange({ pricingMode: "listed" })} />
                <span>Use service price{selected ? <strong className="ml-1 text-white">{money(selected.price)}</strong> : ""}</span>
              </label>
              <label className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${custom || value.pricingMode === "custom" ? "border-[#6EAEC6]/60 bg-[#6EAEC6]/10 text-white" : "border-white/10 text-white/65"}`}>
                <input type="radio" name="pricing-mode" className="h-4 w-4 accent-[#6EAEC6]" checked={custom || value.pricingMode === "custom"} onChange={() => onChange({ pricingMode: "custom" })} />
                <span>Custom price</span>
              </label>
            </div>
            {(custom || value.pricingMode === "custom") && (
              <label className="mt-3 block text-sm text-white/55">Custom service price
                <NumberInput type="number" min="0" step="0.01" className={`${input} mt-2`} value={value.customPrice} onChange={(event) => onChange({ customPrice: event.target.value })} placeholder="0.00" />
                <span className="mt-1 block text-xs text-white/40">Add-ons below are added on top. Leave blank if the price isn't set yet.</span>
              </label>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs text-white/55">Add-ons</p>
            {addOns.length === 0 ? (
              <p className="mt-2 text-xs text-white/40">{loading ? "Loading add-ons…" : "No active add-ons. Add them in Booking settings."}</p>
            ) : (
              <div className="mt-2"><AddOnCards addOns={addOns} selected={value.addOnIds} onToggle={toggleAddOn} priceFor={listPrice} /></div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm" aria-live="polite">
            {!preview ? (
              <p className="text-white/45">Choose a service to see the total.</p>
            ) : !preview.ok ? (
              <p className="text-amber-200">{preview.error}</p>
            ) : (
              <>
                <div className="flex justify-between gap-3 text-white/70"><span>{preview.serviceName}</span><span className="whitespace-nowrap">{preview.servicePrice === null ? "No price yet" : money(preview.servicePrice)}</span></div>
                {preview.addOns.map((addOn) => <div key={addOn.id} className="mt-1 flex justify-between gap-3 text-white/55"><span>{addOn.name}</span><span className="whitespace-nowrap">+{money(addOn.price)}</span></div>)}
                <div className="mt-2 flex justify-between gap-3 border-t border-white/10 pt-2 font-semibold text-white"><span>Booking total</span><span className="whitespace-nowrap text-emerald-300">{preview.quotedPrice === null ? "Set a price" : money(preview.quotedPrice)}</span></div>
              </>
            )}
          </div>
        </>
      )}

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-sm font-semibold text-white">Anything else to know?</p>
        <p className="mb-3 mt-0.5 text-xs text-white/45">Vehicle condition for whoever does the job. Doesn&apos;t change the price.</p>
        <ConditionTags
          value={value.conditionTags}
          onChange={(conditionTags) => onChange({ conditionTags })}
          addOns={addOns}
          selectedAddOns={value.addOnIds}
          onAddAddOn={keeping ? null : (id) => { if (!value.addOnIds.includes(id)) toggleAddOn(id); }}
          priceFor={listPrice}
        />
      </div>
    </fieldset>
  );
}
