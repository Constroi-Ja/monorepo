"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/api-client";
import type { Store } from "@/types";

interface MarketplaceItem {
  id: number;
  company_id: number;
  company_name: string;
  name: string;
  description: string;
  price: string;
}

export default function MaterialsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [storeItems, setStoreItems] = useState<MarketplaceItem[]>([]);
  const [loadingStoreItems, setLoadingStoreItems] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await apiClient.get<Store[]>("/stores/featured/");
        setStores(response.data || []);
      } catch (error) {
        console.error("Error fetching stores:", error);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const filteredStores = useMemo(() => {
    if (!search.trim()) return stores;
    const term = search.toLowerCase();
    return stores.filter(
      (store) =>
        store.company_name.toLowerCase().includes(term) ||
        store.category.toLowerCase().includes(term)
    );
  }, [search, stores]);

  const openStoreItems = async (companyId: number) => {
    setSelectedStoreId(companyId);
    setLoadingStoreItems(true);
    try {
      const itemsResponse = await apiClient.get<MarketplaceItem[]>(`/items/public/?company_id=${companyId}`);
      setStoreItems(itemsResponse.data || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar itens da loja.");
    } finally {
      setLoadingStoreItems(false);
    }
  };

  const addItemToCart = async (itemId: number) => {
    setAddingItemId(itemId);
    try {
      await apiClient.post("/cart/", { item_id: itemId, quantity: 1 });
      alert("Item adicionado ao carrinho.");
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar item ao carrinho.");
    } finally {
      setAddingItemId(null);
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
                <h1 className="text-3xl font-bold text-gray-800">Comprar Material</h1>
                <p className="text-gray-600 mt-1">Encontre lojas abertas perto de voce.</p>
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
              placeholder="Buscar por loja ou categoria..."
              className="w-full md:max-w-2xl rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredStores.length === 0 && (
              <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
                Não existem lojas abertas no momento
              </div>
            )}

            {filteredStores.map((store) => (
              <article key={store.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800">{store.company_name}</h2>
                  <p className="text-sm text-gray-600 mt-1">{store.category}</p>
                  <p className={`text-xs mt-1 ${store.is_open ? "text-green-600" : "text-red-600"}`}>
                    {store.is_open ? "Aberta agora" : "Fechada no momento"}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                    <span>{store.distance} km</span>
                    <span className="font-medium text-gray-700">⭐ {store.rating}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {store.rating_count || 0} avaliações · ETA médio {store.eta_minutes || "-"} min
                  </div>
                  <button
                    onClick={() => openStoreItems(store.id)}
                    disabled={loadingStoreItems && selectedStoreId === store.id}
                    className="mt-3 w-full bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loadingStoreItems && selectedStoreId === store.id ? "Carregando itens..." : "Ver itens da loja"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {selectedStoreId && (
            <section className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Itens da loja</h2>
              {loadingStoreItems ? (
                <p className="text-gray-600">Carregando itens...</p>
              ) : storeItems.length === 0 ? (
                <p className="text-gray-600">Esta loja ainda não possui itens disponíveis.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storeItems.map((item) => (
                    <article key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description || "Sem descrição"}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-semibold text-gray-800">R$ {Number(item.price).toFixed(2)}</span>
                        <button
                          onClick={() => addItemToCart(item.id)}
                          disabled={addingItemId === item.id}
                          className="bg-orange-500 text-white rounded-lg px-3 py-2 text-sm hover:bg-orange-600 disabled:opacity-50"
                        >
                          {addingItemId === item.id ? "Adicionando..." : "Adicionar ao carrinho"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
