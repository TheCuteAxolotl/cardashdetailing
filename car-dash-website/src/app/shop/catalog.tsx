"use client";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Variant } from "@/lib/shop";
import { checkout } from "./actions";
import { SizeGuide } from "./size-guide";

function Gallery({ photos, name }: { photos: string[]; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const go = (i: number) =>
    track.current?.scrollTo({
      left: i * track.current.clientWidth,
      behavior: "smooth",
    });
  if (!photos.length) return <div className="store-placeholder">Car Dash</div>;
  return (
    <section aria-label={name + " photos"}>
      <div
        className="store-track"
        ref={track}
        onScroll={(e) =>
          setActive(
            Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
            ),
          )
        }
      >
        {photos.map((url, i) => (
          <img
            key={url}
            src={url}
            alt={name + ", view " + (i + 1)}
            loading={i ? "lazy" : "eager"}
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="store-thumbs">
          {photos.map((url, i) => (
            <button
              type="button"
              aria-label={"Show photo " + (i + 1)}
              aria-pressed={i === active}
              key={url}
              onClick={() => go(i)}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
function Buy({ stock }: { stock: number }) {
  const { pending } = useFormStatus();
  return (
    <button className="store-buy" disabled={pending}>
      {pending ? "Opening checkout…" : stock ? "Buy now" : "Reserve and pay"}

    </button>
  );
}
function Product({ rows }: { rows: Variant[] }) {
  const [id, select] = useState(rows[0].id);
  const [promoCode, setPromoCode] = useState("");
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<{ code: string; label: string; savedCents: number; totalCents: number; variant: string } | null>(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [checkoutState, checkoutAction] = useActionState(checkout, { error: "" });
  const pickVariant = (next: string) => { select(next); setPreview(null); setPromoMessage(""); };
  const v = rows.find((row) => row.id === id) ?? rows[0];
  const colors = [...new Set(rows.map((row) => row.color))];
  const variants = rows.filter((row) => row.color === v.color);
  const gallery = (v.images?.length || v.image) ? v : variants.find(row => row.images?.length || row.image);
  const photos = gallery?.images?.length ? gallery.images : gallery?.image ? [gallery.image] : [];
  const applyPromo = async () => {
    if (!promoCode.trim()) { setPreview(null); setPromoMessage("Enter a promo code first."); return; }
    setApplying(true);
    setPromoMessage("");
    setPreview(null);
    try {
      const response = await fetch("/api/shop/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, variant: v.id, email }),
      });
      const result = await response.json();
      if (!response.ok || !result.valid) throw new Error(result.message || "This code cannot be used.");
      setPreview({ code: result.code, label: result.label, savedCents: result.savedCents, totalCents: result.totalCents, variant: v.id });
      setPromoMessage("Promo code applied. The discount will be reflected at checkout.");
    } catch (error) {
      setPromoMessage(error instanceof Error ? error.message : "Could not check this code.");
    } finally {
      setApplying(false);
    }
  };
  return (
    <article className="store-product">
      <Gallery
        key={JSON.stringify([v.color, photos])}
        photos={photos}
        name={v.name + " in " + v.color}
      />
      <div className="store-info">
        <h2>{v.name}</h2>
        <p className="store-price">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(v.cents / 100)}
        </p>
        <p>{v.description}</p>
        <fieldset>
          <legend>Color</legend>
          {colors.map((color) => (
            <button
              type="button"
              key={color}
              disabled={colors.length === 1}
              aria-pressed={color === v.color}
              onClick={() =>
                pickVariant(
                  (
                    rows.find(
                      (row) => row.color === color && row.size === v.size,
                    ) ?? rows.find((row) => row.color === color)!
                  ).id,
                )
              }
            >
              {color}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>Size</legend>
          {variants.map((row) => (
            <button
              type="button"
              key={row.id}
              aria-pressed={row.id === v.id}
              onClick={() => pickVariant(row.id)}
            >
              {row.size}
            </button>
          ))}
        </fieldset>
        <p className="store-stock" aria-live="polite">
          {v.stock
            ? v.stock + " left in " + v.color + " / " + v.size
            : "Out of stock. Pay now to reserve for the next restock. " + v.eta}
        </p>
        <form action={checkoutAction}>
          <div className="store-promo">
            <label htmlFor={`shop-promo-${rows[0].id}`}>Merch promo code</label>
            <div className="store-promo-row">
              <input id={`shop-promo-${rows[0].id}`} name="discountCode" value={promoCode} onChange={(event) => { setPromoCode(event.target.value.toUpperCase()); setPreview(null); setPromoMessage(""); }} placeholder="Enter code" maxLength={40} autoComplete="off" />
              <button type="button" onClick={applyPromo} disabled={applying}>{applying ? "Checking…" : "Apply"}</button>
            </div>
            <label htmlFor={`shop-email-${rows[0].id}`}>Email for promo verification (optional unless the code is one use per customer)</label>
            <input id={`shop-email-${rows[0].id}`} name="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setPreview(null); setPromoMessage(""); }} placeholder="you@example.com" autoComplete="email" />
            {promoMessage && <p role="status" className="store-promo-message">{promoMessage}</p>}
            {preview && preview.variant === v.id && <p className="store-promo-saving">You save {(preview.savedCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}. New total: {(preview.totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>}
            {checkoutState.error && <p role="alert" className="store-promo-error">{checkoutState.error}</p>}
          </div>
          <input type="hidden" name="variant" value={v.id} />
          <input type="hidden" name="reserve" value={v.stock ? "no" : "yes"} />
          <Buy stock={v.stock} />
        </form>
        <p className="store-shipping-note">At secure checkout, enter your full delivery address, apartment or unit number if applicable, email, and phone number. Car Dash arranges shipping directly to you after payment.</p>
        <details>
          <summary>Size guide</summary>
          <SizeGuide guide={v.guide} />
        </details>
      </div>
    </article>
  );
}
export default function Catalog({ rows }: { rows: Variant[] }) {
  return (
    <>
      {[...new Set(rows.map((v) => v.name))].map((name) => (
        <Product key={name} rows={rows.filter((v) => v.name === name)} />
      ))}
    </>
  );
}
