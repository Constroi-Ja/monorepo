"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import type { CartItem } from "@/types";

export default function CartPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchCart = async () => {
    try {
      const response = await apiClient.get("/cart/");
      const data = response.data as unknown as any;
      setCart(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const total = useMemo(() => cart.reduce((acc, item) => acc + Number(item.total || 0), 0), [cart]);

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingId(id);
    try {
      await apiClient.patch(`/cart/${id}/`, { quantity });
      await fetchCart();
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (id: number) => {
    setUpdatingId(id);
    try {
      await apiClient.delete(`/cart/${id}/`);
      await fetchCart();
    } finally {
      setUpdatingId(null);
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} userPhoto={(user as any).profile_photo_url} />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-2xl mx-auto">
          <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Carrinho" }]} />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Carrinho</h1>
              <p className="text-sm text-gray-500 mt-0.5">{cart.length} {cart.length === 1 ? "item" : "itens"}</p>
            </div>
            <button
              onClick={() => router.push("/materials")}
              className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
            >
              + Adicionar itens
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                title="Carrinho vazio"
                description="Adicione itens de lojas para vê-los aqui."
                action={{ label: "Comprar Material", onClick: () => router.push("/materials") }}
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((entry) => (
                <article
                  key={entry.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-opacity ${
                    updatingId === entry.id ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 text-sm">{entry.item.name}</h2>
                      {(entry.item.marca || entry.item.peso) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {entry.item.marca}{entry.item.marca && entry.item.peso ? " · " : ""}{entry.item.peso ? `${entry.item.peso} kg` : ""}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{entry.item.company_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">R$ {Number(entry.item.price).toFixed(2)} / un</p>
                    </div>
                    <p className="font-bold text-orange-500 text-sm flex-shrink-0">
                      R$ {Number(entry.total || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(entry.id, entry.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-800">{entry.quantity}</span>
                      <button
                        onClick={() => updateQuantity(entry.id, entry.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(entry.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remover
                    </button>
                  </div>
                </article>
              ))}

              {/* Order summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-2">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Subtotal ({cart.length} {cart.length === 1 ? "item" : "itens"})</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full mt-4 bg-orange-500 text-white rounded-xl py-3 font-semibold text-sm hover:bg-orange-600 transition-colors"
                >
                  Finalizar Pedido
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
