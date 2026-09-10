"use client";

import { useEffect, useState } from "react";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

type Content = Record<keyof typeof SITE_DEFAULTS, string>;

const fields: Array<{ key: keyof Content; label: string; area?: boolean; group: string }> = [
  { key: "heroEyebrow", label: "Hero small text", group: "Homepage Hero" },
  { key: "heroTitle", label: "Hero headline", area: true, group: "Homepage Hero" },
  { key: "heroBody", label: "Hero description", area: true, group: "Homepage Hero" },
  { key: "heroPrimaryCta", label: "Primary button", group: "Homepage Hero" },
  { key: "heroSecondaryCta", label: "Secondary button", group: "Homepage Hero" },
  { key: "introEyebrow", label: "Intro small text", group: "Homepage Intro" },
  { key: "introTitle", label: "Intro headline", area: true, group: "Homepage Intro" },
  { key: "introBody", label: "Intro paragraph", area: true, group: "Homepage Intro" },
  { key: "storyEyebrow", label: "Story small text", group: "Homepage Story" },
  { key: "storyTitle", label: "Story headline", area: true, group: "Homepage Story" },
  { key: "storyBody", label: "Story paragraph", area: true, group: "Homepage Story" },
  { key: "servicesEyebrow", label: "Services small text", group: "Services Section" },
  { key: "servicesTitle", label: "Services headline", area: true, group: "Services Section" },
  { key: "servicesBody", label: "Services description", area: true, group: "Services Section" },
  { key: "galleryEyebrow", label: "Gallery small text", group: "Gallery Section" },
  { key: "galleryTitle", label: "Gallery headline", area: true, group: "Gallery Section" },
  { key: "contactTitle", label: "Contact headline", area: true, group: "Contact" },
  { key: "contactBody", label: "Contact description", area: true, group: "Contact" },
  { key: "footerBlurb", label: "Footer description", area: true, group: "Footer" },
];

export default function OwnerWebsiteEditor() {
  const [content, setContent] = useState<Content>({ ...SITE_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setContent({ ...SITE_DEFAULTS, ...data }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setContent({ ...SITE_DEFAULTS, ...data });
      setMessage("Website text updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const groups = Array.from(new Set(fields.map((field) => field.group)));

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-red-500">Owner</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Website Editor</h1>
            <p className="mt-1 text-sm text-white/45">Change public website wording without touching code.</p>
          </div>
          <a href="/owner/dashboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 hover:border-white/30 hover:text-white">Back</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {loading ? <p className="text-white/45">Loading website content…</p> : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group} className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
                <h2 className="text-lg font-semibold">{group}</h2>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {fields.filter((field) => field.group === group).map((field) => (
                    <label key={field.key} className={field.area ? "md:col-span-2" : ""}>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{field.label}</span>
                      {field.area ? (
                        <textarea value={content[field.key]} onChange={(e) => setContent({ ...content, [field.key]: e.target.value })} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-red-500/60" />
                      ) : (
                        <input value={content[field.key]} onChange={(e) => setContent({ ...content, [field.key]: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-red-500/60" />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            ))}

            <div className="sticky bottom-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#111]/95 p-4 shadow-2xl backdrop-blur">
              <p className="text-sm text-white/50">{message || "Changes appear on the public site after saving."}</p>
              <button onClick={save} disabled={saving} className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">{saving ? "Saving…" : "Save Website"}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
