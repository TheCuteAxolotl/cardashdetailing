"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Message = {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  contactPreference: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

export default function SupportWidget() {
  const pathname = usePathname();
  const hideLauncher = pathname === "/login" || pathname === "/register" || pathname === "/contact" || pathname === "/estimate" || pathname === "/quote" || pathname.startsWith("/booking-chat") || pathname.startsWith("/owner") || pathname.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const endRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || null,
    [tickets, selectedId]
  );

  const loadAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });

      if (!response.ok) {
        setUser(null);
        setAuthChecked(true);
        return null;
      }

      const data = await response.json();
      const current = data?.user || null;
      setUser(current);
      setAuthChecked(true);
      return current as User | null;
    } catch {
      setUser(null);
      setAuthChecked(true);
      return null;
    }
  };

  const loadTickets = async () => {
    try {
      const response = await fetch("/api/support", { cache: "no-store" });

      if (response.status === 401) {
        setUser(null);
        setTickets([]);
        return;
      }

      if (!response.ok) return;

      const data = (await response.json()) as Ticket[];
      setTickets(data);

      setSelectedId((current) => {
        if (current && data.some((ticket) => ticket.id === current)) {
          return current;
        }
        return data[0]?.id || "";
      });

      if (data.length === 0) {
        setCreatingNew(true);
      }
    } catch {}
  };

  const loadSelectedTicket = async (id: string) => {
    if (!id) return;

    try {
      const response = await fetch(`/api/support/${id}`, {
        cache: "no-store",
      });

      if (!response.ok) return;

      const fresh = (await response.json()) as Ticket;

      setTickets((current) => {
        const exists = current.some((ticket) => ticket.id === fresh.id);
        if (!exists) return [fresh, ...current];
        return current.map((ticket) =>
          ticket.id === fresh.id ? fresh : ticket
        );
      });
    } catch {}
  };

  useEffect(() => {
    if (!hideLauncher) loadAuth();
  }, [hideLauncher]);

  useEffect(() => {
    const openSupport = () => {
      setOpen(true);
    };

    window.addEventListener("open-support", openSupport);

    return () => {
      window.removeEventListener("open-support", openSupport);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    (async () => {
      const current = await loadAuth();
      if (current && current.role !== "owner" && current.role !== "admin") {
        await loadTickets();
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open || !user || user.role === "owner" || user.role === "admin" || !selectedId) return;

    loadSelectedTicket(selectedId);

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadSelectedTicket(selectedId);
      }
    }, 10000);

    return () => window.clearInterval(timer);
  }, [open, user, selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length, open]);

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSending(true);
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401) {
        setUser(null);
        throw new Error("Please log in or create an account to contact support.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not send support request.");
      }

      await loadTickets();
      setSelectedId(data.ticket.id);
      setCreatingNew(false);
      formElement.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not send support request."
      );
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!selected || !message.trim()) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(`/api/support/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Message failed.");
      }

      setMessage("");
      await loadSelectedTicket(selected.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Message failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!hideLauncher && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="support-launcher fixed bottom-5 right-5 z-[70] rounded-full border border-black/10 bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D] shadow-[0_18px_50px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5"
        >
          Need help?
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-end bg-black/35 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <section className="flex max-h-[84vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] text-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.26em] text-[#FF2D2D]">
                  Car Dash Support
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Account Support
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white"
              >
                Close
              </button>
            </div>

            {!authChecked ? (
              <div className="p-6 text-sm text-white/45">Checking account…</div>
            ) : !user ? (
              <div className="space-y-5 p-6">
                <div>
                  <h3 className="text-lg font-semibold">Login required</h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Support chats are private and connected to your Car Dash account.
                    Log in or create an account to start or view a support conversation.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <a
                    href="/login"
                    className="rounded-full bg-[#FF2D2D] px-5 py-3 text-center text-sm font-semibold text-[#0D0D0D] hover:bg-[#FF2D2D]"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white/75 hover:border-white/30 hover:text-white"
                  >
                    Create account
                  </a>
                </div>
              </div>
            ) : user.role === "owner" || user.role === "admin" ? (
              <div className="space-y-4 p-6">
                <h3 className="text-lg font-semibold">Staff account</h3>
                <p className="text-sm leading-6 text-white/45">
                  Customer support conversations are managed from the staff support inbox.
                </p>
                <a
                  href={user.role === "owner" ? "/owner/support" : "/admin/support"}
                  className="block rounded-full bg-[#FF2D2D] px-5 py-3 text-center text-sm font-semibold text-[#0D0D0D] hover:bg-[#FF2D2D]"
                >
                  Open Support Inbox
                </a>
              </div>
            ) : creatingNew ? (
              <form onSubmit={createTicket} className="space-y-4 overflow-y-auto p-5">
                <div className="rounded-2xl border border-white/8 bg-white/[.03] p-4">
                  <p className="text-xs text-white/35">Signed in as</p>
                  <p className="mt-1 text-sm font-semibold">{user.name}</p>
                  <p className="mt-1 text-xs text-white/40">{user.email}</p>
                </div>

                <input
                  name="subject"
                  required
                  placeholder="What is this about?"
                  className="support-input"
                />

                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell the team what happened or what you need."
                  className="support-input resize-none"
                />

                <div>
                  <label className="mb-2 block text-xs text-white/45">
                    How should Car Dash reply?
                  </label>
                  <select name="contactPreference" className="support-input">
                    <option value="website">Website live chat</option>
                    <option value="email">Account email</option>
                    <option value="text">Text me later</option>
                    <option value="phone">Call me later</option>
                  </select>
                </div>

                <input
                  name="phone"
                  placeholder="Phone number (only needed for text/call)"
                  className="support-input"
                />

                {error && <p className="text-sm text-[#FF2D2D]">{error}</p>}

                <button
                  disabled={sending}
                  className="w-full rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D] hover:bg-[#FF2D2D] disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Start support chat"}
                </button>

                {tickets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingNew(false);
                      setSelectedId(tickets[0].id);
                      setError("");
                    }}
                    className="w-full text-center text-xs text-white/40 hover:text-white/70"
                  >
                    Back to my support chats
                  </button>
                )}
              </form>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-white/8 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-white/35">Your private support chats</p>
                      <select
                        value={selectedId}
                        onChange={(event) => setSelectedId(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                      >
                        {tickets.map((ticket) => (
                          <option key={ticket.id} value={ticket.id} className="bg-[#111]">
                            {ticket.subject} · {ticket.status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCreatingNew(true);
                        setError("");
                      }}
                      className="shrink-0 rounded-full border border-white/12 px-3 py-2 text-xs text-white/60 hover:text-white"
                    >
                      New chat
                    </button>
                  </div>
                </div>

                {selected ? (
                  <>
                    <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-5">
                      {selected.messages.map((item) => (
                        <div
                          key={item.id}
                          className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                            item.sender === "team"
                              ? "bg-[#FF2D2D] text-[#0D0D0D]"
                              : "ml-auto bg-white/8 text-white/80"
                          }`}
                        >
                          <p>{item.body}</p>
                          <p className="mt-1 text-[10px] opacity-45">
                            {item.sender === "team" ? "Car Dash" : "You"}
                          </p>
                        </div>
                      ))}
                      <div ref={endRef} />
                    </div>

                    <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
                      <div className="flex gap-2">
                        <input
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          placeholder="Type a message…"
                          className="support-input"
                        />
                        <button
                          disabled={sending}
                          className="rounded-full bg-white px-4 text-sm font-semibold text-[#0D0D0D] disabled:opacity-50"
                        >
                          Send
                        </button>
                      </div>
                      {error && <p className="mt-2 text-xs text-[#FF2D2D]">{error}</p>}
                    </form>
                  </>
                ) : (
                  <div className="grid min-h-[300px] place-items-center p-6 text-center text-sm text-white/35">
                    No support chats yet.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
