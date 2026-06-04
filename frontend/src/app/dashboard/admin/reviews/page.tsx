"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";
import type { Review } from "@/types";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== "admin")) router.push("/dashboard");
  }, [authLoading, isAuthenticated, user, router]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("target_type", typeFilter);
      const r = await apiClient.get<Review[]>(`/reviews/list/?${params}`);
      setReviews(Array.isArray(r.data) ? r.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.user_type === "admin") fetchReviews();
  }, [isAuthenticated, user, typeFilter]);

  if (authLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "admin") return null;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName="Admin" userInitial="A" />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb items={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Avaliações" }]} />
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Avaliações da Plataforma</h1>

          {/* Summary bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">{avgRating}</p>
              <p className="text-sm text-gray-500">Média geral</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">{reviews.filter((r) => r.target_type === "provider").length}</p>
              <p className="text-sm text-gray-500">Prestadores</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{reviews.filter((r) => r.target_type === "company").length}</p>
              <p className="text-sm text-gray-500">Empresas</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
            >
              <option value="">Todos</option>
              <option value="provider">Prestadores</option>
              <option value="company">Empresas</option>
            </select>
          </div>

          {loading ? (
            <LoadingScreen fullScreen={false} message="Carregando avaliações..." />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Stars rating={review.rating} />
                        <span className="font-semibold text-gray-800">{review.rating}/5</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${review.target_type === "provider" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                          {review.target_type === "provider" ? "Prestador" : "Empresa"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        <span className="font-medium text-gray-600">{review.reviewer_name}</span> avaliou <span className="font-medium text-gray-600">{review.target_name}</span>
                      </p>
                      {review.comment ? (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 italic">&ldquo;{review.comment}&rdquo;</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sem comentário.</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center py-12 text-gray-400">Nenhuma avaliação encontrada.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
