"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { ProviderDetailModal } from "@/components/modals/ProviderDetailModal";
import { apiClient } from "@/lib/api-client";
import type { Store, Provider } from "@/types";

export default function ConsumerDashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") {
      setShowUpgradeModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.user_type === "consumer") {
      fetchFeaturedStores();
      fetchNearbyProviders();
    }
  }, [user]);

  const fetchFeaturedStores = async () => {
    try {
      const response = await apiClient.get<Store[]>("/stores/featured/");
      if (response.data) {
        setFeaturedStores(response.data);
      }
    } catch (error) {
      console.error("Error fetching featured stores:", error);
      // Set empty array on error to prevent infinite loading
      setFeaturedStores([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyProviders = async () => {
    try {
      const response = await apiClient.get<Provider[]>("/providers/nearby/");
      if (response.data) {
        setNearbyProviders(response.data);
      }
    } catch (error) {
      console.error("Error fetching nearby providers:", error);
      // Set empty array on error
      setNearbyProviders([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;

  if (!user || user.user_type !== "consumer") {
    return null;
  }

  const fullName = user.consumer_profile?.full_name || user.first_name || user.username;
  const userName = fullName?.split(" ")[0] || fullName || "";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={fullName} userInitial={fullName?.charAt(0).toUpperCase()} userPhoto={(user as any).profile_photo_url} />

      <div className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "Painel" }]} />
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Olá, {userName}</h1>
            <p className="text-sm text-gray-500 mt-1 mb-5">O que você precisa hoje?</p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar materiais ou prestadores..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Main Categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => router.push("/materials")}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-200 transition-all"
            >
              <svg className="w-12 h-12 text-orange-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-base font-semibold text-gray-800">Comprar Material</span>
            </button>

            <button
              onClick={() => router.push("/providers")}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-200 transition-all"
            >
              <svg className="w-12 h-12 text-orange-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-base font-semibold text-gray-800">Contratar Prestador</span>
            </button>

            <button
              onClick={() => router.push("/minhas-visitas")}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-200 transition-all"
            >
              <svg className="w-12 h-12 text-orange-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-base font-semibold text-gray-800">Minhas Visitas</span>
            </button>
          </div>

          {/* Featured Stores */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Lojas em Destaque</h2>
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredStores.length === 0 && (
                <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
                  Não existem lojas abertas no momento
                </div>
              )}
              {featuredStores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => router.push(`/stores/${store.id}`)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="relative h-48 bg-gray-200">
                    {store.image_url ? (
                      <img src={store.image_url} alt={store.company_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full flex items-center space-x-1 text-sm font-semibold">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{store.rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{store.company_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{store.category}</p>
                    <p className={`text-xs mb-2 ${store.is_open ? "text-green-600" : "text-red-600"}`}>
                      {store.is_open
                        ? `Aberta agora${store.closing_time ? ` até ${store.closing_time}` : ""}`
                        : "Fechada no momento"}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{store.distance} km</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      ⭐ {store.rating} ({store.rating_count || 0} avaliações) · Chega em média em{" "}
                      {store.eta_minutes || "-"} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Providers */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Prestadores Próximos de Você</h2>
                <p className="text-sm text-gray-600 mt-1">Mostrando apenas prestadores disponíveis</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {nearbyProviders.length === 0 && (
                <div className="md:col-span-4 bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
                  Não existem prestadores disponíveis no momento
                </div>
              )}
              {nearbyProviders.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="relative h-48 bg-gray-200">
                    {provider.image_url ? (
                      <img src={provider.image_url} alt={provider.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full flex items-center space-x-1 text-sm font-semibold">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{provider.rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{provider.full_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{provider.specialties.join(", ")}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{provider.distance} km</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      ⭐ {provider.rating} ({provider.rating_count || 0} avaliações) · Chega em média em{" "}
                      {provider.eta_minutes || "-"} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.replace("/dashboard/consumer");
        }}
        userType="consumer"
      />
      {selectedProvider && (
        <ProviderDetailModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onRequest={(id) => {
            setSelectedProvider(null);
            router.push(`/providers?provider_id=${id}`);
          }}
        />
      )}
    </div>
  );
}
