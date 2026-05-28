"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";

interface Order {
  id: number;
  company_name?: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: { item_name?: string; quantity: number; unit_price: number }[];
}

const ALL_STATUSES = ["todos", "pendente", "confirmado", "enviado", "entregue", "cancelado"] as const;
type StatusFilter = (typeof ALL_STATUSES)[number];

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_BADGE: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  enviado: "bg-orange-100 text-orange-700",
  entregue: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function MyOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("todos");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    if (user.user_type !== "consumer" && user.user_type !== "provider") return;

    apiClient
      .get<Order[]>("/core/orders/my/")
      .then((r) => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return null;
  if (user.user_type !== "consumer" && user.user_type !== "provider") return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.first_name ||
    user.username;

  const userInitial = userName?.charAt(0).toUpperCase() ?? "U";

  const filteredOrders =
    activeFilter === "todos"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userInitial} userPhoto={(user as any).profile_photo_url} />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Painel", href: "/dashboard" },
              { label: "Meus Pedidos" },
            ]}
          />

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Acompanhe o status dos seus pedidos.
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  activeFilter === status
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                }`}
              >
                {status === "todos" ? "Todos" : STATUS_LABEL[status]}
              </button>
            ))}
          </div>

          {/* Order grid */}
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <svg
                className="w-14 h-14 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-500 text-sm font-medium">
                Nenhum pedido encontrado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Pedido #{order.id}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                        {order.company_name ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                        STATUS_BADGE[order.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-50 pt-3">
                    <span>
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {order.total_amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => router.push(`/my-orders/${order.id}`)}
                    className="mt-auto w-full text-center bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors rounded-xl py-2 text-sm font-medium"
                  >
                    Ver detalhes
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
