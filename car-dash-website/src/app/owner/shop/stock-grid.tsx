"use client";
import { useState } from "react";
import type { Variant } from "@/lib/shop";

export function ColorChoice({
  colors,
  initial,
  onColor,
}: {
  colors: string[];
  initial: string;
  onColor?: (color: string) => void;
}) {
  const [options, setOptions] = useState(colors);
  const [color, setColor] = useState(initial);
  const [adding, add] = useState(!colors.length);
  const [draft, type] = useState("");
  function choose(value: string) {
    setColor(value);
    onColor?.(value);
  }
  return (
    <fieldset>
      <legend>Color</legend>
      <input type="hidden" name="color" value={adding ? draft.trim() : color} />
      <select
        aria-label="Color"
        disabled={options.length < 2}
        value={color}
        onChange={(e) => choose(e.target.value)}
      >
        {options.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      {adding ? (
        <label>
          New color
          <input
            value={draft}
            onChange={(e) => {
              type(e.target.value);
              onColor?.(e.target.value.trim());
            }}
            maxLength={60}
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => {
              const value =
                options.find(
                  (c) => c.toLowerCase() === draft.trim().toLowerCase(),
                ) ?? draft.trim();
              setOptions([...new Set([...options, value])]);
              choose(value);
              add(false);
              type("");
            }}
          >
            Use color
          </button>
        </label>
      ) : (
        <button
          type="button"
          onClick={() => {
            add(true);
            onColor?.("");
          }}
        >
          Create color
        </button>
      )}
    </fieldset>
  );
}
export function StockGrid({
  rows,
  colors,
}: {
  rows: Variant[];
  colors: string[];
}) {
  const initial = rows[0]?.color ?? colors[0] ?? "";
  const [color, select] = useState(initial);
  const sizes = [
    ...new Set([
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "One size",
      ...rows.map((v) => v.size),
    ]),
  ];
  return (
    <>
      <ColorChoice colors={colors} initial={initial} onColor={select} />
      <fieldset
        key={
          rows.find((row) => row.color.toLowerCase() === color.toLowerCase())
            ?.color ?? "new-color"
        }
      >
        <legend>Sizes and available quantities</legend>
        {sizes.map((size) => {
          const v = rows.find(
            (row) =>
              row.color.toLowerCase() === color.toLowerCase() &&
              row.size === size,
          );
          return (
            <label
              key={size}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <input
                type="checkbox"
                name="sizes"
                value={size}
                defaultChecked={!!v}
                disabled={!!v}
              />
              {v && <input type="hidden" name="sizes" value={size} />}
              <span style={{ minWidth: 60 }}>{size}</span>
              <input
                type="number"
                aria-label={size + " quantity"}
                name={"qty:" + size}
                min="0"
                step="1"
                defaultValue={v?.stock ?? 0}
                style={{ maxWidth: 100 }}
                onChange={(e) => {
                  const box = e.currentTarget
                    .closest("label")
                    ?.querySelector<HTMLInputElement>("[type=checkbox]");
                  if (box) box.checked = true;
                }}
              />
              <input
                type="hidden"
                name={"previous:" + size}
                value={v ? v.id + "@" + v.stock : ""}
              />
            </label>
          );
        })}
      </fieldset>
    </>
  );
}
