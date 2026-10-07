"use client";

import { useEffect, useState } from "react";
import { OWNER_EMAIL } from "@/lib/constants";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimQuoteId, setClaimQuoteId] = useState("");


  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const claim = q.get("claimQuoteId") || "";
    const prefillEmail = q.get("email") || "";
    const prefillName = q.get("name") || "";
    setClaimQuoteId(claim);
    if (prefillEmail) setEmail(prefillEmail);
    if (prefillName) setName(prefillName);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (email.toLowerCase() === OWNER_EMAIL) return setError("Invalid email for registration");

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, claimQuoteId }),
      });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Registration failed");
      window.location.assign(claimQuoteId ? `/quote?thread=${encodeURIComponent(claimQuoteId)}` : "/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "customer-input w-full border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/25 outline-none transition focus:border-[#C0AB9A]/55 focus:bg-black/30 focus:shadow-[0_0_0_3px_rgba(192,171,154,.08)]";

  return (
    <div className="customer-app min-h-screen px-6 py-14 text-white sm:py-20">
      <div className="mx-auto w-full max-w-md">
        <a href="/" className="mb-8 flex items-center justify-center gap-3 text-white/75 hover:text-white"><img src="/favicon.png" alt="" className="h-9 w-9 rounded-full border border-white/12 bg-white/5 p-1" /><span className="text-sm font-semibold tracking-[.12em]">CAR DASH</span></a>
        <div className="customer-auth-card border border-white/10 bg-white/[.035] p-7 shadow-[0_30px_100px_rgba(0,0,0,.28)] sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.26em] text-white/38">Car Dash account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em]">Create your account.</h1>
          <p className="mt-2 text-sm text-white/42">Keep quotes, bookings, vehicles, and messages in one place.{claimQuoteId ? " Your guest quote will be linked automatically." : ""}</p>

          {error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div><label className="mb-2 block text-sm font-medium text-white/72">Full Name</label><input type="text" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="John Doe" required /></div>
            <div><label className="mb-2 block text-sm font-medium text-white/72">Email</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="your@email.com" required /></div>
            <div><label className="mb-2 block text-sm font-medium text-white/72">Password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="••••••••" required /></div>
            <div><label className="mb-2 block text-sm font-medium text-white/72">Confirm Password</label><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} className="w-full rounded-full bg-white py-3.5 font-semibold text-[#171411] shadow-[0_12px_30px_rgba(0,0,0,.15)] hover:bg-[#EFE8E2] disabled:cursor-not-allowed disabled:opacity-45">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/42">Already have an account? <a href={claimQuoteId ? `/login?claimQuoteId=${encodeURIComponent(claimQuoteId)}&email=${encodeURIComponent(email)}` : "/login"} className="font-semibold text-[#6EAEC6] hover:text-[#6EAEC6]">Sign in</a></div>
        </div>
      </div>
    </div>
  );
}
