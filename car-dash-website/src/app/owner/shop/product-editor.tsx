"use client";
import { useState } from "react";
import type { Variant } from "@/lib/shop";
import Photo from "./photo";
import SaveForm from "./save-form";
import { GuideEditor } from "../../shop/size-guide";

type Result = { ok: boolean; created: boolean; message: string };
export default function ProductEditor({
  rows,
  save,
}: {
  rows: Variant[];
  save: (f: FormData) => Promise<Result>;
}) {
  const product = rows[0];
  const [selected, select] = useState(product?.color ?? "");
  const [draft, setDraft] = useState("");
  const [name, setName] = useState(product?.name ?? "");
  const variants = rows.filter((v) => v.color === selected);
  const current = variants[0];
  const gallery = variants.find((v) => v.images?.length || v.image);
  const sizes = [
    ...new Set(["S", "M", "L", "XL", "2XL", ...variants.map((v) => v.size)]),
  ];
  return (
    <div>
      <label>
        Product name
        <input
          value={name}
          readOnly={!!product}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {product && (
        <fieldset>
          <legend>Product colors</legend>
          {[...new Set(rows.map((v) => v.color))].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={selected === c}
              disabled={selected === c}
              onClick={() => select(c)}
            >
              {c}
            </button>
          ))}{" "}
          <button
            type="button"
            onClick={() => {
              setDraft("");
              select("");
            }}
          >
            + Add color
          </button>
        </fieldset>
      )}
      <SaveForm
        key={selected}
        className="grid gap-3 rounded border p-4"
        save={save}
        onSaved={() => {
          if (!selected && product) select(draft.trim());
        }}
      >
        <input type="hidden" name="template" value={product?.id ?? ""} />
        <input type="hidden" name="name" value={name} />
        {selected ? (
          <>
            <h3>{selected}</h3>
            <input type="hidden" name="color" value={selected} />
          </>
        ) : (
          <label>
            New color
            <input
              name="color"
              value={draft}
              required
              maxLength={60}
              onChange={(e) => setDraft(e.target.value)}
            />
            <input type="hidden" name="newColor" value="1" />
          </label>
        )}
        <fieldset>
          <legend>Quantity by size</legend>
          {sizes.map((size) => {
            const row = variants.find((v) => v.size === size);
            return (
              <label key={size} className="flex items-center gap-4">
                <span className="w-12">{size}</span>
                <input type="hidden" name="sizes" value={size} />
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  name={"qty:" + size}
                  defaultValue={row?.stock ?? 0}
                />
                <input
                  type="hidden"
                  name={"previous:" + size}
                  value={row ? row.id + "@" + row.stock : ""}
                />
              </label>
            );
          })}
        </fieldset>
        <label>
          Price including US shipping ($)
          <input
            name="price"
            type="number"
            min=".50"
            step=".01"
            required
            defaultValue={current ? current.cents / 100 : ""}
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            defaultValue={current?.description ?? ""}
          />
        </label>
        <label>
          Restock estimate
          <input name="eta" defaultValue={current?.eta ?? ""} />
        </label>
        <GuideEditor initial={current?.guide ?? ""} />
        <label>
          <input
            type="checkbox"
            name="published"
            defaultChecked={current?.published ?? false}
          />{" "}
          Show this color in shop
        </label>
        <Photo
          initial={gallery?.images ?? (gallery?.image ? [gallery.image] : [])}
          saveLabel={product ? "Save color" : "Create product"}
        />
      </SaveForm>
    </div>
  );
}
