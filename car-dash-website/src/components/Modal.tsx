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
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 mx-4 max-w-3xl rounded-2xl bg-neutral-900 p-6 shadow-lg">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md px-3 py-1 text-sm text-neutral-300 hover:text-white"
        >
          ✕
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
}
