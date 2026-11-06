"use client";
import { useState } from "react";

const sizes = ["S", "M", "L", "XL", "2XL", "One size"];

export default function SizePicker({ initial = "" }: { initial?: string }) {
  const [custom, setCustom] = useState(false);
  const options = initial && !sizes.includes(initial) ? [...sizes, initial] : sizes;
  return <div>
    <label>Size
      <select name={custom ? undefined : "size"} required defaultValue={initial}
        onChange={event => setCustom(event.currentTarget.selectedOptions[0].dataset.custom === "yes")}>
        <option value="" disabled>Choose a size</option>
        {options.map(size => <option key={size} value={size}>{size}</option>)}
        <option data-custom="yes">Other size…</option>
      </select>
    </label>
    {custom && <label>Custom size<input name="size" required /></label>}
  </div>;
}
