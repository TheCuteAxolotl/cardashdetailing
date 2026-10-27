"use client";
import { useState } from "react";

export default function DeleteMessageButton({ kind, id, onDeleted }: { kind: "quote" | "booking" | "sms"; id: string; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm("Delete this message and its photos from the website? This applies everywhere the conversation appears. It cannot recall texts already delivered to a phone.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/messages/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete message.");
      onDeleted();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not delete message."); }
    finally { setBusy(false); }
  }
  return <div className="mt-2"><button type="button" disabled={busy} onClick={() => void remove()} className="text-xs underline disabled:opacity-50" aria-label="Delete message">{busy ? "Deleting…" : "Delete"}</button>{error && <p role="alert" className="mt-1 text-xs">{error}</p>}</div>;
}
