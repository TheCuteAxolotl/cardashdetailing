"use client";

import { useEffect } from "react";

export default function OwnerSetup() {

  useEffect(() => {
    // Check if user is authenticated as owner
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          window.location.assign("/login");
          return;
        }
        const data = await response.json();
        if (data.user.role !== "owner") {
          window.location.assign("/");
          return;
        }
      } catch (error) {
        window.location.assign("/login");
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#07131B] text-white">
      {/* Header */}
      <header className="border-b border-[#27404F] bg-[#0B1822]">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-2xl font-bold">Welcome to Owner Setup</h1>
          <p className="text-sm text-white/52 mt-2">Get your business dashboard ready</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">You're All Set!</h2>
          <p className="text-lg text-white/72 mb-8">
            Welcome to your Car Dash Detailing owner dashboard. Here's what you can do:
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="text-3xl">⚙️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Manage Services</h3>
                <p className="text-white/52">Edit service descriptions and prices for your customers</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">🖼️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Upload Gallery Images</h3>
                <p className="text-white/52">Showcase your best work with before and after photos</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">📅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Manage Bookings</h3>
                <p className="text-white/52">View and manage all customer booking requests</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">⚙️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Update Settings</h3>
                <p className="text-white/52">Manage your account information and preferences</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <a
              href="/owner/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[#6EAEC6] px-8 py-4 text-base font-semibold text-[#0B1822] transition duration-200 hover:bg-[#6EAEC6]"
            >
              Go to Dashboard →
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-[#27404F] bg-[#0B1822] p-8">
          <h3 className="text-xl font-semibold mb-4">Quick Tips</h3>
          <ul className="space-y-3 text-white/72">
            <li>✓ Regularly update your services to reflect current pricing</li>
            <li>✓ Add high-quality images to attract more customers</li>
            <li>✓ Check your bookings daily to respond promptly to requests</li>
            <li>✓ Keep your contact information up to date</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
