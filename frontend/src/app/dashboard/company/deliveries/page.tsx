"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/api-client";

export default function CompanyDeliveriesPage() {
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    avg_minutes_per_km: 4,
    display_radius_km: 20,
    opening_time: "08:00",
    closing_time: "18:00",
    base_light: 10,
    base_medium: 20,
    base_mid_heavy: 35,
    base_heavy: 50,
    threshold_light_medium: 3,
    threshold_medium_mid_heavy: 5,
    threshold_mid_heavy_heavy: 4,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.company_profile) {
      setForm((prev) => ({
        ...prev,
        avg_minutes_per_km: user.company_profile.avg_minutes_per_km || 4,
        display_radius_km: user.company_profile.display_radius_km || 20,
        opening_time: user.company_profile.opening_time || "08:00",
        closing_time: user.company_profile.closing_time || "18:00",
      }));
    }
  }, [user]);

  if (authLoading || !user || user.user_type !== "company") {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.put("/auth/profile/company/", {
        avg_minutes_per_km: form.avg_minutes_per_km,
        display_radius_km: form.display_radius_km,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        onboarding_completed: true,
      });
      await refreshUser();
      alert("Configurações de entrega salvas.");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const couriers = [
    { id: 1, name: "Marcos Silva", level: "Pesado", available: true },
    { id: 2, name: "Pedro Santos", level: "Médio", available: false },
  ];

  return (
    <div className="flex min-h-screen bg-orange-50">
      <Sidebar
        userName={user.company_profile?.company_name || user.username}
        userInitial={(user.company_profile?.company_name || user.username).charAt(0).toUpperCase()}
      />
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
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
          <button
            onClick={saveSettings}
            disabled={saving}
            className="mt-4 bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Entregadores</h2>
            <button className="bg-orange-500 text-white rounded-lg px-4 py-2">+ Adicionar Entregador</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {couriers.map((courier) => (
              <div key={courier.id} className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800">{courier.name}</h3>
                <p className="text-sm text-gray-600">{courier.level}</p>
                <p className={`text-sm mt-2 ${courier.available ? "text-green-600" : "text-red-600"}`}>
                  {courier.available ? "Disponível" : "Indisponível"}
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 border rounded-lg px-3 py-2">Editar</button>
                  <button className="border rounded-lg px-3 py-2 text-red-600">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
