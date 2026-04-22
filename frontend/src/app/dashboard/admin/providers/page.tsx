"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";

interface AdminProvider {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  specialties: string[];
  verified: boolean;
  is_available: boolean;
  criminal_record_url: string | null;
  rating_average: number;
  rating_count: number;
  coverage_radius_km: number;
  created_at: string;
}

export default function AdminProvidersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedFilter, setVerifiedFilter] = useState(searchParams.get("filter") === "unverified" ? "false" : "");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<AdminProvider | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== "admin")) router.push("/dashboard");
  }, [authLoading, isAuthenticated, user, router]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (verifiedFilter !== "") params.set("verified", verifiedFilter);
      const r = await apiClient.get<AdminProvider[]>(`/admin/providers/?${params}`);
      setProviders(Array.isArray(r.data) ? r.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.user_type === "admin") fetchProviders();
  }, [isAuthenticated, user, verifiedFilter]);

  const handleVerify = async (provider: AdminProvider, verified: boolean) => {
    try {
      await apiClient.post(`/auth/admin/providers/${provider.id}/verify/`, { verified });
      setProviders((prev) => prev.map((p) => p.id === provider.id ? { ...p, verified } : p));
      if (selected?.id === provider.id) setSelected({ ...selected, verified });
      setToast(verified ? "Prestador verificado!" : "Verificação removida.");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setToast("Erro ao atualizar verificação.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  if (authLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName="Admin" userInitial="A" />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Prestadores" }]} />
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Prestadores</h1>

          {toast && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{toast}</div>
          )}

          {/* Filter */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
            >
              <option value="">Todos</option>
              <option value="true">Verificados</option>
              <option value="false">Aguardando verificação</option>
            </select>
          </div>

          {loading ? (
            <LoadingScreen fullScreen={false} message="Carregando prestadores..." />
          ) : (
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{p.full_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.verified ? "Verificado" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{p.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.specialties.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelected(p)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Ver
                    </button>
                    {p.verified ? (
                      <button
                        onClick={() => handleVerify(p, false)}
                        className="px-3 py-1.5 text-sm border border-red-200 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Revogar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerify(p, true)}
                        className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                      >
                        Verificar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {providers.length === 0 && (
                <div className="text-center py-12 text-gray-400">Nenhum prestador encontrado.</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Provider detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{selected.full_name}</p>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className={`font-medium ${selected.verified ? "text-green-600" : "text-amber-600"}`}>
                    {selected.verified ? "Verificado" : "Pendente"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Disponível</p>
                  <p className={`font-medium ${selected.is_available ? "text-green-600" : "text-gray-400"}`}>
                    {selected.is_available ? "Sim" : "Não"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Raio de atendimento</p>
                  <p className="font-medium text-gray-700">{selected.coverage_radius_km} km</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Avaliação</p>
                  <p className="font-medium text-gray-700">
                    {selected.rating_average.toFixed(1)} ★ ({selected.rating_count})
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-1">
                  {selected.specialties.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">{s}</span>
                  ))}
                </div>
              </div>

              {/* Criminal record */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2">Antecedentes Criminais</p>
                {selected.criminal_record_url ? (
                  <a
                    href={selected.criminal_record_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-orange-500 font-medium hover:text-orange-600 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Abrir documento
                  </a>
                ) : (
                  <p className="text-gray-400 italic">Não enviado</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {selected.verified ? (
                  <button
                    onClick={() => handleVerify(selected, false)}
                    className="flex-1 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Revogar verificação
                  </button>
                ) : (
                  <button
                    onClick={() => handleVerify(selected, true)}
                    className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Verificar prestador
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
