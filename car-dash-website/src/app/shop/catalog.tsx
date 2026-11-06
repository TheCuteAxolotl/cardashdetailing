"use client";
import { useState } from "react";
import type { Variant } from "@/lib/shop";
import { checkout } from "./actions";
export default function Catalog({ rows }: { rows: Variant[] }) {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      {[...new Set(rows.map((v) => v.name))].map((name) => (
        <Product key={name} rows={rows.filter((v) => v.name === name)} />
      ))}
    </div>
  );
}
function Product({ rows }: { rows: Variant[] }) {
  const [id, select] = useState(rows[0].id);
  const v = rows.find((v) => v.id === id) ?? rows[0];
  return (
    <article className="space-y-4 rounded-xl border border-neutral-500/40 p-5">
      {v.image && (
        <img
          src={v.image}
          alt={v.name + " in " + v.color}
          className="max-h-96 w-full object-contain"
        />
      )}
      <h2 className="text-2xl font-bold">{v.name}</h2>
      <p>{v.description}</p>
      <strong>${(v.cents / 100).toFixed(2)}</strong>
      <label className="block">
        Color and size{" "}
        <select
          className="bg-white text-black p-2"
          value={v.id}
          onChange={(e) => select(e.target.value)}
        >
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.color} · {r.size} · {r.stock} left
            </option>
          ))}
        </select>
      </label>
      <details>
        <summary>Size guide</summary>
        <p className="whitespace-pre-line">{v.guide}</p>
      </details>
      <p>
        {v.stock
          ? v.stock + " left in " + v.color + ", " + v.size
          : "Pay now to reserve. Ships after restock. " + v.eta}
      </p>
      <form action={checkout}>
        <input type="hidden" name="variant" value={v.id} />
        <input type="hidden" name="reserve" value={v.stock ? "no" : "yes"} />
        <button className="rounded bg-amber-300 px-6 py-3 font-bold text-black">
          {v.stock ? "Buy now" : "Reserve and pay"}
        </button>
      </form>
    </article>
  );
}
