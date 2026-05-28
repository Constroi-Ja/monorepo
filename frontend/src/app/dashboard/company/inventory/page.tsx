"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";

interface InventoryEntry {
  id: number;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  min_quantity: string | null;
  purchase_price: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

const UNIT_CHOICES = [
  { value: "un", label: "Unidade" },
  { value: "kg", label: "Kilograma" },
  { value: "L", label: "Litro" },
  { value: "m", label: "Metro" },
  { value: "m2", label: "Metro²" },
  { value: "m3", label: "Metro³" },
  { value: "cx", label: "Caixa" },
];

const EMPTY_FORM = {
  name: "",
  category: "",
  quantity: "0",
  unit: "un",
  min_quantity: "",
  purchase_price: "",
  notes: "",
};

export default function CompanyInventoryPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<InventoryEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient
      .get("/inventory/")
      .then((r) => setEntries(r.data as InventoryEntry[]))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const openCreate = () => {
    setEditEntry(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (entry: InventoryEntry) => {
    setEditEntry(entry);
    setForm({
      name: entry.name,
      category: entry.category,
      quantity: entry.quantity,
      unit: entry.unit,
      min_quantity: entry.min_quantity ?? "",
      purchase_price: entry.purchase_price ?? "",
      notes: entry.notes,
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditEntry(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      category: form.category,
      quantity: form.quantity || "0",
      unit: form.unit,
      min_quantity: form.min_quantity || null,
      purchase_price: form.purchase_price || null,
      notes: form.notes,
    };
    try {
      if (editEntry) {
        const r = await apiClient.patch(`/inventory/${editEntry.id}/`, payload);
        setEntries((prev) =>
          prev.map((e) => (e.id === editEntry.id ? (r.data as InventoryEntry) : e))
        );
      } else {
        const r = await apiClient.post("/inventory/", payload);
        setEntries((prev) =>
          [...prev, r.data as InventoryEntry].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      closeModal();
    } catch {
      setError("Erro ao salvar. Verifique os dados.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/inventory/${id}/`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirm(null);
    } catch {
      /* ignore */
    }
  };

  const adjustQty = async (entry: InventoryEntry, delta: number) => {
    const newQty = Math.max(0, Number(entry.quantity) + delta);
    try {
      const r = await apiClient.patch(`/inventory/${entry.id}/`, { quantity: String(newQty) });
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? (r.data as InventoryEntry) : e)));
    } catch {
      /* ignore */
    }
  };

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return null;

  const userName = user.company_profile?.company_name || user.first_name || user.username;
  const isLow = (entry: InventoryEntry) =>
    entry.min_quantity !== null && Number(entry.quantity) < Number(entry.min_quantity);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={userName}
        userInitial={userName?.charAt(0).toUpperCase()}
        userPhoto={(user as any).profile_photo_url}
      />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[{ label: "Painel", href: "/dashboard/company" }, { label: "Almoxarifado" }]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Almoxarifado</h1>
              <p className="text-sm text-gray-500 mt-0.5">Controle de estoque interno do comércio.</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Entrada
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <svg
                className="w-12 h-12 text-gray-200 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-400 text-sm">Nenhum item cadastrado no almoxarifado.</p>
              <button onClick={openCreate} className="mt-3 text-orange-500 text-sm underline">
                Adicionar primeiro item
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                    <th className="text-left px-5 py-3">Nome</th>
                    <th className="text-left px-3 py-3 hidden sm:table-cell">Categoria</th>
                    <th className="text-center px-3 py-3">Quantidade</th>
                    <th className="text-left px-3 py-3 hidden md:table-cell">Mínimo</th>
                    <th className="text-left px-3 py-3 hidden lg:table-cell">Preço Compra</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50/50 transition-colors ${isLow(entry) ? "bg-red-50/30" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{entry.name}</span>
                          {isLow(entry) && (
                            <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                              Abaixo do mínimo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">
                        {entry.category || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => adjustQty(entry, -1)}
                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold transition-colors"
                          >
                            ▼
                          </button>
                          <span className="w-20 text-center font-semibold text-gray-900 tabular-nums text-xs">
                            {Number(entry.quantity).toLocaleString("pt-BR")} {entry.unit}
                          </span>
                          <button
                            onClick={() => adjustQty(entry, 1)}
                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold transition-colors"
                          >
                            ▲
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-500 hidden md:table-cell">
                        {entry.min_quantity ? `${entry.min_quantity} ${entry.unit}` : "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-500 hidden lg:table-cell">
                        {entry.purchase_price
                          ? `R$ ${Number(entry.purchase_price).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          {deleteConfirm === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-xs bg-red-500 text-white rounded-lg px-2 py-1 hover:bg-red-600 transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(entry.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {editEntry ? "Editar Item" : "Nova Entrada"}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    placeholder="Ex: Cimento, Areia, Tinta..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    placeholder="Ex: Alvenaria"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  >
                    {UNIT_CHOICES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estoque mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_quantity}
                    onChange={(e) => setForm((p) => ({ ...p, min_quantity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preço de compra (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchase_price}
                    onChange={(e) => setForm((p) => ({ ...p, purchase_price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    placeholder="Opcional"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
                    placeholder="Observações internas..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
                >
                  {saving ? "Salvando..." : editEntry ? "Salvar" : "Criar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
