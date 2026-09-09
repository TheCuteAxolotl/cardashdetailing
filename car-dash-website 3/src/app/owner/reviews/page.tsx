"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Review {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

export default function OwnerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });

      if (!response.ok) throw new Error("Failed to approve review");
      await fetchReviews();
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Failed to approve review");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to reject review");
      await fetchReviews();
    } catch (error) {
      console.error("Error rejecting review:", error);
      alert("Failed to reject review");
    }
  };

  const pendingReviews = reviews.filter((r) => !r.approved);
  const approvedReviews = reviews.filter((r) => r.approved);

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
            <h1 className="text-2xl font-bold">Manage Reviews</h1>
            <p className="text-sm text-neutral-400">Accept or reject pending reviews</p>
          </div>
          <Link href="/owner/dashboard" className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition text-sm font-medium">
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-yellow-500">
              Pending Reviews ({pendingReviews.length})
            </h2>
            <div className="space-y-6">
              {pendingReviews.map((review) => (
                <div key={review.id} className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{review.name}</h3>
                      <p className="text-sm text-neutral-400 mb-3">{review.email}</p>
                      <div className="flex items-center gap-2 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-yellow-500" : "text-neutral-600"}>
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-neutral-300">{review.comment}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="px-6 py-2 rounded-lg bg-green-700 hover:bg-green-800 transition font-medium text-sm"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      className="px-6 py-2 rounded-lg bg-red-700 hover:bg-red-800 transition font-medium text-sm"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Reviews */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-green-500">
            Approved Reviews ({approvedReviews.length})
          </h2>
          {approvedReviews.length > 0 ? (
            <div className="space-y-6">
              {approvedReviews.map((review) => (
                <div key={review.id} className="rounded-3xl border border-green-700/50 bg-green-950/20 p-8">
                  <h3 className="text-xl font-semibold mb-1">{review.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-yellow-500" : "text-neutral-600"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-neutral-300">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-400">
              No approved reviews yet
            </div>
          )}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No reviews yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
