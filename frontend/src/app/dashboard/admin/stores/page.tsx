"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";

interface AdminStoreItem {
  id: number;
  name: string;
  price: string;
  shipping_type: string;
}

interface AdminStore {
  id: number;
  user_id: number;
  company_name: string;
  email: string;
  segment: string;
  cnpj: string;
  city: string;
  state: string;
  rating_average: number;
  rating_count: number;
  logo_url: string | null;
  total_items: number;
  items: AdminStoreItem[];
  created_at: string;
}

export default function AdminStoresPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminStore | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== "admin")) router.push("/dashboard");
  }, [authLoading, isAuthenticated, user, router]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const r = await apiClient.get<AdminStore[]>(`/admin/stores/?${params}`);
      setStores(Array.isArray(r.data) ? r.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.user_type === "admin") fetchStores();
  }, [isAuthenticated, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStores();
  };

  if (authLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "admin") return null;

  const shippingLabel: Record<string, string> = {
    leve: "Leve", medio: "Médio", "meio-pesado": "Meio-pesado", pesado: "Pesado",
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName="Admin" userInitial="A" />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Lojas" }]} />
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Lojas e Empresas</h1>

          {/* Search */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex gap-3">
            <input
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-400"
              placeholder="Buscar por nome da empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
              Buscar
            </button>
          </form>

          {loading ? (
            <LoadingScreen fullScreen={false} message="Carregando lojas..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((store) => (
                <div key={store.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt={store.company_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-bold flex-shrink-0 text-lg">
                        {store.company_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{store.company_name}</p>
                      <p className="text-sm text-gray-500">{store.segment}</p>
                      <p className="text-xs text-gray-400">{store.city}, {store.state}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>⭐ {store.rating_average.toFixed(1)} ({store.rating_count} aval.)</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {store.total_items} produto{store.total_items !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelected(store)}
                    className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Ver produtos
                  </button>
                </div>
              ))}
              {stores.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400">Nenhuma loja encontrada.</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Store detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {selected.logo_url ? (
                  <img src={selected.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg">
                    {selected.company_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{selected.company_name}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">CNPJ</p>
                <p className="font-medium text-gray-700">{selected.cnpj}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Avaliação</p>
                <p className="font-medium text-gray-700">{selected.rating_average.toFixed(1)} ★ ({selected.rating_count})</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">Produtos à venda ({selected.total_items})</p>
            {selected.items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum produto cadastrado.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selected.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                    <span className="text-gray-700 truncate flex-1">{item.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                        {shippingLabel[item.shipping_type] || item.shipping_type}
                      </span>
                      <span className="font-semibold text-gray-900">R$ {Number(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
