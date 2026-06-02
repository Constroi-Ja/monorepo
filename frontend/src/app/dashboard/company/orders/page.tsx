"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  item_name?: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  buyer_name?: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Pendente", value: "pendente" },
  { label: "Confirmado", value: "confirmado" },
  { label: "Enviado", value: "enviado" },
  { label: "Entregue", value: "entregue" },
  { label: "Cancelado", value: "cancelado" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

const STATUS_BADGE: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  enviado: "bg-orange-100 text-orange-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        STATUS_BADGE[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

interface OrderCardProps {
  order: Order;
  onAdvanceStatus: (orderId: number, nextStatus: string) => Promise<void>;
  advancing: boolean;
}

function OrderCard({ order, onAdvanceStatus, advancing }: OrderCardProps) {
  const itemsSummary = order.items?.slice(0, 2) ?? [];
  const extraItems = (order.items?.length ?? 0) - 2;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-gray-900">
              Pedido #{order.id}
            </span>
            <StatusBadge status={order.status} />
          </div>
          {order.buyer_name && (
            <p className="text-sm text-gray-600 mt-0.5 truncate">
              Comprador:{" "}
              <span className="font-medium text-gray-800">
                {order.buyer_name}
              </span>
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(order.created_at)}
          </p>
        </div>

        <p className="text-lg font-bold text-gray-900 shrink-0">
          {formatCurrency(Number(order.total_amount))}
        </p>
      </div>

      {/* Items summary */}
      {itemsSummary.length > 0 && (
        <div className="mt-3 space-y-1">
          {itemsSummary.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs text-gray-500"
            >
              <span className="truncate max-w-[60%]">
                {item.item_name ?? "Item"} &times; {item.quantity}
              </span>
              <span>{formatCurrency(Number(item.unit_price))}</span>
            </div>
          ))}
          {extraItems > 0 && (
            <p className="text-xs text-gray-400">
              +{extraItems} outro{extraItems > 1 ? "s" : ""} ite
              {extraItems > 1 ? "ns" : "m"}
            </p>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {/* Advance-status buttons */}
        {order.status === "pendente" && (
          <button
            onClick={() => onAdvanceStatus(order.id, "confirmado")}
            disabled={advancing}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {advancing ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            Confirmar Pedido
          </button>
        )}

        {order.status === "confirmado" && (
          <button
            onClick={() => onAdvanceStatus(order.id, "enviado")}
            disabled={advancing}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {advancing ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"
                />
              </svg>
            )}
            Marcar como Enviado
          </button>
        )}

        {/* Detail / Chat link — always visible */}
        <Link
          href={`/my-orders/${order.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 underline underline-offset-2 transition-colors ml-auto"
        >
          Ver detalhes / Chat
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [advancingId, setAdvancingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch orders on mount (and whenever user is ready)
  useEffect(() => {
    if (user?.user_type === "company") {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const response = await apiClient.get<Order[]>("/orders/company/");
      const data = response.data as unknown as Order[] | { results: Order[] };
      setOrders(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (err) {
      console.error("Error fetching company orders:", err);
      setError("Não foi possível carregar os pedidos. Tente novamente.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAdvanceStatus = async (orderId: number, nextStatus: string) => {
    setAdvancingId(orderId);
    try {
      const response = await apiClient.patch<Order>(
        `/orders/${orderId}/status/`,
        { status: nextStatus }
      );
      const updated = response.data as unknown as Order;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: updated?.status ?? nextStatus } : o
        )
      );
    } catch (err) {
      console.error("Error advancing order status:", err);
    } finally {
      setAdvancingId(null);
    }
  };

  // Loading / access states
  if (authLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "company") return null;

  const userName =
    user.company_profile?.company_name || user.first_name || user.username;

  const filteredOrders =
    activeFilter === "all"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={userName}
        userInitial={userName?.charAt(0).toUpperCase()}
        userPhoto={(user as any).profile_photo_url}
      />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Painel", href: "/dashboard/company" },
              { label: "Pedidos" },
            ]}
          />

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Pedidos Recebidos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie e acompanhe os pedidos dos seus clientes.
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {FILTERS.map((f) => {
              const count =
                f.value === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === f.value).length;
              const isActive = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  {f.label}
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? "bg-white text-gray-900"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          {loadingOrders ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button
                onClick={fetchOrders}
                className="mt-3 text-sm text-red-600 underline hover:text-red-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              </div>
              <p className="text-gray-500 text-sm">
                Nenhum pedido recebido ainda.
              </p>
              {activeFilter !== "all" && (
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-2 text-sm text-orange-500 hover:text-orange-600 underline"
                >
                  Ver todos os pedidos
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAdvanceStatus={handleAdvanceStatus}
                  advancing={advancingId === order.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
