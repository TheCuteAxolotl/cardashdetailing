"use client";

import { useMemo, useState } from "react";

export type StaffGuideSection = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  points: string[];
  scripts?: { label: string; text: string }[];
};

export default function StaffGuideClient({ sections, isOwner, permissions }: { sections: StaffGuideSection[]; isOwner: boolean; permissions: string[] }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");

  const quickLinks = [
    { permission: "support", label: "Support Inbox", href: isOwner ? "/owner/support" : "/admin/support" },
    { permission: "quoteChats", label: "Quote Chat", href: isOwner ? "/owner/quotes" : "/admin/quotes" },
    { permission: "bookings", label: "Bookings", href: isOwner ? "/owner/bookings" : "/admin/bookings" },
    { permission: "smsInbox", label: "SMS Inbox", href: isOwner ? "/owner/messages" : "/admin/messages" },
    { permission: "businessPhone", label: "Business Phone", href: "/owner/calls" },
  ].filter((item) => isOwner || permissions.includes(item.permission));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sections;
    return sections.filter((section) =>
      [section.title, section.eyebrow, section.summary, ...section.points, ...(section.scripts || []).flatMap((script) => [script.label, script.text])]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, sections]);

  return (
    <main className="min-h-screen bg-[#171411] text-[#F7F5F2]">
      <header className="border-b border-[#F7F5F2]/10 bg-[radial-gradient(circle_at_20%_-20%,rgba(192,171,154,.20),transparent_38%),#171411]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#C0AB9A]">Internal · Car Dash Detailing</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Staff Guide</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F7F5F2]/48">Rules, communication standards, customer-service scripts, and the operating playbook for representing Car Dash professionally.</p>
            </div>
            <a href={isOwner ? "/owner/dashboard" : "/admin/dashboard"} className="rounded-full border border-[#F7F5F2]/15 px-5 py-2.5 text-sm font-semibold text-[#F7F5F2]/72 hover:border-[#C0AB9A]/55 hover:text-[#F7F5F2]">Back to dashboard</a>
          </div>
          <div className="mt-7 max-w-xl">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rules, calls, quotes, SMS, support…" className="w-full rounded-2xl border border-[#F7F5F2]/10 bg-[#3F3027]/45 px-4 py-3.5 text-sm outline-none transition focus:border-[#C0AB9A]/60" />
          </div>
          {quickLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {quickLinks.map((item) => (
                <a key={item.label} href={item.href} className="rounded-full border border-[#F7F5F2]/10 bg-[#F7F5F2]/4 px-4 py-2 text-xs font-semibold text-[#F7F5F2]/58 transition hover:border-[#C0AB9A]/38 hover:text-[#F7F5F2]">
                  {item.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[250px_1fr] lg:px-12">
        <aside className="h-fit rounded-[24px] border border-[#F7F5F2]/10 bg-[#F7F5F2]/3 p-4 lg:sticky lg:top-6">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[.25em] text-[#C0AB9A]">Sections</p>
          <div className="mt-3 space-y-1">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="block rounded-xl px-3 py-2 text-sm text-[#F7F5F2]/58 transition hover:bg-[#C0AB9A]/10 hover:text-[#F7F5F2]">{section.title}</a>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[#C0AB9A]/28 bg-[#C0AB9A]/8 p-4 text-xs leading-5 text-[#F7F5F2]/62">
            When in doubt, do not improvise a policy. Tell the customer you are verifying it and escalate to the owner.
          </div>
        </aside>

        <div className="space-y-6">
          {filtered.map((section) => (
            <section id={section.id} key={section.id} className="scroll-mt-6 rounded-[28px] border border-[#F7F5F2]/10 bg-[#3F3027]/30 p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#C0AB9A]">{section.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.035em]">{section.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#F7F5F2]/48">{section.summary}</p>

              <div className="mt-6 grid gap-3">
                {section.points.map((point, index) => (
                  <div key={point} className="flex gap-4 rounded-2xl border border-[#F7F5F2]/8 bg-[#171411]/25 p-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#C0AB9A]/25 text-[11px] font-bold text-[#C0AB9A]">{index + 1}</span>
                    <p className="text-sm leading-6 text-[#F7F5F2]/70">{point}</p>
                  </div>
                ))}
              </div>

              {section.scripts?.length ? (
                <div className="mt-7 border-t border-[#F7F5F2]/8 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#C0AB9A]">Suggested language</p>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {section.scripts.map((script) => {
                      const copyKey = `${section.id}:${script.label}`;
                      return (
                        <div key={script.label} className="rounded-2xl border border-[#C0AB9A]/22 bg-[#C0AB9A]/7 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#C0AB9A]">{script.label}</p>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(script.text);
                                  setCopied(copyKey);
                                  window.setTimeout(() => setCopied((current) => (current === copyKey ? "" : current)), 1400);
                                } catch {
                                  setCopied("");
                                }
                              }}
                              className="rounded-full border border-[#F7F5F2]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#F7F5F2]/48 transition hover:border-[#C0AB9A]/42 hover:text-[#F7F5F2]"
                            >
                              {copied === copyKey ? "Copied" : "Copy script"}
                            </button>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#F7F5F2]/75">“{script.text}”</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>
          ))}

          {!filtered.length && (
            <div className="rounded-[28px] border border-dashed border-[#F7F5F2]/10 p-10 text-center text-sm text-[#F7F5F2]/38">No guide section matched that search.</div>
          )}
        </div>
      </div>
    </main>
  );
}
