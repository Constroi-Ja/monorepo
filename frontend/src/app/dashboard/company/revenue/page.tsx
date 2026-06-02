"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsData {
  revenue_by_day: { date: string; total: number }[];
  orders_by_status: Record<string, number>;
  top_products: { name: string; quantity: number; revenue: number }[];
}

type Period = "week" | "month" | "year";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS: { label: string; value: Period }[] = [
  { label: "Semana", value: "week" },
  { label: "Mês", value: "month" },
  { label: "Ano", value: "year" },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "#fbbf24",
  confirmado: "#60a5fa",
  enviado: "#f97316",
  entregue: "#34d399",
  cancelado: "#f87171",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(1)}k`;
  return `R$${value.toFixed(0)}`;
}

function getDateLabel(dateStr: string): string {
  // Show the last meaningful part: e.g. "2024-05-22" → "22/05", "2024-05" → "Mai"
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  if (parts.length === 2) {
    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];
    const monthIdx = parseInt(parts[1], 10) - 1;
    return monthNames[monthIdx] ?? parts[1];
  }
  return dateStr;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface LineTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function LineTooltipContent({ active, payload, label }: LineTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-orange-600 font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

interface BarTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

function BarTooltipContent({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2 truncate">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-gray-600">
          <span className="font-medium">{entry.name}: </span>
          {entry.name === "Receita" ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="w-full bg-gray-100 rounded-xl animate-pulse"
      style={{ height }}
    />
  );
}

function SummarySkeleton() {
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  loading: boolean;
}

function SummaryCard({ label, value, sub, icon, accent = "bg-orange-50 text-orange-600", loading }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <SummarySkeleton />
        ) : (
          <>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyRevenuePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("week");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch stats whenever period changes (and user is ready)
  useEffect(() => {
    if (user?.user_type === "company") {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, period]);

  const fetchStats = async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const response = await apiClient.get<StatsData>(
        `/orders/stats/?period=${period}`
      );
      setStats(response.data as unknown as StatsData);
    } catch (err) {
      console.error("Error fetching revenue stats:", err);
      setError("Erro ao carregar dados.");
    } finally {
      setLoadingStats(false);
    }
  };

  // Loading / access states
  if (authLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "company") return null;

  const userName =
    user.company_profile?.company_name || user.first_name || user.username;

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalRevenue =
    stats?.revenue_by_day.reduce((sum, d) => sum + Number(d.total), 0) ?? 0;

  const totalOrders = stats
    ? Object.values(stats.orders_by_status).reduce((sum, v) => sum + v, 0)
    : 0;

  const ordersDelivered = stats?.orders_by_status?.entregue ?? 0;

  const lineData =
    stats?.revenue_by_day.map((d) => ({
      date: getDateLabel(d.date),
      total: Number(d.total),
    })) ?? [];

  const pieData = stats
    ? Object.entries(stats.orders_by_status).map(([status, count]) => ({
        name: STATUS_LABEL[status] ?? status,
        value: count,
        color: STATUS_COLORS[status] ?? "#9ca3af",
      }))
    : [];

  const barData = stats?.top_products ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={userName}
        userInitial={userName?.charAt(0).toUpperCase()}
        userPhoto={(user as any).profile_photo_url}
      />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Painel", href: "/dashboard/company" },
              { label: "Recebimentos" },
            ]}
          />

          {/* Page header + period selector */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recebimentos</h1>
              <p className="text-sm text-gray-500 mt-1">
                Acompanhe receitas e desempenho de vendas.
              </p>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-shrink-0">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    period === p.value
                      ? "bg-orange-500 text-white shadow"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex items-center justify-between gap-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button
                onClick={fetchStats}
                className="text-sm font-semibold text-red-600 hover:text-red-700 underline underline-offset-2 flex-shrink-0"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* ── Summary cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <SummaryCard
              label="Receita Total"
              value={formatCurrency(totalRevenue)}
              sub={`no período selecionado`}
              loading={loadingStats}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              accent="bg-orange-50 text-orange-500"
            />

            <SummaryCard
              label="Total de Pedidos"
              value={String(totalOrders)}
              sub="todos os status"
              loading={loadingStats}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              accent="bg-blue-50 text-blue-500"
            />

            <SummaryCard
              label="Pedidos Entregues"
              value={String(ordersDelivered)}
              sub={
                totalOrders > 0
                  ? `${Math.round((ordersDelivered / totalOrders) * 100)}% do total`
                  : undefined
              }
              loading={loadingStats}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              accent="bg-green-50 text-green-500"
            />
          </div>

          {/* ── Line chart — Receita por Período ─────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              Receita por Período
            </h2>
            {loadingStats ? (
              <ChartSkeleton height={300} />
            ) : lineData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                Sem dados para o período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCurrencyShort}
                    width={64}
                  />
                  <Tooltip content={<LineTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#f97316" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Two-col charts ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie chart — Pedidos por Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Pedidos por Status
              </h2>
              {loadingStats ? (
                <ChartSkeleton height={300} />
              ) : pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                  Sem dados disponíveis.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value, ""]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        fontSize: "13px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                      formatter={(value: string) => (
                        <span style={{ color: "#374151" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar chart — Top Produtos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Produtos Mais Vendidos
              </h2>
              {loadingStats ? (
                <ChartSkeleton height={300} />
              ) : barData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                  Sem dados disponíveis.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={barData}
                    margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#374151" }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                      tickFormatter={(val: string) =>
                        val.length > 14 ? `${val.slice(0, 13)}…` : val
                      }
                    />
                    <Tooltip content={<BarTooltipContent />} />
                    <Bar
                      dataKey="quantity"
                      name="Quantidade"
                      fill="#f97316"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
