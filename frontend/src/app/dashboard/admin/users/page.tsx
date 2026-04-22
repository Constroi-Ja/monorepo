"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";

interface AdminUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  profile_photo_url: string | null;
  consumer_profile?: { full_name: string; city: string; state: string; cpf: string };
  provider_profile?: { full_name: string; city: string; state: string; verified: boolean; is_available: boolean; specialties: string[] };
  company_profile?: { company_name: string; city: string; state: string; cnpj: string; segment: string };
}

const typeLabels: Record<string, { label: string; color: string }> = {
  consumer: { label: "Consumidor", color: "bg-blue-100 text-blue-700" },
  provider: { label: "Prestador", color: "bg-purple-100 text-purple-700" },
  company: { label: "Empresa", color: "bg-green-100 text-green-700" },
  admin: { label: "Admin", color: "bg-gray-100 text-gray-700" },
};

function getName(u: AdminUser) {
  return u.consumer_profile?.full_name || u.provider_profile?.full_name || u.company_profile?.company_name || u.email;
}

function getLocation(u: AdminUser) {
  const p = u.consumer_profile || u.provider_profile || u.company_profile;
  if (!p) return "—";
  return `${(p as any).city || "—"}, ${(p as any).state || ""}`;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== "admin")) router.push("/dashboard");
  }, [authLoading, isAuthenticated, user, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("user_type", typeFilter);
      const r = await apiClient.get<AdminUser[]>(`/auth/admin/users/?${params}`);
      setUsers(Array.isArray(r.data) ? r.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.user_type === "admin") fetchUsers();
  }, [isAuthenticated, user, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  if (authLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName="Admin" userInitial="A" />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Usuários" }]} />
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuários</h1>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-400"
                placeholder="Buscar por email ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                Buscar
              </button>
            </form>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
            >
              <option value="">Todos os tipos</option>
              <option value="consumer">Consumidores</option>
              <option value="provider">Prestadores</option>
              <option value="company">Empresas</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <LoadingScreen fullScreen={false} message="Carregando usuários..." />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Nome</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Tipo</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Localidade</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Cadastro</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const typeInfo = typeLabels[u.user_type] || { label: u.user_type, color: "bg-gray-100 text-gray-700" };
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.profile_photo_url ? (
                              <img src={u.profile_photo_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {getName(u).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-gray-900 truncate max-w-[140px]">{getName(u)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[180px]">{u.email}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{getLocation(u)}</td>
                        <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                          {new Date(u.date_joined).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelected(u)}
                            className="text-orange-500 text-xs font-medium hover:text-orange-600 transition-colors"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhum usuário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {selected.profile_photo_url ? (
                  <img src={selected.profile_photo_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-lg font-bold">
                    {getName(selected).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{getName(selected)}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Tipo</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeLabels[selected.user_type]?.color}`}>
                  {typeLabels[selected.user_type]?.label}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Verificado</span>
                <span className={selected.is_verified ? "text-green-600" : "text-red-500"}>{selected.is_verified ? "Sim" : "Não"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Localidade</span>
                <span className="text-gray-700">{getLocation(selected)}</span>
              </div>
              {selected.provider_profile && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Disponível</span>
                    <span className={selected.provider_profile.is_available ? "text-green-600" : "text-gray-400"}>
                      {selected.provider_profile.is_available ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Verificado (prestador)</span>
                    <span className={selected.provider_profile.verified ? "text-green-600" : "text-amber-500"}>
                      {selected.provider_profile.verified ? "Verificado" : "Pendente"}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-500">Especialidades</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.provider_profile.specialties.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {selected.company_profile && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Segmento</span>
                  <span className="text-gray-700">{selected.company_profile.segment}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Cadastrado em</span>
                <span className="text-gray-700">{new Date(selected.date_joined).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
