"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { CompanyOnboardingModal } from "@/components/modals/CompanyOnboardingModal";

const features = [
  {
    id: 1,
    title: "Conferir Itens",
    description: "Gerencie os produtos da sua loja",
    href: "/dashboard/company/items",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Gerenciar Entregas",
    description: "Configure entregas e entregadores",
    href: "/dashboard/company/deliveries",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Pedidos",
    description: "Acompanhe e gerencie pedidos",
    href: "/dashboard/company/orders",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Gerenciar Estoque",
    description: "Controle seu inventário",
    href: "/dashboard/company/inventory",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 5,
    title: "Recebimentos",
    description: "Acompanhe suas vendas",
    href: "/dashboard/company/revenue",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 6,
    title: "Contas a Pagar",
    description: "Controle suas despesas",
    href: "/dashboard/company/bills",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function CompanyDashboardPage() {
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const showOnboarding =
    !authLoading &&
    user?.user_type === "company" &&
    user.company_profile != null &&
    user.company_profile.onboarding_completed === false;

  if (authLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "company") return null;

  const userName = user.company_profile?.company_name || user.first_name || user.username;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} userPhoto={(user as any).profile_photo_url} />

      <div className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[{ label: "Painel" }]} />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {userName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Bem-vindo ao painel de controle da sua empresa.</p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => router.push(feature.href)}
                className="group relative rounded-2xl p-5 text-left transition-all hover:shadow-md bg-gray-900 hover:bg-gray-800"
              >
                <div className="mb-3 text-orange-400">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-1 text-white">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-400">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showOnboarding && (
        <CompanyOnboardingModal onComplete={async () => { await refreshUser(); }} />
      )}
    </div>
  );
}
