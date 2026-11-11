"use client";

import { useMemo, useState } from "react";
import { getMediaKind, type MediaItem } from "@/lib/media";
import { getMediaPlacementPath, type MediaPlacement } from "@/lib/media-placements";

type StatusFilter = "missing" | "all" | "ready" | "video";
type Row = {
  placement: MediaPlacement;
  photoCount: number;
  videoCount: number;
  preview: string | null;
};

export default function GalleryPlacementChecklist({
  placements, media, selected, onSelect,
}: {
  placements: MediaPlacement[];
  media: MediaItem[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("missing");
  const [expanded, setExpanded] = useState<string[]>(["Homepage", "Car Detailing Packages"]);

  const rows = useMemo(() => {
    const bucket = new Map<string, { photos: MediaItem[]; videos: number }>();
    for (const item of media) {
      const entry = bucket.get(item.category) || { photos: [], videos: 0 };
      if (getMediaKind(item.url) === "image") entry.photos.push(item);
      else entry.videos += 1;
      bucket.set(item.category, entry);
    }
    return placements.map((placement): Row => {
      const entry = bucket.get(placement.value);
      return { placement, photoCount: entry?.photos.length || 0,
        videoCount: entry?.videos || 0, preview: entry?.photos[0]?.url || null };
    });
  }, [placements, media]);

  const totals = useMemo(() => ({
    total: rows.length,
    ready: rows.filter(item => item.photoCount > 0).length,
    missing: rows.filter(item => item.photoCount === 0).length,
    video: rows.filter(item => item.photoCount === 0 && item.videoCount > 0).length,
  }), [rows]);

  const groups = useMemo(() => {
    const all = [...new Set(placements.map(item => item.group))];
    const search = query.trim().toLowerCase();
    return all.map(group => {
      const groupRows = rows.filter(row => row.placement.group === group);
      const match = groupRows.filter(row =>
        (!search || (row.placement.label + " " + group).toLowerCase().includes(search)) &&
        (statusFilter === "all" ||
          (statusFilter === "missing" && row.photoCount === 0) ||
          (statusFilter === "ready" && row.photoCount > 0) ||
          (statusFilter === "video" && row.photoCount === 0 && row.videoCount > 0))
      );
      return { group, match, total: groupRows.length,
        missing: groupRows.filter(row => row.photoCount === 0).length,
        ready: groupRows.filter(row => row.photoCount > 0).length };
    }).filter(group => group.match.length);
  }, [placements, rows, statusFilter, query]);

  const selectedGroup = placements.find(item => item.value === selected)?.group;
  const toggle = (group: string) => {
    setExpanded(current => current.includes(group) ? current.filter(item => item !== group) : [...current, group]);
  };
  return <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#1c1c1c]" aria-labelledby="gallery-coverage-title">
    <header className="border-b border-white/10 px-4 py-5 sm:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b779]">Photo coverage</p>
      <h2 id="gallery-coverage-title" className="mt-1 text-xl font-semibold text-[#f4efe5] sm:text-2xl">Where photos are still needed</h2>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-[#b8b1a6]">
        Every slot is checked against its own assigned uploads. A fallback image or an uploaded video does not count as a photo for that slot.
        Photo slots can be optional; these counts track coverage, not booking requirements.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Photo coverage totals">
        <div className="rounded-xl border border-white/10 bg-[#252422] p-3 sm:p-4">
          <p className="text-[10px] text-[#b9b1a4]">Total placements</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totals.total}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#252422] p-3 sm:p-4">
          <p className="text-[10px] text-[#b9b1a4]">With photos</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#d6b779]">{totals.ready}</p>
        </div>
        <div className="rounded-xl border border-[#a77c44]/35 bg-[#2c251c] p-3 sm:p-4">
          <p className="text-[10px] text-[#e0bb8a]">Missing photos</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#f0ca9b]">{totals.missing}</p>
        </div>
      </div>
    </header>

    <div className="px-4 py-4 sm:px-6">
      <label htmlFor="search-gallery-placements" className="text-xs font-semibold text-[#dfd5c6]">Find a page or package</label>
      <input id="search-gallery-placements" type="search" value={query} onChange={event => setQuery(event.target.value)}
        placeholder="Search: Full Detail, ceramic, homepage..."
        className="mt-2 w-full rounded-xl border border-white/20 bg-[#292825] px-4 py-3 text-base text-[#f4efe5] outline-none placeholder:text-[#a49a8c] focus:border-[#d6b779]"/>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter photo slots">
        {([
          ["missing", "Missing photos"], ["all", "All placements"],
          ["ready", "With photos"], ["video", "Video only"],
        ] as const).map(([key,label]) => (
          <button type="button" key={key} aria-pressed={statusFilter===key} onClick={()=>setStatusFilter(key)}
            className={"rounded-full border px-3.5 py-2 text-xs font-semibold transition " +
              (statusFilter===key ? "border-[#d6b779] bg-[#d6b779] text-[#171717]" :
                "border-white/15 bg-[#282725] text-[#d5ccc0] hover:border-[#d6b779]/50")}>{label}</button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#aca397]">{groups.reduce((sum, group) => sum + group.match.length, 0)} matching placements · Tap a slot to assign its next photo.</p>
    </div>

    <div className="space-y-3 px-4 pb-5 sm:px-6">
      {!groups.length && <p className="rounded-xl border border-white/10 bg-[#262521] p-6 text-center text-sm text-[#b8b1a6]">
        No placements match these filters. Try another page or switch to All placements.
      </p>}
      {groups.map(({group, match, total, missing, ready}) => {
        const open = Boolean(query.trim()) || expanded.includes(group) || selectedGroup === group;
        return <section key={group} className="overflow-hidden rounded-xl border border-white/15 bg-[#242321]">
          <button type="button" onClick={()=>toggle(group)} aria-expanded={open}
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-white/[.035]">
            <span className="min-w-0"><span className="block text-sm font-semibold text-[#f4efe5]">{group}</span>
              <span className="mt-1 block text-[11px] text-[#b2aa9d]">{ready} with photos · {missing} missing · {total} slots</span>
            </span>
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2"
              className={"shrink-0 text-[#d6b779] transition-transform " + (open?"rotate-180":"")}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {open && <div className="divide-y divide-white/10 border-t border-white/10">
            {match.map(row => {
              const {placement,photoCount,videoCount,preview}=row;
              const active=selected === placement.value;
              const subLabel=placement.label.split(" / ").slice(1).join(" / ").trim() || placement.label;
              const path=getMediaPlacementPath(placement.value);
              return <div key={placement.value} className={"flex items-center gap-3 px-3 py-3 sm:px-4 " +
                (active?"bg-[#d6b779]/10":"hover:bg-white/[.025]")}>
                <div className="grid h-12 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/15 bg-[#181818]">
                  {preview ? <img src={preview} loading="lazy" alt="" className="h-full w-full object-cover" />
                    : <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#8d8375]">
                        <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m3 16 5-4 4 3 3-2 6 5"/>
                      </svg>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-xs font-semibold leading-5 text-[#f2eee6] sm:text-sm">{subLabel}</p>
                  <p className={"mt-1 text-[11px] font-semibold " + (photoCount ? "text-[#b9d9c7]" : "text-[#e7bd87]")}>
                    {photoCount ? photoCount + (photoCount===1?" photo":" photos") + " assigned"
                      : videoCount ? "No photo yet · Video only" : "Missing photo"}
                    {placement.photoOnly && !photoCount ? " · Photo-only slot" : ""}
                  </p>
                  {path && <a href={path} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-[#d6b779] underline">View page</a>}
                </div>
                <button type="button" onClick={()=>onSelect(placement.value)}
                  className={"shrink-0 rounded-lg border px-3 py-2 text-[11px] font-semibold transition " +
                    (active?"border-[#d6b779] bg-[#d6b779] text-[#171717]":
                     "border-[#d6b779]/35 bg-[#302a20] text-[#e8d0a2] hover:border-[#d6b779]")}>
                  {photoCount?"Add more":"Add photo"}
                </button>
              </div>;
            })}
          </div>}
        </section>;
      })}
    </div>
  </section>;
}
