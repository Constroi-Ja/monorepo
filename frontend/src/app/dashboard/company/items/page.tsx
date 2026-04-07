"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";

interface Item {
  id: number;
  name: string;
  description: string;
  price: string;
  shipping_type: "leve" | "medio" | "meio-pesado" | "pesado";
  shipping_type_display: string;
  photo_url: string | null;
  is_for_sale: boolean;
  created_at: string;
  updated_at: string;
}

const shippingTypeColors: Record<string, string> = {
  leve: "bg-sky-100 text-sky-700",
  medio: "bg-blue-100 text-blue-700",
  "meio-pesado": "bg-amber-100 text-amber-700",
  pesado: "bg-red-100 text-red-700",
};

const shippingTypeLabels: Record<string, string> = {
  leve: "Leve",
  medio: "Médio",
  "meio-pesado": "Meio-Pesado",
  pesado: "Pesado",
};

export default function CompanyItemsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
    else if (!authLoading && user && user.user_type !== "company") router.push("/dashboard");
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user && user.user_type === "company") fetchItems();
  }, [user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/items/");
      const data = response.data as unknown as any;
      setItems(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    try {
      await apiClient.delete(`/items/${id}/`);
      fetchItems();
    } catch {
      alert("Erro ao excluir item");
    }
  };

  if (authLoading || loading) return <LoadingScreen />;
  if (!user || user.user_type !== "company") return null;

  const userName = user.company_profile?.company_name || user.first_name || user.username;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />

      <div className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Painel", href: "/dashboard/company" },
              { label: "Conferir Itens" },
            ]}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conferir Itens</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {items.length} {items.length === 1 ? "produto cadastrado" : "produtos cadastrados"}
              </p>
            </div>
            <button
              onClick={() => { setEditingItem(null); setShowEditModal(true); }}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Item
            </button>
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                title="Nenhum item cadastrado"
                description="Adicione seus primeiros produtos para que clientes possam comprá-los."
                action={{ label: "Adicionar Primeiro Item", onClick: () => { setEditingItem(null); setShowEditModal(true); } }}
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-orange-200 hover:shadow transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {item.photo_url ? (
                      <Image src={item.photo_url} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${shippingTypeColors[item.shipping_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {shippingTypeLabels[item.shipping_type] ?? item.shipping_type_display}
                      </span>
                      {!item.is_for_sale && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Fora de venda</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description || "Sem descrição"}</p>
                    <p className="text-sm font-bold text-orange-500 mt-1">R$ {parseFloat(item.price).toFixed(2)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => { setEditingItem(item); setShowEditModal(true); }}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      aria-label="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <ItemEditModal
          item={editingItem}
          onClose={() => { setShowEditModal(false); setEditingItem(null); }}
          onSave={() => { fetchItems(); setShowEditModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

// ─── Item Edit Modal ────────────────────────────────────────────────────────

interface ItemEditModalProps {
  item: Item | null;
  onClose: () => void;
  onSave: () => void;
}

function ItemEditModal({ item, onClose, onSave }: ItemEditModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    shipping_type: item?.shipping_type || "medio",
    photo: null as File | null,
    is_for_sale: item?.is_for_sale ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shippingTypeOptions = [
    { value: "leve", label: "Leve" },
    { value: "medio", label: "Médio" },
    { value: "meio-pesado", label: "Meio-Pesado" },
    { value: "pesado", label: "Pesado" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Preço deve ser maior que zero";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("description", formData.description);
      fd.append("price", formData.price);
      fd.append("shipping_type", formData.shipping_type);
      fd.append("is_for_sale", formData.is_for_sale ? "true" : "false");
      if (formData.photo) fd.append("photo", formData.photo);

      const opts = { headers: { "Content-Type": "multipart/form-data" } };
      if (item) {
        await apiClient.patch(`/items/${item.id}/`, fd, opts);
      } else {
        await apiClient.post("/items/", fd, opts);
      }
      onSave();
    } catch (error: any) {
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const mapped: Record<string, string> = {};
        Object.keys(apiErrors).forEach((k) => {
          mapped[k] = Array.isArray(apiErrors[k]) ? apiErrors[k][0] : apiErrors[k];
        });
        setErrors(mapped);
      } else {
        setErrors({ form: "Erro ao salvar item. Tente novamente." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{item ? "Editar Item" : "Adicionar Item"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors.form}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              placeholder="Ex: Cimento CP II 50kg"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 h-20 resize-none"
              placeholder="Descreva o produto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0,00"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Envio</label>
              <select
                value={formData.shipping_type}
                onChange={(e) => setFormData({ ...formData, shipping_type: e.target.value as any })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {shippingTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, photo: f }); }}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_for_sale"
              checked={formData.is_for_sale}
              onChange={(e) => setFormData({ ...formData, is_for_sale: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-400"
            />
            <label htmlFor="is_for_sale" className="text-sm text-gray-700">À venda</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
