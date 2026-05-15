"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function OwnerSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "" });
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      setUser(data.user);
      setFormData({ name: data.user.name });
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      setMessage("Profile updated successfully!");
      await fetchUser();
    } catch (error) {
      setMessage("Failed to update profile");
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-neutral-400">Manage your account</p>
          </div>
          <Link href="/owner/dashboard" className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium">
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
          <h2 className="text-2xl font-semibold mb-6">Account Settings</h2>

          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.includes("success")
                ? "bg-green-900/30 border-green-700 text-green-200"
                : "bg-red-900/30 border-red-700 text-red-200"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-400"
              />
              <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-red-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-700 hover:bg-red-800 py-3 rounded-lg font-semibold transition"
            >
              Save Changes
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
          <h2 className="text-2xl font-semibold mb-6">Account Info</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-400">Account Type</p>
              <p className="text-lg font-semibold capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Member Since</p>
              <p className="text-lg font-semibold">
                {user.id ? "Your account is active" : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
