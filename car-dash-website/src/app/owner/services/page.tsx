"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string | null;
}

export default function OwnerServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({});
  const router = useRouter();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData(service);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/services/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update service");
      await fetchServices();
      setEditingId(null);
      setFormData({});
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete service");
      await fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service");
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Services</h1>
            <p className="text-sm text-neutral-400">Edit your service offerings</p>
          </div>
          <Link href="/owner/dashboard" className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium">
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-6">
          {services.map((service) => (
            <div key={service.id} className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
              {editingId === service.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                    placeholder="Service Title"
                  />
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                    placeholder="Service Description"
                    rows={3}
                  />
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                    placeholder="Price"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 transition font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">{service.title}</h2>
                    <p className="text-neutral-400 mb-4">{service.description}</p>
                    <p className="text-lg font-semibold text-red-600">${service.price}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No services found</p>
          </div>
        )}
      </main>
    </div>
  );
}
