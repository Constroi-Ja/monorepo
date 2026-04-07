"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/api-client";
import type { CartItem } from "@/types";

export default function CartPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  const fetchCart = async () => {
    try {
      const response = await apiClient.get<CartItem[]>("/cart/");
      setCart(response.data || []);
    } catch (error) {
      console.error(error);
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
    await apiClient.patch(`/cart/${id}/`, { quantity });
    fetchCart();
  };

  const removeItem = async (id: number) => {
    await apiClient.delete(`/cart/${id}/`);
    fetchCart();
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Carrinho</h1>
        {cart.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-gray-600">Seu carrinho está vazio.</div>
        ) : (
          <div className="space-y-3">
            {cart.map((entry) => (
              <article key={entry.id} className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-800">{entry.item.name}</h2>
                  <p className="text-sm text-gray-600">{entry.item.company_name}</p>
                  <p className="text-sm text-gray-500">R$ {entry.item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 border rounded" onClick={() => updateQuantity(entry.id, entry.quantity - 1)}>
                    -
                  </button>
                  <span className="min-w-6 text-center">{entry.quantity}</span>
                  <button className="px-2 py-1 border rounded" onClick={() => updateQuantity(entry.id, entry.quantity + 1)}>
                    +
                  </button>
                  <button className="px-3 py-1 text-red-600" onClick={() => removeItem(entry.id)}>
                    Remover
                  </button>
                </div>
              </article>
            ))}
            <div className="bg-white border rounded-xl p-4 flex justify-between font-semibold">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
