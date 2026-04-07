"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import type { Store } from "@/types";

interface MarketplaceItem {
  id: number;
  company_id: number;
  company_name: string;
  name: string;
  description: string;
  price: string;
  shipping_type?: string;
  shipping_type_display?: string;
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results)) {
    return (data as any).results as T[];
  }
  return [];
}

export default function MaterialsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState<string>("");
  const [storeItems, setStoreItems] = useState<MarketplaceItem[]>([]);
  const [loadingStoreItems, setLoadingStoreItems] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await apiClient.get("/stores/featured/");
        setStores(toArray<Store>(response.data));
      } catch {
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
      (s) =>
        s.company_name.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term)
    );
  }, [search, stores]);

  const openStoreItems = async (store: Store) => {
    setSelectedStoreId(store.id);
    setSelectedStoreName(store.company_name);
    setLoadingStoreItems(true);
    setStoreItems([]);
    try {
      const response = await apiClient.get(`/items/public/?company_id=${store.id}`);
      setStoreItems(toArray<MarketplaceItem>(response.data));
    } catch {
      setStoreItems([]);
    } finally {
      setLoadingStoreItems(false);
    }
  };

  const addItemToCart = async (itemId: number) => {
    setAddingItemId(itemId);
    try {
      await apiClient.post("/cart/", { item_id: itemId, quantity: 1 });
      setCartFeedback("Item adicionado ao carrinho!");
      setTimeout(() => setCartFeedback(null), 2500);
    } catch {
      setCartFeedback("Erro ao adicionar item.");
      setTimeout(() => setCartFeedback(null), 2500);
    } finally {
      setAddingItemId(null);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.company_profile?.company_name ||
    user.first_name ||
    user.username;

  const breadcrumbItems = selectedStoreId
    ? [
        { label: "Painel", href: "/dashboard" },
        { label: "Comprar Material", href: "/materials" },
        { label: selectedStoreName },
      ]
    : [{ label: "Painel", href: "/dashboard" }, { label: "Comprar Material" }];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={breadcrumbItems} />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comprar Material</h1>
              <p className="text-sm text-gray-500 mt-0.5">Encontre lojas disponíveis perto de você.</p>
            </div>
            <button
              onClick={() => router.push("/cart")}
              className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-orange-600 transition-colors flex-shrink-0 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Carrinho
            </button>
          </div>

          {/* Cart feedback toast */}
          {cartFeedback && (
            <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              cartFeedback.startsWith("Erro") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
            }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cartFeedback.startsWith("Erro") ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"} />
              </svg>
              {cartFeedback}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por loja ou categoria..."
              className="w-full md:max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Stores grid */}
          {filteredStores.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                title="Nenhuma loja encontrada"
                description="Não há lojas disponíveis no momento ou que correspondam à sua busca."
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStores.map((store) => (
                <article
                  key={store.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                    selectedStoreId === store.id ? "border-orange-400 ring-2 ring-orange-200" : "border-gray-100"
                  }`}
                >
                  {/* Store banner */}
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span
                      className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        store.is_open
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {store.is_open ? "Aberta" : "Fechada"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h2 className="font-semibold text-gray-900 leading-tight">{store.company_name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5 mb-3">{store.category}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {store.distance} km
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {store.rating} ({store.rating_count || 0})
                      </span>
                      <span>~{store.eta_minutes || "-"} min</span>
                    </div>

                    <button
                      onClick={() => openStoreItems(store)}
                      disabled={loadingStoreItems && selectedStoreId === store.id}
                      className="w-full bg-orange-500 text-white text-sm font-medium rounded-xl py-2.5 hover:bg-orange-600 transition-colors disabled:opacity-60"
                    >
                      {loadingStoreItems && selectedStoreId === store.id
                        ? "Carregando..."
                        : "Ver itens"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Store Items Panel */}
          {selectedStoreId && (
            <section className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900">{selectedStoreName}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Itens disponíveis para compra</p>
                </div>
                <button
                  onClick={() => { setSelectedStoreId(null); setStoreItems([]); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Fechar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingStoreItems ? (
                <LoadingScreen fullScreen={false} message="Carregando itens..." />
              ) : storeItems.length === 0 ? (
                <EmptyState
                  title="Sem itens disponíveis"
                  description="Esta loja ainda não possui itens cadastrados para venda."
                />
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeItems.map((item) => (
                    <article
                      key={item.id}
                      className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-sm transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">
                        {item.description || "Sem descrição"}
                      </p>
                      {item.shipping_type_display && (
                        <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-2">
                          {item.shipping_type_display}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-orange-500 text-sm">
                          R$ {Number(item.price).toFixed(2)}
                        </span>
                        <button
                          onClick={() => addItemToCart(item.id)}
                          disabled={addingItemId === item.id}
                          className="bg-orange-500 text-white text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-orange-600 transition-colors disabled:opacity-60"
                        >
                          {addingItemId === item.id ? "..." : "Adicionar"}
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
