"use client";

import { useState } from "react";
import { extractBookingPhotos, stripBookingPhotos } from "@/lib/booking-photos";

export default function BookingPhotoEvidence({ notes }: { notes: string | null | undefined }) {
  const photos = extractBookingPhotos(notes);
  const cleanNotes = stripBookingPhotos(notes);
  const [open, setOpen] = useState<string | null>(null);

  if (!cleanNotes && !photos.length) return null;

  return (
    <>
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
