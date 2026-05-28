"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";
import { formatCEP, formatCNPJ, formatPhone } from "@/utils/formatters";

const states = [
  { value: "", label: "Selecione o estado" },
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const pixKeyTypes = [
  { value: "", label: "Selecione o tipo de chave" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Chave Aleatória" },
];

type Tab = "empresa" | "localizacao" | "recebimento" | "seguranca";

const TABS: { id: Tab; label: string }[] = [
  { id: "empresa", label: "Empresa" },
  { id: "localizacao", label: "Localização & Horários" },
  { id: "recebimento", label: "Dados de Recebimento" },
  { id: "seguranca", label: "Segurança" },
];

export default function CompanySettingsPage() {
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("empresa");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    cnpj: "",
    segment: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    opening_time: "",
    closing_time: "",
    display_radius_km: "20",
    avg_minutes_per_km: "4",
    pix_key_type: "",
    pix_key: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.user_type === "company" && user.company_profile) {
      const p = user.company_profile;
      if ((user as any).profile_photo_url) setProfilePhotoPreview((user as any).profile_photo_url);
      setFormData({
        company_name: p.company_name || "",
        email: user.email || "",
        cnpj: p.cnpj || "",
        segment: p.segment || "",
        phone: p.phone || "",
        cep: p.cep || "",
        street: p.street || "",
        number: p.number || "",
        complement: p.complement || "",
        city: p.city || "",
        state: p.state || "",
        opening_time: p.opening_time || "",
        closing_time: p.closing_time || "",
        display_radius_km: String(p.display_radius_km || 20),
        avg_minutes_per_km: String(p.avg_minutes_per_km || 4),
        pix_key_type: p.pix_key_type || "",
        pix_key: p.pix_key || "",
        password: "",
        confirm_password: "",
      });
    }
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const buildPayload = (tab: Tab) => {
    switch (tab) {
      case "empresa":
        return {
          company_name: formData.company_name,
          email: formData.email,
          cnpj: formData.cnpj.replace(/\D/g, ""),
          segment: formData.segment,
          phone: formData.phone.replace(/\D/g, ""),
        };
      case "localizacao":
        if (!formData.opening_time || !formData.closing_time) {
          setErrorMessage("Horário de abertura e fechamento são obrigatórios.");
          return null;
        }
        return {
          cep: formData.cep.replace(/\D/g, ""),
          street: formData.street,
          number: formData.number,
          complement: formData.complement || null,
          city: formData.city,
          state: formData.state,
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          display_radius_km: Number(formData.display_radius_km),
          avg_minutes_per_km: Number(formData.avg_minutes_per_km),
        };
      case "recebimento":
        if (!formData.pix_key_type || !formData.pix_key.trim()) {
          setErrorMessage("Tipo de chave PIX e a chave são obrigatórios.");
          return null;
        }
        return {
          pix_key_type: formData.pix_key_type,
          pix_key: formData.pix_key.trim(),
        };
      case "seguranca":
        if (formData.password !== formData.confirm_password) {
          setErrorMessage("As senhas não coincidem.");
          return null;
        }
        if (!formData.password) {
          setErrorMessage("Digite uma nova senha.");
          return null;
        }
        return { password: formData.password };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    setSuccessMessage("");
    setErrorMessage("");
    const payload = buildPayload(activeTab);
    if (!payload) return;

    setLoading(true);
    try {
      let response;
      if (activeTab === "empresa" && profilePhotoFile) {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v != null) form.append(k, String(v));
        });
        form.append("profile_photo", profilePhotoFile);
        response = await apiClient.put("/auth/profile/company/", form);
      } else {
        response = await apiClient.put("/auth/profile/company/", payload, {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (response.error) {
        setErrorMessage(response.error.message || "Erro ao salvar.");
      } else {
        await refreshUser();
        setSuccessMessage("Salvo com sucesso!");
        if (activeTab === "empresa") setProfilePhotoFile(null);
        if (activeTab === "seguranca") {
          setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
        }
      }
    } catch {
      setErrorMessage("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || user.user_type !== "company") {
    return <div className="min-h-screen flex items-center justify-center bg-orange-50"><div className="text-lg">Carregando...</div></div>;
  }

  return (
    <div className="min-h-screen bg-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Painel", href: "/dashboard/company" }, { label: "Configurações" }]} />

        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-800">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 border border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSuccessMessage(""); setErrorMessage(""); }}
              className={`flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 rounded-lg px-4 py-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-xl p-6 border-b-2 border-orange-500 shadow-sm">
          {/* ── TAB: EMPRESA ── */}
          {activeTab === "empresa" && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações da Empresa</h2>

              {/* Logo */}
              <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
                <div className="relative">
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="Logo da empresa" className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-semibold text-orange-600">
                      {formData.company_name.charAt(0).toUpperCase() || "E"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div>
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors">
                    Escolher nova foto
                  </button>
                  <p className="text-xs text-gray-400 mt-1">JPG ou PNG. Máximo 5MB.</p>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nome da Empresa" showRequired value={formData.company_name} onChange={(e) => update("company_name", e.target.value)} />
                <Input label="Email" type="email" showRequired value={formData.email} onChange={(e) => update("email", e.target.value)} />
                <Input label="CNPJ" showRequired value={formData.cnpj} onChange={(e) => update("cnpj", formatCNPJ(e.target.value))} />
                <Input label="Segmento" showRequired value={formData.segment} onChange={(e) => update("segment", e.target.value)} />
                <Input label="Telefone" showRequired value={formData.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} />
              </div>

            </div>
          )}

          {/* ── TAB: LOCALIZAÇÃO & HORÁRIOS ── */}
          {activeTab === "localizacao" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Localização & Horários</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="CEP" value={formData.cep} onChange={(e) => update("cep", formatCEP(e.target.value))} />
                <Input label="Número" value={formData.number} onChange={(e) => update("number", e.target.value)} />
                <Input label="Rua" value={formData.street} onChange={(e) => update("street", e.target.value)} />
                <Input label="Complemento" value={formData.complement} onChange={(e) => update("complement", e.target.value)} />
                <Input label="Cidade" value={formData.city} onChange={(e) => update("city", e.target.value)} />
                <Select label="Estado" options={states} value={formData.state} onChange={(e) => update("state", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <Input label="Horário de abertura" showRequired type="time" value={formData.opening_time} onChange={(e) => update("opening_time", e.target.value)} />
                <Input label="Horário de fechamento" showRequired type="time" value={formData.closing_time} onChange={(e) => update("closing_time", e.target.value)} />
                <Input label="Distância de exibição (km)" type="number" value={formData.display_radius_km} onChange={(e) => update("display_radius_km", e.target.value)} />
                <Input label="Tempo médio por km (min)" type="number" value={formData.avg_minutes_per_km} onChange={(e) => update("avg_minutes_per_km", e.target.value)} />
              </div>
            </div>
          )}

          {/* ── TAB: DADOS DE RECEBIMENTO ── */}
          {activeTab === "recebimento" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Dados de Recebimento</h2>
              <p className="text-sm text-gray-500 mb-4">
                Informe sua chave PIX para receber os pagamentos das vendas realizadas na plataforma.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Importante:</strong> Esses dados serão utilizados para transferência dos valores das vendas. Certifique-se de que as informações estão corretas.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Chave PIX"
                  showRequired
                  options={pixKeyTypes}
                  value={formData.pix_key_type}
                  onChange={(e) => update("pix_key_type", e.target.value)}
                />
                <Input
                  label="Chave PIX"
                  showRequired
                  value={formData.pix_key}
                  onChange={(e) => update("pix_key", e.target.value)}
                  placeholder="Digite sua chave PIX"
                />
              </div>
              {formData.pix_key_type && formData.pix_key && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800">Chave PIX configurada</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SEGURANÇA ── */}
          {activeTab === "seguranca" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Alterar Senha</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nova Senha"
                  showRequired
                  type="password"
                  value={formData.password}
                  autoComplete="new-password"
                  onChange={(e) => update("password", e.target.value)}
                />
                <Input
                  label="Confirmar Nova Senha"
                  showRequired
                  type="password"
                  value={formData.confirm_password}
                  autoComplete="new-password"
                  onChange={(e) => update("confirm_password", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Cancelar</Button>
            <Button type="button" variant="primary" disabled={loading} onClick={handleSave}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
