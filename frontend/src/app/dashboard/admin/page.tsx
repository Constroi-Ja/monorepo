"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";

interface Stats {
  total_users: number;
  consumers: number;
  providers: number;
  companies: number;
  providers_verified: number;
  providers_unverified: number;
  total_items: number;
  total_reviews: number;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
    if (!authLoading && user && user.user_type !== "admin") router.push("/dashboard");
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.user_type === "admin") {
      apiClient.get<Stats>("/admin/stats/").then((r) => {
        if (r.data) setStats(r.data);
      }).finally(() => setLoading(false));
    }
  }, [isAuthenticated, user]);

  if (authLoading || loading) return <LoadingScreen />;
  if (!user || user.user_type !== "admin") return null;

  const adminNav = [
    { href: "/dashboard/admin/users", label: "Ver Usuários", color: "bg-blue-50 text-blue-600", desc: "Gerencie todos os cadastros" },
    { href: "/dashboard/admin/providers", label: "Prestadores", color: "bg-purple-50 text-purple-600", desc: "Verifique documentos e antecedentes" },
    { href: "/dashboard/admin/stores", label: "Lojas", color: "bg-green-50 text-green-600", desc: "Empresas e produtos cadastrados" },
    { href: "/dashboard/admin/reviews", label: "Avaliações", color: "bg-orange-50 text-orange-600", desc: "Monitore notas e comentários" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName="Admin" userInitial="A" />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[{ label: "Admin" }]} />

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-500 text-sm mt-1">Visão geral da plataforma ConstróiJá</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total de usuários" value={stats.total_users} color="bg-blue-50 text-blue-600"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              />
              <StatCard label="Prestadores" value={stats.providers} color="bg-purple-50 text-purple-600"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
              <StatCard label="Empresas" value={stats.companies} color="bg-green-50 text-green-600"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              />
              <StatCard label="Avaliações" value={stats.total_reviews} color="bg-orange-50 text-orange-600"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
              />
            </div>
          )}

          {/* Provider verification alert */}
          {stats && stats.providers_unverified > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-700">
                <strong>{stats.providers_unverified}</strong> prestador{stats.providers_unverified !== 1 ? "es" : ""} aguardando verificação.{" "}
                <button onClick={() => router.push("/dashboard/admin/providers?filter=unverified")} className="underline font-medium">Revisar agora</button>
              </p>
            </div>
          )}

          {/* Quick access */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminNav.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left hover:shadow-md hover:border-orange-200 transition-all group"
              >
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 ${item.color}`}>
                  {item.label}
                </div>
                <p className="text-gray-500 text-sm">{item.desc}</p>
                <div className="mt-4 text-orange-500 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Acessar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
