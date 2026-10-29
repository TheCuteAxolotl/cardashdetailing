"use client";

import { useState } from "react";
import { extractBookingPhotos, stripBookingPhotos } from "@/lib/booking-photos";
import { bookingOwnerNotes } from "@/lib/booking-owner-details";

export default function BookingPhotoEvidence({ notes }: { notes: string | null | undefined }) {
  const photos = extractBookingPhotos(notes);
  const cleanNotes = stripBookingPhotos(notes).replace(/\[\[CAR_DASH_OWNER_NOTES\]\][\s\S]*?\[\[\/CAR_DASH_OWNER_NOTES\]\]/g, "").trim();
  const ownerNotes = bookingOwnerNotes(notes);
  const [open, setOpen] = useState<string | null>(null);

  if (!cleanNotes && !ownerNotes && !photos.length) return null;

  return (
    <>
      {ownerNotes && <div className="mt-4 rounded-2xl border border-[#d6b779]/25 bg-[#27241e] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#d6b779]">Private owner notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#f4efe5]">{ownerNotes}</p></div>}
      {cleanNotes && <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#13232F] p-4 text-xs leading-6 text-white/72">{cleanNotes}</pre>}
      {photos.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#13232F]/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-white/45">Customer vehicle photos</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((src, index) => (
              <button key={index} type="button" onClick={() => setOpen(src)} className="overflow-hidden rounded-xl bg-black">
                <img src={src} alt={`Customer vehicle photo ${index + 1}`} className="h-32 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button type="button" onClick={() => setOpen(null)} className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Close</button>
          <img src={open} alt="Customer vehicle upload enlarged" className="max-h-[88vh] max-w-[94vw] rounded-2xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  );
}
