"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import { StoreReviewsModal } from "@/components/modals/StoreReviewsModal";
import type { Store } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarketplaceItem {
  id: number;
  company_id: number;
  company_name: string;
  name: string;
  marca?: string;
  peso?: number | null;
  description: string;
  price: string;
  shipping_type?: string;
  shipping_type_display?: string;
  photo_url?: string | null;
}

type Tab = "lojas" | "produtos";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results)) {
    return (data as any).results as T[];
  }
  return [];
}


// ─── Page ────────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("lojas");
  const [search, setSearch] = useState("");

  // Lojas tab state
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [storeItems, setStoreItems] = useState<MarketplaceItem[]>([]);
  const [loadingStoreItems, setLoadingStoreItems] = useState(false);

  // Produtos tab state
  const [allItems, setAllItems] = useState<MarketplaceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsFetched, setItemsFetched] = useState(false);

  // Cart feedback
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [cartFeedbackIsError, setCartFeedbackIsError] = useState(false);

  // Reviews modal
  const [reviewsStore, setReviewsStore] = useState<Store | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await apiClient.get("/stores/featured/");
        setStores(toArray<Store>(response.data));
      } catch {
        setStores([]);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Fetch all items when switching to "produtos" tab (lazy, once)
  useEffect(() => {
    if (tab === "produtos" && !itemsFetched) {
      setLoadingItems(true);
      apiClient
        .get("/items/public/")
        .then((res) => setAllItems(toArray<MarketplaceItem>(res.data)))
        .catch(() => setAllItems([]))
        .finally(() => {
          setLoadingItems(false);
          setItemsFetched(true);
        });
    }
  }, [tab, itemsFetched]);

  // Clear store selection and reset search when switching tabs
  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch("");
    if (t === "lojas") {
      setSelectedStoreId(null);
      setStoreItems([]);
    }
  };

  // ─── Filtered data ───────────────────────────────────────────────────────

  const filteredStores = useMemo(() => {
    if (!search.trim()) return stores;
    const term = search.toLowerCase();
    return stores.filter(
      (s) =>
        s.company_name.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term)
    );
  }, [search, stores]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems;
    const term = search.toLowerCase();
    return allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        i.company_name.toLowerCase().includes(term) ||
        (i.description || "").toLowerCase().includes(term)
    );
  }, [search, allItems]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const openStoreItems = async (store: Store) => {
    setSelectedStoreId(store.id);
    setSelectedStoreName(store.company_name);
    setLoadingStoreItems(true);
    setStoreItems([]);
    try {
      const res = await apiClient.get(`/items/public/?company_id=${store.id}`);
      setStoreItems(toArray<MarketplaceItem>(res.data));
    } catch {
      setStoreItems([]);
    } finally {
      setLoadingStoreItems(false);
    }
  };

  const addItemToCart = async (itemId: number) => {
    setAddingItemId(itemId);
    const r = await apiClient.post("/cart/", { item_id: itemId, quantity: 1 });
    if (r.error) {
      setCartFeedbackIsError(true);
      setCartFeedback((r.error as any).message || "Erro ao adicionar item.");
    } else {
      setCartFeedbackIsError(false);
      setCartFeedback("Item adicionado ao carrinho!");
    }
    setAddingItemId(null);
    setTimeout(() => { setCartFeedback(null); setCartFeedbackIsError(false); }, 3000);
  };

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (authLoading || loadingStores) return <LoadingScreen />;
  if (!user) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.company_profile?.company_name ||
    user.first_name ||
    user.username;

  const breadcrumb =
    tab === "lojas" && selectedStoreId
      ? [
          { label: "Painel", href: "/dashboard" },
          { label: "Comprar Material", href: "/materials" },
          { label: selectedStoreName },
        ]
      : [{ label: "Painel", href: "/dashboard" }, { label: "Comprar Material" }];

  const searchPlaceholder =
    tab === "lojas" ? "Buscar por loja ou categoria..." : "Buscar por produto ou loja...";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {reviewsStore && reviewsStore.company_user_id && (
        <StoreReviewsModal
          companyUserId={reviewsStore.company_user_id}
          storeName={reviewsStore.company_name}
          rating={reviewsStore.rating}
          ratingCount={reviewsStore.rating_count || 0}
          onClose={() => setReviewsStore(null)}
        />
      )}

      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} userPhoto={(user as any).profile_photo_url} />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={breadcrumb} />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comprar Material</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {tab === "lojas"
                  ? "Encontre lojas disponíveis perto de você."
                  : "Explore todos os produtos disponíveis."}
              </p>
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

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
            {(["lojas", "produtos"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "lojas" ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Lojas
                    <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {stores.length}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Produtos
                    {itemsFetched && (
                      <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                        {allItems.length}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cart feedback */}
          {cartFeedback && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                cartFeedbackIsError
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={cartFeedbackIsError ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"}
                />
              </svg>
              {cartFeedback}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full md:max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            />
          </div>

          {/* ── TAB: LOJAS ──────────────────────────────────────────────── */}
          {tab === "lojas" && (
            <>
              {filteredStores.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <EmptyState
                    title="Nenhuma loja encontrada"
                    description="Não há lojas disponíveis ou que correspondam à busca."
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
                    <StoreCard
                      key={store.id}
                      store={store}
                      selected={selectedStoreId === store.id}
                      loading={loadingStoreItems && selectedStoreId === store.id}
                      onSelect={openStoreItems}
                      onNavigate={(id) => router.push(`/stores/${id}`)}
                      onShowReviews={store.company_user_id ? () => setReviewsStore(store) : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Store items panel */}
              {selectedStoreId && (
                <section className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                      <h2 className="font-bold text-gray-900">{selectedStoreName}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Itens disponíveis</p>
                    </div>
                    <button
                      onClick={() => { setSelectedStoreId(null); setStoreItems([]); }}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {loadingStoreItems ? (
                    <LoadingScreen fullScreen={false} message="Carregando itens..." />
                  ) : storeItems.length === 0 ? (
                    <EmptyState title="Sem itens disponíveis" description="Esta loja ainda não possui produtos." />
                  ) : (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {storeItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          adding={addingItemId === item.id}
                          onAdd={addItemToCart}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {/* ── TAB: PRODUTOS ───────────────────────────────────────────── */}
          {tab === "produtos" && (
            <>
              {loadingItems ? (
                <LoadingScreen fullScreen={false} message="Carregando produtos..." />
              ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <EmptyState
                    title="Nenhum produto encontrado"
                    description="Não há produtos disponíveis ou que correspondam à busca."
                    icon={
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      showCompany
                      adding={addingItemId === item.id}
                      onAdd={addItemToCart}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StoreCardProps {
  store: Store;
  selected: boolean;
  loading: boolean;
  onSelect: (store: Store) => void;
  onNavigate?: (storeId: number) => void;
  onShowReviews?: () => void;
}

function StoreCard({ store, selected, loading, onSelect, onNavigate, onShowReviews }: StoreCardProps) {
  return (
    <article
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
        selected ? "border-orange-400 ring-2 ring-orange-200" : "border-gray-100"
      }`}
    >
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
        {store.image_url ? (
          <img src={store.image_url} alt={store.company_name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )}
        <span
          className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
            store.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
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
            </svg>
            {store.distance} km
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onShowReviews?.(); }}
            disabled={!onShowReviews}
            className="flex items-center gap-1 hover:text-orange-500 transition-colors disabled:cursor-default group"
            title="Ver avaliações"
          >
            <svg className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="group-hover:underline underline-offset-1">{store.rating} ({store.rating_count || 0})</span>
          </button>
          <span>~{store.eta_minutes || "-"} min</span>
        </div>
        <button
          onClick={() => onNavigate ? onNavigate(store.id) : onSelect(store)}
          disabled={loading}
          className="w-full bg-orange-500 text-white text-sm font-medium rounded-xl py-2.5 hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {loading ? "Carregando..." : "Ver loja"}
        </button>
      </div>
    </article>
  );
}

interface ItemCardProps {
  item: MarketplaceItem;
  adding: boolean;
  showCompany?: boolean;
  onAdd: (id: number) => void;
}

function ItemCard({ item, adding, showCompany = false, onAdd }: ItemCardProps) {
  const shippingColors: Record<string, string> = {
    leve: "bg-sky-100 text-sky-700",
    medio: "bg-blue-100 text-blue-700",
    "meio-pesado": "bg-amber-100 text-amber-700",
    pesado: "bg-red-100 text-red-700",
  };

  return (
    <article className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-orange-200 hover:shadow-sm transition-all flex flex-col">
      {item.photo_url && (
        <div className="h-28 rounded-xl overflow-hidden mb-3 bg-gray-100 -mx-0">
          <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        {(item.marca || item.peso) && (
          <p className="text-xs text-gray-400 mt-0.5">
            {item.marca}{item.marca && item.peso ? " · " : ""}{item.peso ? `${item.peso} kg` : ""}
          </p>
        )}
        {showCompany && (
          <p className="text-xs text-orange-500 font-medium mt-0.5">{item.company_name}</p>
        )}
        <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">
          {item.description || "Sem descrição"}
        </p>
        {item.shipping_type && (
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 ${
              shippingColors[item.shipping_type] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {item.shipping_type_display ?? item.shipping_type}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="font-bold text-orange-500 text-sm">
          R$ {Number(item.price).toFixed(2)}
        </span>
        <button
          onClick={() => onAdd(item.id)}
          disabled={adding}
          className="bg-orange-500 text-white text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center gap-1"
        >
          {adding ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          {adding ? "..." : "Adicionar"}
        </button>
      </div>
    </article>
  );
}
