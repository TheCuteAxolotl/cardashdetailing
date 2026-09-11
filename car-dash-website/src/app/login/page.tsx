"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.user.role === "owner") window.location.assign("/owner/dashboard");
      else if (data.user.role === "admin") window.location.assign("/admin/dashboard");
      else window.location.assign("/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[72vh] bg-[#0D0D0D] px-6 py-16 text-white sm:py-24">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(74,85,104,.15),rgba(255,255,255,.02))] p-7 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#FF2D2D]">Customer Account</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-.04em]">Welcome Back</h1>
          <p className="mt-2 text-sm text-white/42">Sign in to view bookings, quotes, vehicles, and messages.</p>

          {error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/72">Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-white placeholder-white/25 outline-none transition focus:border-[#FF2D2D]/65 focus:bg-black/65 focus:shadow-[0_0_0_3px_rgba(255,45,45,.07)]" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/72">Password</label>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-white placeholder-white/25 outline-none transition focus:border-[#FF2D2D]/65 focus:bg-black/65 focus:shadow-[0_0_0_3px_rgba(255,45,45,.07)]" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-[#FF2D2D] py-3.5 font-semibold text-[#0D0D0D] shadow-[0_0_30px_rgba(255,45,45,.12)] hover:bg-[#FF2D2D] disabled:cursor-not-allowed disabled:opacity-45">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/42">
            Don&apos;t have an account? <a href="/register" className="font-semibold text-[#FF2D2D] hover:text-[#FF2D2D]">Create one</a>
          </div>
        </div>
      </div>
    </div>
  );
}
