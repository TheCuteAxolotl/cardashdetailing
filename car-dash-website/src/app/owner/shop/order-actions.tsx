"use client";

import { useEffect, useState } from "react";

/** Only mark merchandise notifications seen when the owner actually opens Orders. */
export function OrdersOpened() {
  useEffect(() => {
    void fetch("/api/owner/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "shop" }),
    }).then(response => {
      if (response.ok) window.dispatchEvent(new Event("car-dash-notifications-refresh"));
    }).catch(() => undefined);
  }, []);
  return null;
}

export function CopyShippingAddress({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return <button type="button" onClick={() => void copy()} disabled={!value}>
    {copied ? "Address copied" : "Copy delivery address"}
  </button>;
}
