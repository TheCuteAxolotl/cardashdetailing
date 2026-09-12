"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Booking = {
  id: string;
  serviceName: string;
  serviceMethod: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim?: string | null;
  preferredDate?: string | null;
  quotedPrice?: number | null;
  status: string;
  createdAt: string;
};

const statusDetails: Record<string, { label: string; description: string; className: string }> = {
  pending: {
    label: "Requested",
    description: "Your request was received and is waiting for confirmation.",
    className: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    description: "Your detail has been confirmed.",
    className: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  },
  completed: {
    label: "Completed",
    description: "This detail has been completed.",
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    description: "This request was cancelled.",
    className: "border-red-400/20 bg-red-400/10 text-red-200",
  },
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        if (!authResponse.ok) {
          window.location.assign("/login");
          return;
        }

        const authData = await authResponse.json();
        const currentUser = authData.user as User;

        if (currentUser.role === "owner") {
          window.location.assign("/owner/dashboard");
          return;
        }

        setUser(currentUser);
        setName(currentUser.name);

        const bookingResponse = await fetch("/api/bookings", { cache: "no-store" });
        if (bookingResponse.ok) {
          setBookings(await bookingResponse.json());
        }
      } catch (error) {
        console.error(error);
        window.location.assign("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => !["completed", "cancelled"].includes(booking.status.toLowerCase())),
    [bookings]
  );

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (!response.ok) {
        setProfileMessage(data.error || "Unable to save account information.");
        return;
      }

      setProfileMessage("Account information updated.");
      setUser(data.user);
    } catch {
      setProfileMessage("Unable to save account information right now.");
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPasswordMessage(data.error || "Unable to update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully.");
    } catch {
      setPasswordMessage("Unable to update password right now.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    setDeleteMessage("");

    if (deleteConfirmation !== "DELETE") {
      setDeleteMessage("Type DELETE exactly to confirm account deletion.");
      return;
    }

    setDeleteSaving(true);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setDeleteMessage(data.error || "Unable to delete your account.");
        return;
      }

      window.location.replace("/");
    } catch {
      setDeleteMessage("Unable to delete your account right now.");
    } finally {
      setDeleteSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#0D0D0D] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#FF2D2D]" />
          <p className="mt-4 text-sm text-white/40">Loading account…</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <section className="border-b border-white/8">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF2D2D]">Account</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Everything about your detail, in one place.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/42 sm:text-base">
                View your account information, follow the status of your detailing requests, and manage your password.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {user.role !== "owner" && (
                <a href="/dashboard" className="rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white">
                  Dashboard
                </a>
              )}
              <a href="/contact" className="rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D] transition hover:bg-[#FF2D2D]">
                Request a Detail
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1280px] gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-14">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/8 bg-[#111318] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/30">Account information</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Profile</h2>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-full border border-[#FF2D2D]/20 bg-[#FF2D2D]/10 text-sm font-semibold text-[#FF2D2D]">
                {user.name?.slice(0, 1).toUpperCase() || "C"}
              </div>
            </div>

            <form onSubmit={saveProfile} className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/35">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#FF2D2D]/60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/35">Email</span>
                <input
                  value={user.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3.5 text-sm text-white/45 outline-none"
                />
                <span className="mt-2 block text-xs leading-5 text-white/25">Email changes are currently handled by Car Dash Detailing.</span>
              </label>

              {profileMessage && (
                <p className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/60">{profileMessage}</p>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {profileSaving ? "Saving…" : "Save Profile"}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-[#111318] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/30">Security</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Change password</h2>
            <p className="mt-2 text-sm leading-6 text-white/35">Use at least 8 characters for your new password.</p>

            <form onSubmit={changePassword} className="mt-7 space-y-4">
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white placeholder:text-white/22 outline-none transition focus:border-[#FF2D2D]/60"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white placeholder:text-white/22 outline-none transition focus:border-[#FF2D2D]/60"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm text-white placeholder:text-white/22 outline-none transition focus:border-[#FF2D2D]/60"
              />

              {passwordMessage && (
                <p className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/60">{passwordMessage}</p>
              )}

              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordSaving ? "Updating…" : "Update Password"}
              </button>
            </form>
          </section>

          {user.role === "user" && (
            <section className="rounded-[28px] border border-red-500/20 bg-red-500/[0.035] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300/70">Danger zone</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Delete account</h2>
              <p className="mt-2 text-sm leading-6 text-white/40">
                Permanently delete your Car Dash account and account-linked data, including saved vehicles, booking history,
                quote conversations, and warranty records. This cannot be undone.
              </p>

              <form onSubmit={deleteAccount} className="mt-7 space-y-4">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-red-400/15 bg-black/20 px-4 py-3.5 text-sm text-white placeholder:text-white/22 outline-none transition focus:border-red-400/55"
                />
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/35">
                    Type DELETE to confirm
                  </span>
                  <input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                    required
                    className="w-full rounded-2xl border border-red-400/15 bg-black/20 px-4 py-3.5 text-sm text-white placeholder:text-white/22 outline-none transition focus:border-red-400/55"
                  />
                </label>

                {deleteMessage && (
                  <p className="rounded-2xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3 text-sm text-red-100/75">
                    {deleteMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={deleteSaving || deleteConfirmation !== "DELETE" || !deletePassword}
                  className="rounded-full border border-red-400/35 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deleteSaving ? "Deleting account…" : "Permanently Delete Account"}
                </button>
              </form>
            </section>
          )}
        </div>

        <section className="rounded-[28px] border border-white/8 bg-[#111318] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF2D2D]">Detail status</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Your requests</h2>
              <p className="mt-2 text-sm text-white/35">Updates appear here when Car Dash Detailing changes your booking status.</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 text-right">
              <p className="text-2xl font-semibold">{activeBookings.length}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/28">Active</p>
            </div>
          </div>

          {bookings.length ? (
            <div className="mt-8 space-y-4">
              {bookings.map((booking) => {
                const status = booking.status.toLowerCase();
                const detail = statusDetails[status] ?? {
                  label: booking.status,
                  description: "Your request status has been updated.",
                  className: "border-white/10 bg-white/5 text-white/70",
                };

                return (
                  <article key={booking.id} className="rounded-3xl border border-white/8 bg-white/[0.018] p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.015em]">{booking.serviceName}</p>
                        <p className="mt-1 text-sm text-white/38">
                          {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel} {booking.vehicleTrim || ""}
                        </p>
                        <div className="mt-4 grid gap-2 text-xs text-white/30 sm:grid-cols-2">
                          <p>Requested {new Date(booking.createdAt).toLocaleDateString()}</p>
                          <p>Preferred {booking.preferredDate || "Not specified"}</p>
                          <p className="sm:col-span-2 text-emerald-300/80">Booking total: {booking.quotedPrice != null ? `$${booking.quotedPrice.toFixed(2)}` : "Legacy booking"}</p>
                        </div>
                      </div>
                      <span className={`w-fit rounded-full border px-3.5 py-2 text-xs font-semibold ${detail.className}`}>
                        {detail.label}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-4">
                      <p className="text-sm leading-6 text-white/38">{detail.description}</p>
                      <a
                        href={`/booking-chat/${booking.id}`}
                        className="rounded-full border border-[#FF2D2D]/35 bg-[#FF2D2D]/10 px-4 py-2 text-xs font-semibold text-[#FF2D2D] transition hover:bg-[#FF2D2D]/20"
                      >
                        Message Car Dash
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center">
              <p className="text-lg font-semibold">No detail requests yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">When you request a service while signed in, its status will appear here.</p>
              <a href="/contact" className="mt-6 inline-block rounded-full bg-[#FF2D2D] px-5 py-3 text-sm font-semibold text-[#0D0D0D] transition hover:bg-[#FF2D2D]">Request a Detail</a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
