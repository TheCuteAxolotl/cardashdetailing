"use client";

import { useMemo, useState } from "react";
import { MediaVisual } from "@/components/MediaLightbox";
import { getMediaKind, type MediaItem } from "@/lib/media";
import { getMediaPlacementPath, type MediaPlacement } from "@/lib/media-placements";

export default function GalleryMediaCard({
  item, placements, onUpdate, onDelete,
}: {
  item: MediaItem;
  placements: MediaPlacement[];
  onUpdate: (item: MediaItem, category: string, title?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const current = placements.find(p => p.value === item.category);
  const groups = useMemo(() => [...new Set(placements.map(p => p.group))], [placements]);
  const [group, setGroup] = useState(current?.group || groups[0] || "");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isImage = getMediaKind(item.url) === "image";
  const matching = placements.filter(p =>
    p.group === group && (isImage || !p.photoOnly) &&
    (!search.trim() || p.label.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const currentPath = getMediaPlacementPath(item.category);
  const move = async (category: string) => {
    if (category === item.category) { setOpen(false); return; }
    setBusy(true);
    try { await onUpdate(item, category); setOpen(false); }
    finally { setBusy(false); }
  };
  return <article className="overflow-hidden rounded-2xl border border-white/15 bg-[#232321]">
    <div className="relative aspect-[16/10] bg-[#111]"><MediaVisual item={item} thumbnail className="h-full w-full object-cover" />
      <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#141414]/90 px-3 py-1 text-[10px] font-semibold text-[#f4eee5]">
        {isImage ? "Photo" : "Video"}
      </span>
    </div>
    <div className="space-y-3 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#d6b779]">{current?.group || "Legacy / custom"}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#f4eee5]">{current?.label.split("→").slice(1).join(" / ").trim() || item.category}</p>
        {currentPath && <a href={currentPath} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-[#d6b779] underline">View public page</a>}
        {!current && <p className="mt-2 text-xs text-amber-200">This placement is not in the current page list. Move it to an active slot.</p>}
        {current?.photoOnly && !isImage && <p className="mt-2 text-xs text-amber-200">This slot requires a photo. Move the video elsewhere.</p>}
      </div>
      <label className="block text-xs font-medium text-[#c5bdb1]">Media title
        <input defaultValue={item.title} onBlur={event => {
          if (event.target.value !== item.title) void onUpdate(item,item.category,event.target.value);
        }} className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#2c2b28] px-3 py-2.5 text-sm text-[#f4eee5] outline-none focus:border-[#d6b779]" />
      </label>
      <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open}
        className="w-full rounded-xl border border-[#d6b779]/30 px-4 py-2.5 text-sm font-semibold text-[#e2cb9d] hover:border-[#d6b779]">
        {open?"Close placement picker":"Change placement"}
      </button>
      {open && <div className="rounded-xl border border-white/10 bg-[#191919] p-3">
        <label className="block text-xs font-medium text-[#c5bdb1]">Choose a page
          <select value={group} onChange={event=>{setGroup(event.target.value);setSearch("");}}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#292824] px-3 py-2.5 text-sm text-[#f4eee5]">
            {groups.map(value=><option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="mt-3 block text-xs font-medium text-[#c5bdb1]">Find a slot
          <input type="search" value={search} onChange={event=>setSearch(event.target.value)}
            placeholder="Type a package or photo location..."
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#292824] px-3 py-2.5 text-sm text-[#f4eee5] outline-none placeholder:text-[#999084] focus:border-[#d6b779]" />
        </label>
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto overscroll-contain">
          {!matching.length && <p className="p-3 text-xs text-[#b2a99c]">No matching placements. Try another search.</p>}
          {matching.map(p=><button key={p.value} type="button" disabled={busy}
            onClick={()=>void move(p.value)}
            className={"w-full rounded-lg px-3 py-2.5 text-left text-xs leading-5 disabled:opacity-50 " +
              (p.value===item.category?"bg-[#d6b779]/20 text-[#f0d7a6]":"text-[#ddd5ca] hover:bg-white/10")}>
            {p.label.split("→").slice(1).join(" / ").trim() || p.label}
            {p.value===item.category?" · Current":""}
          </button>)}
        </div>
      </div>}
      <button type="button" onClick={()=>void onDelete(item.id)}
        className="w-full rounded-xl border border-red-400/20 px-3 py-2.5 text-xs font-semibold text-red-200 hover:border-red-300/50">Delete media</button>
    </div>
  </article>;
}
