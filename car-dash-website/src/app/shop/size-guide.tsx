"use client";
import {useState} from "react";

const preset = "Car Dash boxy hoodie · S–2XL";
const sizes = ["S","M","L","XL","2XL"];
const measurements = [
  {name:"Length", inches:[24.80,25.59,26.38,27.17,27.95], how:"Measure from where the shoulder seam meets the collar down to the hem."},
  {name:"Shoulder", inches:[20.87,21.65,22.44,23.23,24.02], how:"Measure across from one shoulder seam to the other, where the sleeves attach."},
  {name:"Chest", inches:[24.02,24.80,25.59,26.38,27.17], how:"Lay the garment flat and measure straight across between the seams below the armpits. This is the width across one side."},
  {name:"Sleeve length", inches:[21.65,22.05,22.44,22.83,23.62], how:"Measure from the shoulder seam at the armhole to the cuff."}
];
export function GuideEditor({initial}:{initial:string}){
  const [usePreset,choose]=useState(initial===preset);
  return <div><label>Size guide <select value={usePreset?"hoodie":"custom"} onChange={e=>choose(e.target.value==="hoodie")}><option value="custom">Custom measurements</option><option value="hoodie">Boxy hoodie (S–2XL)</option></select></label>
    {usePreset?<input type="hidden" name="guide" value={preset}/>:null}
    <textarea aria-label="Custom measurements with units" name="guide" className="block w-full rounded border p-2" hidden={usePreset} disabled={usePreset} required={!usePreset} defaultValue={initial===preset?"":initial}/>
  </div>;
}
export function SizeGuide({guide}:{guide:string}){
  const [cm,setCm]=useState(false);
  if(guide!==preset)return <p className="whitespace-pre-line">{guide}</p>;
  return <div className="mt-3 space-y-3"><label>Units <select value={cm?"cm":"in"} onChange={e=>setCm(e.target.value==="cm")}><option value="in">Inches</option><option value="cm">Centimeters</option></select></label>
    <div className="overflow-x-auto"><table className="w-full text-sm"><caption>Flat garment measurements ({cm?"cm":"in"})</caption><thead><tr><th scope="col">Size</th>{measurements.map(m=><th className="p-1" scope="col" key={m.name}>{m.name}</th>)}</tr></thead>
    <tbody>{sizes.map((s,i)=><tr key={s}><th scope="row">{s}</th>{measurements.map(m=><td className="text-center p-1" key={m.name}>{(m.inches[i]*(cm?2.54:1)).toFixed(cm?1:2)}</td>)}</tr>)}</tbody></table></div>
    <h3>How to measure</h3><ol className="list-decimal pl-5">{measurements.map(m=><li key={m.name}><strong>{m.name}.</strong> {m.how}</li>)}</ol></div>;
}
