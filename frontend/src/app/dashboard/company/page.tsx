"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

export default function CompanyDashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user || user.user_type !== "company") {
    return null;
  }

  const userName = user.company_profile?.company_name || user.first_name || user.username;

  const features = [
    {
      id: 1,
      title: "Conferir Itens",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      premium: false,
    },
    {
      id: 2,
      title: "Gerenciar Entregas",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      premium: false,
    },
    {
      id: 3,
      title: "Colaboradores",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      premium: false,
    },
    {
      id: 4,
      title: "Gerenciar Estoque",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      premium: true,
    },
    {
      id: 5,
      title: "Gerenciar Recebimentos",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      premium: true,
    },
    {
      id: 6,
      title: "Contas a Pagar",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      premium: true,
    },
  ];

  return (
    <div className="flex min-h-screen bg-orange-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Painel de Controle</h1>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => {
                  if (feature.id === 1) {
                    // Conferir Itens
                    router.push("/dashboard/company/items");
                  } else if (feature.premium) {
                    setShowUpgradeModal(true);
                    router.push("/dashboard/company?upgrade=true");
                  }
                }}
                className={`relative rounded-xl p-6 text-left transition-transform hover:scale-105 ${
                  feature.premium
                    ? "bg-orange-100 border-2 border-orange-300 cursor-pointer"
                    : "bg-gray-800 cursor-pointer"
                }`}
              >
                {feature.premium && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
                <div className={`mb-4 ${feature.premium ? "text-orange-500" : "text-orange-500"}`}>
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${feature.premium ? "text-gray-800" : "text-white"}`}>
                  {feature.title}
                </h3>
                {feature.premium && (
                  <p className="text-sm text-gray-600">Disponível no plano Premium</p>
                )}
              </button>
            ))}
          </div>

          {/* Premium Upgrade Banner */}
          <div className="bg-white border-2 border-orange-500 rounded-xl p-6">
            <p className="text-gray-600 text-lg mb-4">
              Desbloqueie todos os recursos! Faça upgrade para o plano Premium e tenha acesso a gerenciamento completo do seu negócio.
            </p>
            <button
              onClick={() => {
                setShowUpgradeModal(true);
                router.push("/dashboard/company?upgrade=true");
              }}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Ver Planos Premium
            </button>
          </div>
        </div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.replace("/dashboard/company");
        }}
        userType="company"
      />
    </div>
  );
}
