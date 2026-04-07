"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/api-client";
import type { Provider } from "@/types";

export default function ProvidersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingProvider, setRequestingProvider] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await apiClient.get<Provider[]>("/providers/nearby/");
        setProviders(response.data || []);
      } catch (error) {
        console.error("Error fetching providers:", error);
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
      (provider) =>
        provider.full_name.toLowerCase().includes(term) ||
        provider.specialties.join(", ").toLowerCase().includes(term)
    );
  }, [search, providers]);

  const requestTechnicalVisit = async (providerId: number) => {
    if (!user?.consumer_profile) {
      alert("Somente consumidores podem solicitar visita técnica.");
      return;
    }
    setRequestingProvider(providerId);
    try {
      await apiClient.post("/technical-visits/", {
        provider: providerId,
        address: `${user.consumer_profile.street}, ${user.consumer_profile.number} - ${user.consumer_profile.city}/${user.consumer_profile.state}`,
        preferred_date: null,
        notes: "Solicitação criada pelo catálogo de prestadores.",
      });
      alert("Visita técnica solicitada com sucesso.");
    } catch (error) {
      console.error(error);
      alert("Erro ao solicitar visita técnica.");
    } finally {
      setRequestingProvider(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.company_profile?.company_name ||
    user.first_name ||
    user.username;

  return (
    <div className="flex min-h-screen bg-orange-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Contratar Prestador</h1>
                <p className="text-gray-600 mt-1">Visualize prestadores disponiveis perto de voce.</p>
              </div>
              <button
                onClick={() => router.push("/cart")}
                className="bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600"
              >
                Ver carrinho
              </button>
            </div>
          </div>

          <div className="mb-8">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por prestador ou especialidade..."
              className="w-full md:max-w-2xl rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {filteredProviders.length === 0 && (
              <div className="md:col-span-4 bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
                Não existem prestadores disponíveis no momento
              </div>
            )}

            {filteredProviders.map((provider) => (
              <article key={provider.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800">{provider.full_name}</h2>
                  <p className="text-sm text-gray-600 mt-1">{provider.specialties.join(", ")}</p>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                    <span>{provider.distance} km</span>
                    <span className="font-medium text-gray-700">⭐ {provider.rating}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {provider.rating_count || 0} avaliações · ETA médio {provider.eta_minutes || "-"} min
                  </div>
                  <button
                    onClick={() => requestTechnicalVisit(provider.id)}
                    disabled={requestingProvider === provider.id}
                    className="mt-3 w-full bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 disabled:opacity-50"
                  >
                    {requestingProvider === provider.id ? "Solicitando..." : "Solicitar visita técnica"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
