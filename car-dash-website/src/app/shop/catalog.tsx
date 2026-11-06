"use client";
import { useRef, useState } from "react";
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
      <span aria-hidden>↗</span>
    </button>
  );
}
function Product({ rows }: { rows: Variant[] }) {
  const [id, select] = useState(rows[0].id);
  const v = rows.find((row) => row.id === id) ?? rows[0];
  const colors = [...new Set(rows.map((row) => row.color))];
  const variants = rows.filter((row) => row.color === v.color);
  const gallery = (v.images?.length || v.image) ? v : variants.find(row => row.images?.length || row.image);
  const photos = gallery?.images?.length ? gallery.images : gallery?.image ? [gallery.image] : [];
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
                select(
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
              onClick={() => select(row.id)}
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
        <form action={checkout}>
          <input type="hidden" name="variant" value={v.id} />
          <input type="hidden" name="reserve" value={v.stock ? "no" : "yes"} />
          <Buy stock={v.stock} />
        </form>
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
