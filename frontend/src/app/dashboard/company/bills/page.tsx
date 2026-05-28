"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";

interface Bill {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  category: "aluguel" | "fornecedor" | "imposto" | "outros";
  paid: boolean;
  created_at: string;
}

type StatusFilter = "todas" | "pendentes" | "pagas";
type CategoryFilter = "todas" | "aluguel" | "fornecedor" | "imposto" | "outros";

interface BillFormData {
  description: string;
  amount: string;
  due_date: string;
  category: "aluguel" | "fornecedor" | "imposto" | "outros";
}

const CATEGORY_LABELS: Record<Bill["category"], string> = {
  aluguel: "Aluguel",
  fornecedor: "Fornecedor",
  imposto: "Imposto",
  outros: "Outros",
};

const CATEGORY_BADGE_CLASSES: Record<Bill["category"], string> = {
  aluguel: "bg-blue-100 text-blue-700",
  fornecedor: "bg-purple-100 text-purple-700",
  imposto: "bg-red-100 text-red-700",
  outros: "bg-gray-100 text-gray-600",
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

const EMPTY_FORM: BillFormData = {
  description: "",
  amount: "",
  due_date: "",
  category: "outros",
};

export default function BillsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [bills, setBills] = useState<Bill[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState<BillFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && user?.user_type === "company") {
      fetchBills();
    }
  }, [authLoading, user]);

  async function fetchBills() {
    setFetchLoading(true);
    const res = await apiClient.get<Bill[]>("/core/bills/");
    if (res.data) {
      setBills(res.data);
    }
    setFetchLoading(false);
  }

  if (authLoading || fetchLoading) return <LoadingScreen />;
  if (!user || user.user_type !== "company") return null;

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const userName =
    user.company_profile?.company_name || user.first_name || user.username;

  const pendingThisMonth = bills.filter(
    (b) => !b.paid && b.due_date.startsWith(currentMonth)
  );
  const pendingThisMonthTotal = pendingThisMonth.reduce(
    (sum, b) => sum + Number(b.amount),
    0
  );
  const overdueCount = bills.filter(
    (b) => !b.paid && b.due_date < today
  ).length;

  const filteredBills = bills.filter((bill) => {
    if (statusFilter === "pendentes" && bill.paid) return false;
    if (statusFilter === "pagas" && !bill.paid) return false;
    if (categoryFilter !== "todas" && bill.category !== categoryFilter)
      return false;
    return true;
  });

  function openNewModal() {
    setEditingBill(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(bill: Bill) {
    setEditingBill(bill);
    setFormData({
      description: bill.description,
      amount: String(bill.amount),
      due_date: bill.due_date,
      category: bill.category,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingBill(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSave() {
    if (!formData.description.trim()) {
      setFormError("Descrição é obrigatória.");
      return;
    }
    const parsedAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Informe um valor válido.");
      return;
    }
    if (!formData.due_date) {
      setFormError("Data de vencimento é obrigatória.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      description: formData.description.trim(),
      amount: parsedAmount,
      due_date: formData.due_date,
      category: formData.category,
    };

    if (editingBill) {
      const res = await apiClient.patch<Bill>(
        `/core/bills/${editingBill.id}/`,
        payload
      );
      if (res.data) {
        setBills((prev) =>
          prev.map((b) => (b.id === editingBill.id ? res.data! : b))
        );
        closeModal();
      } else {
        setFormError(res.error?.message || "Erro ao salvar conta.");
      }
    } else {
      const res = await apiClient.post<Bill>("/core/bills/", payload);
      if (res.data) {
        setBills((prev) => [res.data!, ...prev]);
        closeModal();
      } else {
        setFormError(res.error?.message || "Erro ao criar conta.");
      }
    }

    setSaving(false);
  }

  async function handleTogglePaid(bill: Bill) {
    const res = await apiClient.patch<Bill>(`/core/bills/${bill.id}/`, {
      paid: !bill.paid,
    });
    if (res.data) {
      setBills((prev) =>
        prev.map((b) => (b.id === bill.id ? res.data! : b))
      );
    }
  }

  async function handleDelete(bill: Bill) {
    if (
      !window.confirm(
        `Excluir a conta "${bill.description}"? Esta ação não pode ser desfeita.`
      )
    )
      return;
    const res = await apiClient.delete(`/core/bills/${bill.id}/`);
    if (!res.error) {
      setBills((prev) => prev.filter((b) => b.id !== bill.id));
    }
  }

  const isOverdue = (bill: Bill) => !bill.paid && bill.due_date < today;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={userName}
        userInitial={userName?.charAt(0).toUpperCase()}
        userPhoto={(user as any).profile_photo_url}
      />

      <div className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Painel", href: "/dashboard/company" },
              { label: "Contas a Pagar" },
            ]}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contas a Pagar
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Controle suas despesas e vencimentos
              </p>
            </div>
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nova Conta
            </button>
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Total Pendente este mês
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatBRL(pendingThisMonthTotal)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pendingThisMonth.length}{" "}
                  {pendingThisMonth.length === 1
                    ? "conta pendente"
                    : "contas pendentes"}{" "}
                  neste mês
                </p>
              </div>
              {overdueCount > 0 && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-semibold">
                    {overdueCount}{" "}
                    {overdueCount === 1 ? "conta vencida" : "contas vencidas"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              {(
                [
                  { key: "todas", label: "Todas" },
                  { key: "pendentes", label: "Pendentes" },
                  { key: "pagas", label: "Pagas" },
                ] as { key: StatusFilter; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === key
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as CategoryFilter)
              }
              className="border border-gray-200 bg-white text-sm text-gray-700 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              <option value="todas">Todas as categorias</option>
              <option value="aluguel">Aluguel</option>
              <option value="fornecedor">Fornecedor</option>
              <option value="imposto">Imposto</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* Bill list */}
          {filteredBills.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <svg
                className="w-10 h-10 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-400 text-sm">
                Nenhuma conta cadastrada.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredBills.map((bill) => {
                const overdue = isOverdue(bill);
                return (
                  <div
                    key={bill.id}
                    className={`bg-white rounded-2xl border shadow-sm flex items-center gap-4 px-5 py-4 transition-all ${
                      overdue
                        ? "border-l-4 border-red-400 border-t-gray-100 border-r-gray-100 border-b-gray-100"
                        : "border-gray-100"
                    }`}
                  >
                    {/* Paid toggle */}
                    <button
                      onClick={() => handleTogglePaid(bill)}
                      title={bill.paid ? "Marcar como pendente" : "Marcar como paga"}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        bill.paid
                          ? "bg-green-500 border-green-500"
                          : overdue
                          ? "border-red-400 hover:border-red-500"
                          : "border-gray-300 hover:border-orange-400"
                      }`}
                    >
                      {bill.paid && (
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-semibold ${
                            bill.paid ? "line-through text-gray-400" : "text-gray-800"
                          }`}
                        >
                          {bill.description}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            CATEGORY_BADGE_CLASSES[bill.category]
                          }`}
                        >
                          {CATEGORY_LABELS[bill.category]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="text-xs text-gray-500">
                          Vencimento:{" "}
                          {overdue ? (
                            <span className="text-red-500 font-semibold">
                              {formatDateBR(bill.due_date)} · Vencido
                            </span>
                          ) : (
                            <span className={bill.paid ? "text-gray-400" : "text-gray-700"}>
                              {formatDateBR(bill.due_date)}
                            </span>
                          )}
                        </span>
                        {bill.paid && (
                          <span className="text-xs text-green-600 font-medium">
                            Paga
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex-shrink-0 text-right">
                      <span
                        className={`text-base font-bold ${
                          bill.paid
                            ? "text-gray-400"
                            : overdue
                            ? "text-red-500"
                            : "text-gray-900"
                        }`}
                      >
                        {formatBRL(Number(bill.amount))}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(bill)}
                        title="Editar"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
                      <button
                        onClick={() => handleDelete(bill)}
                        title="Excluir"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingBill ? "Editar Conta" : "Nova Conta"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Ex: Aluguel do galpão"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vencimento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, due_date: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      category: e.target.value as Bill["category"],
                    }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                >
                  <option value="aluguel">Aluguel</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="imposto">Imposto</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
