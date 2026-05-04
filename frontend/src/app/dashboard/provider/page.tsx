"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import type { Store, TechnicalVisitRequest } from "@/types";

export default function ProviderDashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAvailable, setIsAvailable] = useState(false);
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [pendingVisits, setPendingVisits] = useState<TechnicalVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
    if (user && user.user_type === "provider") {
      fetchFeaturedStores();
      fetchAvailabilityStatus();
      fetchPendingVisits();
    }
  }, [user]);

  const fetchFeaturedStores = async () => {
    try {
      const response = await apiClient.get<Store[]>("/stores/provider/");
      if (response.data) {
        setFeaturedStores(response.data);
      }
    } catch (error) {
      console.error("Error fetching featured stores:", error);
      setFeaturedStores([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingVisits = async () => {
    try {
      const r = await apiClient.get<Record<string, TechnicalVisitRequest[]>>("/technical-visits/provider-panel/");
      if (r.data) setPendingVisits(r.data.pending || []);
    } catch { /* ignore */ }
  };

  const fetchAvailabilityStatus = async () => {
    try {
      const response = await apiClient.get<{ is_available: boolean }>("/auth/providers/availability/");
      if (response.data) {
        setIsAvailable(response.data.is_available);
      }
    } catch (error) {
      console.error("Error fetching availability status:", error);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      const response = await apiClient.post("/auth/providers/availability/update/", {
        is_available: newStatus,
      });
      if (response.data) {
        setIsAvailable(newStatus);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;

  if (!user || user.user_type !== "provider") {
    return null;
  }

  const fullName = user.provider_profile?.full_name || user.first_name || user.username;
  const userName = fullName?.split(" ")[0] || fullName || "";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={fullName} userInitial={fullName?.charAt(0).toUpperCase()} />

      <div className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "Painel" }]} />

          {/* Availability Status Card */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h3 className="text-white font-semibold mb-1">Status de Disponibilidade</h3>
                <p className="text-gray-300 text-sm">
                  {isAvailable ? "Você está disponível" : "Você está indisponível"}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAvailable ? "bg-orange-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={() => router.push("/dashboard/provider/visits")}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-200 transition-all"
            >
              <svg className="w-12 h-12 text-orange-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-base font-semibold text-gray-800">Painel de Visitas</span>
            </button>

            {/* Alertas card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Alertas
              </p>
              {pendingVisits.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-gray-400 text-center">Nenhuma solicitação pendente.</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto max-h-32">
                  {pendingVisits.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => router.push("/dashboard/provider/visits")}
                      className="w-full text-left p-2.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <p className="text-xs font-semibold text-amber-800 truncate">{v.consumer_name}</p>
                      <p className="text-xs text-amber-600 mt-0.5">Nova solicitação de visita</p>
                    </button>
                  ))}
                </div>
              )}
              {pendingVisits.length > 0 && (
                <button
                  onClick={() => router.push("/dashboard/provider/visits")}
                  className="mt-2 text-xs text-orange-500 font-medium hover:underline text-right"
                >
                  Ver todas →
                </button>
              )}
            </div>
          </div>

          {/* Featured Stores */}
          <div>
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
              {featuredStores.map((store) => (
                <div key={store.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative h-48 bg-gray-200">
                    {store.image_url ? (
                      <Image src={store.image_url} alt={store.company_name} width={400} height={192} className="w-full h-full object-cover" />
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
                      {store.is_open ? "Aberta agora" : "Fechada no momento"}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{store.distance} km</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      ⭐ {store.rating} ({store.rating_count || 0} avaliações) · ETA médio {store.eta_minutes || "-"} min
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
          router.replace("/dashboard/provider");
        }}
        userType="provider"
      />
    </div>
  );
}
