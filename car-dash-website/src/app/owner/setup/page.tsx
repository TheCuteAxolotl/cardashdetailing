"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OwnerSetup() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated as owner
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const data = await response.json();
        if (data.user.role !== "owner") {
          router.push("/");
          return;
        }
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-2xl font-bold">Welcome to Owner Setup</h1>
          <p className="text-sm text-neutral-400 mt-2">Get your business dashboard ready</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">You're All Set!</h2>
          <p className="text-lg text-neutral-300 mb-8">
            Welcome to your Car Dash Detailing owner dashboard. Here's what you can do:
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="text-3xl">⚙️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Manage Services</h3>
                <p className="text-neutral-400">Edit service descriptions and prices for your customers</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">🖼️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Upload Gallery Images</h3>
                <p className="text-neutral-400">Showcase your best work with before and after photos</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">⭐</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Approve Reviews</h3>
                <p className="text-neutral-400">Accept or reject customer reviews before they appear on your site</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">📅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Manage Bookings</h3>
                <p className="text-neutral-400">View and manage all customer booking requests</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">⚙️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Update Settings</h3>
                <p className="text-neutral-400">Manage your account information and preferences</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/owner/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-red-700 px-8 py-4 text-base font-semibold text-white transition duration-200 hover:bg-red-800"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
          <h3 className="text-xl font-semibold mb-4">Quick Tips</h3>
          <ul className="space-y-3 text-neutral-300">
            <li>✓ Regularly update your services to reflect current pricing</li>
            <li>✓ Add high-quality images to attract more customers</li>
            <li>✓ Check your bookings daily to respond promptly to requests</li>
            <li>✓ Approve positive reviews to build trust with potential customers</li>
            <li>✓ Keep your contact information up to date</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
