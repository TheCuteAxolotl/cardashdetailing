"use client";

import { DELETED_MESSAGE } from "@/lib/deleted-message";
import { useEffect, useRef, useState } from "react";

type Attachment = { sid: string; contentType: string; url: string };
export default function SmsAttachments({ sid, body = "" }: { sid?: string | null; body?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [media, setMedia] = useState<Attachment[]>([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !sid || body === DELETED_MESSAGE) return;
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/sms/media/${encodeURIComponent(sid)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setMedia(data.media || []); setStatus("ready");
      }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [sid, visible, attempt, body]);
  if (!sid || body === DELETED_MESSAGE) return null;
  const expected = /\{image\}|MMS attachment|\[image\]/i.test(body);
  return <div ref={container}>
    {status === "loading" && expected && <p className="mt-2 text-xs opacity-70">Loading attachments…</p>}
    {status === "error" && <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-2 text-xs underline">Could not check attachments. Retry</button>}
    {status === "ready" && expected && !media.length && <p className="mt-2 text-xs opacity-70">Photo unavailable. Ask the customer to resend it.</p>}
    {media.length > 0 && <div className="mt-3 grid gap-3">
      {media.map(item => <div key={item.sid}>
        {/^image\/(jpeg|png|gif|webp|avif)$/i.test(item.contentType) && <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open full-size customer photo">
          <img src={item.url} alt="Photo sent by text message" loading="lazy" className="max-h-72 max-w-full rounded-xl object-contain" onError={event => { event.currentTarget.hidden = true; }} />
        </a>}
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs underline">{item.contentType.startsWith("image/") ? "Open full-size photo" : "Open attachment"}</a>
      </div>)}
    </div>}
  </div>;
}
