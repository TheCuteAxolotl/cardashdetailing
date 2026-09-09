"use client";

import { useEffect, useState } from "react";
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
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to fetch services");

      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (
      !newService.title.trim() ||
      !newService.description.trim() ||
      !newService.price
    ) {
      alert("Please enter a title, description, and price.");
      return;
    }

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newService.title.trim(),
          description: newService.description.trim(),
          price: Number(newService.price),
          image: newService.image.trim() || null,
        }),
      });

if (!response.ok) {
  const data = await response.json().catch(() => null);
  alert(
    `Create failed: ${response.status} - ${
      data?.error || "Unknown error"
    }`
  );
  return;
}

      setNewService({
        title: "",
        description: "",
        price: "",
        image: "",
      });

      await fetchServices();
    } catch (error) {
      console.error("Error creating service:", error);
      alert("Failed to create service");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          image: formData.image || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update service");
      }

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

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-700" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Services</h1>
            <p className="text-sm text-neutral-400">
              Add, edit, and remove service offerings
            </p>
          </div>

          <Link
            href="/owner/dashboard"
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6">Add New Service</h2>

          <div className="grid gap-4">
            <input
              type="text"
              value={newService.title}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  title: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
              placeholder="Service title"
            />

            <textarea
              value={newService.description}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  description: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
              placeholder="Service description"
              rows={4}
            />

            <input
              type="number"
              value={newService.price}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  price: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
              placeholder="Starting price"
              min="0"
              step="1"
            />

            <input
              type="text"
              value={newService.image}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  image: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
              placeholder="Image URL (optional)"
            />

            <button
              onClick={handleCreate}
              className="w-fit px-6 py-3 rounded-lg bg-red-700 hover:bg-red-800 transition font-medium"
            >
              Add Service
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8"
            >
              {editingId === service.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                    placeholder="Service title"
                  />

                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                    placeholder="Service description"
                    rows={4}
                  />

                  <input
                    type="number"
                    value={formData.price ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                    placeholder="Price"
                  />

                  <input
                    type="text"
                    value={formData.image || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        image: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                    placeholder="Image URL"
                  />

                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 transition font-medium"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({});
                      }}
                      className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">
                      {service.title}
                    </h2>

                    <p className="text-neutral-400 mb-4 whitespace-pre-line">
                      {service.description}
                    </p>

                    <p className="text-lg font-semibold text-red-600">
                      Starting at ${service.price}
                    </p>
                  </div>

                  <div className="flex gap-2">
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
            <p className="text-neutral-400">
              No services yet. Add your first service above.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
