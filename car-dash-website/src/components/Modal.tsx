"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      window.addEventListener("keydown", onKey);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 shadow-2xl">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-black/70 px-3 py-2 text-sm text-white transition hover:bg-black"
        >
          ✕
        </button>
        <div className="max-h-[90vh] h-[90dvh] overflow-hidden">
          <div
            className="h-full overflow-y-auto px-6 pb-10 pt-16 sm:px-8 sm:pb-[3.25rem]"
            style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
