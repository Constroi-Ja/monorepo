"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiClient } from "@/lib/api-client";

const pixKeyTypes = [
  { value: "", label: "Selecione o tipo de chave" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Chave Aleatória" },
];

interface Props {
  onComplete: () => void;
}

export function CompanyOnboardingModal({ onComplete }: Props) {
  const [formData, setFormData] = useState({
    opening_time: "",
    closing_time: "",
    pix_key_type: "",
    pix_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isComplete =
    formData.opening_time &&
    formData.closing_time &&
    formData.pix_key_type &&
    formData.pix_key.trim();

  const handleSubmit = async () => {
    if (!isComplete) return;
    setError("");
    setLoading(true);
    try {
      const response = await apiClient.put(
        "/auth/profile/company/",
        {
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          pix_key_type: formData.pix_key_type,
          pix_key: formData.pix_key.trim(),
          onboarding_completed: true,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.error) {
        setError(response.error.message || "Erro ao salvar. Tente novamente.");
      } else {
        onComplete();
      }
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-orange-500 rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Finalize seu cadastro</h2>
              <p className="text-sm text-white/80">Informações obrigatórias para começar a vender</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Horários */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Horário de Funcionamento
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Abertura"
                showRequired
                type="time"
                value={formData.opening_time}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
              />
              <Input
                label="Fechamento"
                showRequired
                type="time"
                value={formData.closing_time}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
              />
            </div>
          </div>

          {/* PIX */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Dados de Recebimento (PIX)
            </h3>
            <div className="space-y-3">
              <Select
                label="Tipo de Chave PIX"
                showRequired
                options={pixKeyTypes}
                value={formData.pix_key_type}
                onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value })}
              />
              <Input
                label="Chave PIX"
                showRequired
                value={formData.pix_key}
                onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                placeholder="Digite sua chave PIX"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            <span className="text-red-500">*</span> Todos os campos são obrigatórios para continuar.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={!isComplete || loading}
            onClick={handleSubmit}
          >
            {loading ? "Salvando..." : "Concluir Cadastro"}
          </Button>
        </div>
      </div>
    </div>
  );
}
