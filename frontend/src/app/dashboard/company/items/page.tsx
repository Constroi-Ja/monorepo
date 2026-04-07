"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
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

const shippingTypeColors = {
  leve: "bg-blue-500",
  medio: "bg-blue-600",
  "meio-pesado": "bg-red-600",
  pesado: "bg-red-700",
};

const shippingTypeLabels = {
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
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!authLoading && user && user.user_type !== "company") {
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user && user.user_type === "company") {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Item[]>("/items/");
      if (response.data) {
        setItems(response.data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) {
      return;
    }

    try {
      await apiClient.delete(`/items/${id}/`);
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Erro ao excluir item");
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setShowEditModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user || user.user_type !== "company") {
    return null;
  }

  const userName = user.company_profile?.company_name || user.first_name || user.username;

  return (
    <div className="flex min-h-screen bg-orange-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard/company")}
              className="text-white hover:text-orange-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white text-lg">Voltar</span>
            <span className="text-white text-lg font-semibold">Conferir Itens</span>
          </div>
          <button
            onClick={handleAddNew}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Adicionar Item</span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 p-6 bg-amber-900">
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white text-lg">Nenhum item cadastrado ainda.</p>
                <button
                  onClick={handleAddNew}
                  className="mt-4 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Adicionar Primeiro Item
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-lg p-6 flex items-start justify-between hover:bg-gray-750 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {item.photo_url ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.photo_url}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-white text-lg font-semibold mb-1">{item.name}</h3>
                        <p className="text-gray-400 text-sm mb-2">{item.description || "Sem descrição"}</p>
                        <div className="flex items-center space-x-4">
                          <span className="text-orange-500 font-bold text-lg">R$ {parseFloat(item.price).toFixed(2)}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-white text-xs font-medium ${
                              shippingTypeColors[item.shipping_type] || "bg-gray-600"
                            }`}
                          >
                            {shippingTypeLabels[item.shipping_type] || item.shipping_type_display}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-pink-400 hover:text-pink-300 transition-colors"
                      aria-label="Editar item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-pink-400 hover:text-pink-300 transition-colors"
                      aria-label="Excluir item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {showEditModal && (
        <ItemEditModal
          item={editingItem}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            fetchItems();
            setShowEditModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

// Item Edit Modal Component
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

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Preço deve ser maior que zero";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("shipping_type", formData.shipping_type);
      formDataToSend.append("is_for_sale", formData.is_for_sale ? "true" : "false");
      if (formData.photo) {
        formDataToSend.append("photo", formData.photo);
      }

      if (item) {
        // Update
        await apiClient.patch(`/items/${item.id}/`, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Create
        await apiClient.post("/items/", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving item:", error);
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const newErrors: Record<string, string> = {};
        Object.keys(apiErrors).forEach((key) => {
          newErrors[key] = Array.isArray(apiErrors[key]) ? apiErrors[key][0] : apiErrors[key];
        });
        setErrors(newErrors);
      } else {
        alert("Erro ao salvar item");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-white text-xl font-semibold mb-6">{item ? "Editar Item" : "Adicionar Item"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Nome do Produto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Cimento CP II 50kg"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              placeholder="Ex: Cimento de alta qualidade para construção civil"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0.00"
            />
            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Tipo de Envio</label>
            <select
              value={formData.shipping_type}
              onChange={(e) => setFormData({ ...formData, shipping_type: e.target.value as any })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {shippingTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, photo: file });
                }
              }}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_for_sale"
              checked={formData.is_for_sale}
              onChange={(e) => setFormData({ ...formData, is_for_sale: e.target.checked })}
              className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="is_for_sale" className="ml-2 text-white text-sm">
              À venda
            </label>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
