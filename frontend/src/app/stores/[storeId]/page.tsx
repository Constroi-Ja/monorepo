"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";

interface StoreItem {
  id: number;
  name: string;
  marca?: string;
  peso?: number | null;
  description: string;
  price: string;
  shipping_type_display?: string;
  photo_url?: string | null;
}

interface StoreDetail {
  id: number;
  company_name: string;
  category: string;
  phone: string;
  address: string;
  distance: number;
  rating: number;
  rating_count: number;
  is_open: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
  image_url?: string | null;
  items: StoreItem[];
}

const shippingColors: Record<string, string> = {
  leve: "bg-sky-100 text-sky-700",
  medio: "bg-blue-100 text-blue-700",
  "meio-pesado": "bg-amber-100 text-amber-700",
  pesado: "bg-red-100 text-red-700",
};

export default function StoreProfilePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ storeId: string }>();

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !params.storeId) return;
    apiClient
      .get(`/stores/${params.storeId}/`)
      .then((r) => setStore(r.data as StoreDetail))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated, params.storeId]);

  const addToCart = async (itemId: number) => {
    setAddingItemId(itemId);
    try {
      await apiClient.post("/cart/", { item_id: itemId, quantity: 1 });
      setCartFeedback("Item adicionado ao carrinho!");
    } catch {
      setCartFeedback("Erro ao adicionar item.");
    } finally {
      setAddingItemId(null);
      setTimeout(() => setCartFeedback(null), 2500);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Loja não encontrada.</p>
          <button onClick={() => router.back()} className="text-orange-500 underline text-sm">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="relative h-48 bg-gradient-to-br from-orange-400 to-amber-500">
        {store.image_url && (
          <img src={store.image_url} alt={store.company_name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => router.push("/cart")}
          className="absolute top-4 right-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
      </div>

      {/* Store info card */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 -mt-8 relative z-10 p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{store.company_name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{store.category}</p>
            </div>
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${store.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {store.is_open ? "Aberta" : "Fechada"}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {store.rating} ({store.rating_count} avaliações)
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {store.distance} km de distância
            </span>
            {(store.opening_time || store.closing_time) && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {store.opening_time ? store.opening_time.slice(0, 5) : "?"} – {store.closing_time ? store.closing_time.slice(0, 5) : "?"}
              </span>
            )}
            {store.address && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {store.address}
              </span>
            )}
          </div>
        </div>

        {/* Cart feedback */}
        {cartFeedback && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${cartFeedback.startsWith("Erro") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cartFeedback.startsWith("Erro") ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"} />
            </svg>
            {cartFeedback}
          </div>
        )}

        {/* Products */}
        <h2 className="text-base font-bold text-gray-900 mb-3">
          Produtos disponíveis
          <span className="ml-2 text-sm font-normal text-gray-400">({store.items.length})</span>
        </h2>

        {store.items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm mb-8">
            Esta loja ainda não possui produtos cadastrados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
            {store.items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col hover:border-orange-200 hover:shadow-md transition-all">
                {item.photo_url && (
                  <div className="h-32 rounded-xl overflow-hidden mb-3 bg-gray-100">
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
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{item.description}</p>
                  )}
                  {item.shipping_type_display && (
                    <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${shippingColors[item.shipping_type_display?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                      {item.shipping_type_display}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="font-bold text-orange-500">R$ {Number(item.price).toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(item.id)}
                    disabled={addingItemId === item.id}
                    className="bg-orange-500 text-white text-xs font-medium rounded-xl px-3 py-2 hover:bg-orange-600 disabled:opacity-60 transition-colors"
                  >
                    {addingItemId === item.id ? "..." : "+ Carrinho"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
