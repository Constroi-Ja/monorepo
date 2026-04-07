"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import { Deliverer } from "@/types";

interface DelivererFormData {
  name: string;
  level: "leve" | "medio" | "meio-pesado" | "pesado";
  phone: string;
  is_available: boolean;
}

const levelLabels: Record<string, string> = {
  leve: "Leve",
  medio: "Médio",
  "meio-pesado": "Meio-Pesado",
  pesado: "Pesado",
};

const levelOptions = [
  { value: "leve", label: "Leve" },
  { value: "medio", label: "Médio" },
  { value: "meio-pesado", label: "Meio-Pesado" },
  { value: "pesado", label: "Pesado" },
];

export default function CompanyDeliveriesPage() {
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loadingDeliverers, setLoadingDeliverers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeliverer, setEditingDeliverer] = useState<Deliverer | null>(null);
  const [form, setForm] = useState({
    avg_minutes_per_km: 4,
    display_radius_km: 20,
    opening_time: "08:00",
    closing_time: "18:00",
    base_light: 10,
    base_medium: 20,
    base_mid_heavy: 35,
    base_heavy: 50,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.company_profile) {
      setForm((prev) => ({
        ...prev,
        avg_minutes_per_km: user.company_profile!.avg_minutes_per_km || 4,
        display_radius_km: user.company_profile!.display_radius_km || 20,
        opening_time: user.company_profile!.opening_time || "08:00",
        closing_time: user.company_profile!.closing_time || "18:00",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_type === "company") {
      fetchDeliverers();
    }
  }, [user]);

  const fetchDeliverers = async () => {
    try {
      setLoadingDeliverers(true);
      const response = await apiClient.get<Deliverer[]>("/deliverers/");
      if (response.data) {
        const data = response.data as unknown as any;
        setDeliverers(Array.isArray(data) ? data : (data?.results ?? []));
      }
    } catch (error) {
      console.error("Error fetching deliverers:", error);
    } finally {
      setLoadingDeliverers(false);
    }
  };

  if (authLoading || !user || user.user_type !== "company") {
    return <LoadingScreen />;
  }

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.put("/auth/profile/company/", {
        avg_minutes_per_km: form.avg_minutes_per_km,
        display_radius_km: form.display_radius_km,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        onboarding_completed: true,
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeliverer = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este entregador?")) return;
    try {
      await apiClient.delete(`/deliverers/${id}/`);
      fetchDeliverers();
    } catch (error) {
      console.error("Error deleting deliverer:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={user.company_profile?.company_name || user.username}
        userInitial={(user.company_profile?.company_name || user.username).charAt(0).toUpperCase()}
      />
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-4xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Painel", href: "/dashboard/company" },
            { label: "Gerenciar Entregas" },
          ]}
        />
        {/* Delivery Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Gerenciar Entregas</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700">
              Horário de abertura
              <input type="time" value={form.opening_time} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Horário de fechamento
              <input type="time" value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Minutos por km
              <input type="number" value={form.avg_minutes_per_km} onChange={(e) => setForm({ ...form, avg_minutes_per_km: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Distância máxima de entrega (km)
              <input type="number" value={form.display_radius_km} onChange={(e) => setForm({ ...form, display_radius_km: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Preço base por categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700">Preço Base - Leve (R$)<input type="number" value={form.base_light} onChange={(e) => setForm({ ...form, base_light: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Preço Base - Médio (R$)<input type="number" value={form.base_medium} onChange={(e) => setForm({ ...form, base_medium: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Preço Base - Meio-Pesado (R$)<input type="number" value={form.base_mid_heavy} onChange={(e) => setForm({ ...form, base_mid_heavy: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Preço Base - Pesado (R$)<input type="number" value={form.base_heavy} onChange={(e) => setForm({ ...form, base_heavy: Number(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          </div>

          {saveSuccess && (
            <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Configurações de entrega salvas com sucesso!
            </div>
          )}

          <button
            onClick={saveSettings}
            disabled={saving}
            className="mt-4 bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        {/* Deliverers Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Entregadores</h2>
              <p className="text-xs text-gray-500 mt-0.5">{deliverers.length} cadastrado{deliverers.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => { setEditingDeliverer(null); setShowModal(true); }}
              className="flex items-center gap-1.5 bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Entregador
            </button>
          </div>

          {loadingDeliverers ? (
            <p className="text-gray-400 text-sm py-6 text-center">Carregando entregadores...</p>
          ) : deliverers.length === 0 ? (
            <EmptyState
              title="Nenhum entregador cadastrado"
              description="Adicione entregadores para gerenciar suas entregas."
              action={{ label: "Adicionar Entregador", onClick: () => { setEditingDeliverer(null); setShowModal(true); } }}
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deliverers.map((deliverer) => (
                <div
                  key={deliverer.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{deliverer.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{levelLabels[deliverer.level] || deliverer.level_display}</p>
                      {deliverer.phone && <p className="text-xs text-gray-400 mt-0.5">{deliverer.phone}</p>}
                    </div>
                    <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      deliverer.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {deliverer.is_available ? "Disponível" : "Indisponível"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setEditingDeliverer(deliverer); setShowModal(true); }}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteDeliverer(deliverer.id)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>{/* end max-w-4xl */}
      </main>

      {showModal && (
        <DelivererModal
          deliverer={editingDeliverer}
          onClose={() => { setShowModal(false); setEditingDeliverer(null); }}
          onSave={() => { fetchDeliverers(); setShowModal(false); setEditingDeliverer(null); }}
        />
      )}
    </div>
  );
}

interface DelivererModalProps {
  deliverer: Deliverer | null;
  onClose: () => void;
  onSave: () => void;
}

function DelivererModal({ deliverer, onClose, onSave }: DelivererModalProps) {
  const [formData, setFormData] = useState<DelivererFormData>({
    name: deliverer?.name || "",
    level: deliverer?.level || "medio",
    phone: deliverer?.phone || "",
    is_available: deliverer?.is_available ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: formData.name,
        level: formData.level,
        phone: formData.phone || null,
        is_available: formData.is_available,
      };
      if (deliverer) {
        await apiClient.patch(`/deliverers/${deliverer.id}/`, payload);
      } else {
        await apiClient.post("/deliverers/", payload);
      }
      onSave();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar entregador. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {deliverer ? "Editar Entregador" : "Adicionar Entregador"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nome do entregador"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as DelivererFormData["level"] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {levelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="is_available" className="text-sm text-gray-700">Disponível</label>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
