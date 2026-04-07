"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import type { Provider } from "@/types";

export default function ProvidersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingProvider, setRequestingProvider] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; ok: boolean } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await apiClient.get("/providers/nearby/");
        const data = response.data as unknown as any;
        setProviders(Array.isArray(data) ? data : (data?.results ?? []));
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providers;
    const term = search.toLowerCase();
    return providers.filter(
      (p) =>
        p.full_name.toLowerCase().includes(term) ||
        p.specialties.join(", ").toLowerCase().includes(term)
    );
  }, [search, providers]);

  const requestTechnicalVisit = async (providerId: number) => {
    if (!user?.consumer_profile) return;
    setRequestingProvider(providerId);
    try {
      await apiClient.post("/technical-visits/", {
        provider: providerId,
        address: `${user.consumer_profile.street}, ${user.consumer_profile.number} - ${user.consumer_profile.city}/${user.consumer_profile.state}`,
        preferred_date: null,
        notes: "Solicitação criada pelo catálogo de prestadores.",
      });
      setFeedback({ id: providerId, ok: true });
    } catch {
      setFeedback({ id: providerId, ok: false });
    } finally {
      setRequestingProvider(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.company_profile?.company_name ||
    user.first_name ||
    user.username;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Prestadores" }]} />

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contratar Prestador</h1>
              <p className="text-sm text-gray-500 mt-0.5">Prestadores disponíveis próximos a você.</p>
            </div>
            <button
              onClick={() => router.push("/cart")}
              className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-orange-600 transition-colors flex-shrink-0 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Carrinho
            </button>
          </div>

          {feedback && (
            <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              feedback.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feedback.ok ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
              {feedback.ok ? "Visita técnica solicitada com sucesso!" : "Erro ao solicitar visita técnica."}
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou especialidade..."
              className="w-full md:max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            />
          </div>

          {filteredProviders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                title="Nenhum prestador disponível"
                description="Não há prestadores disponíveis no momento ou que correspondam à sua busca."
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProviders.map((provider) => (
                <article
                  key={provider.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-gray-900 text-sm leading-tight">{provider.full_name}</h2>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{provider.specialties.join(", ")}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {provider.distance} km
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {provider.rating}
                      </span>
                      <span>~{provider.eta_minutes || "-"} min</span>
                    </div>

                    {feedback?.id === provider.id && feedback.ok ? (
                      <p className="mt-3 text-center text-xs font-medium text-green-600 bg-green-50 rounded-lg py-1.5">
                        Solicitado!
                      </p>
                    ) : (
                      <button
                        onClick={() => requestTechnicalVisit(provider.id)}
                        disabled={requestingProvider === provider.id}
                        className="mt-3 w-full bg-orange-500 text-white text-xs font-medium rounded-xl py-2.5 hover:bg-orange-600 transition-colors disabled:opacity-60"
                      >
                        {requestingProvider === provider.id ? "Solicitando..." : "Solicitar visita técnica"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
