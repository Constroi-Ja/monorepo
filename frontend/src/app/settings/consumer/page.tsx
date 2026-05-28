"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";
import { formatCEP, formatCPF, formatPhone } from "@/utils/formatters";

const states = [
  { value: "", label: "Selecione o estado" },
  { value: "AC", label: "Acre" }, { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" }, { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" }, { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" }, { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" }, { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" }, { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" }, { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" }, { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" }, { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" }, { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" }, { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" }, { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" }, { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const genders = [
  { value: "", label: "Selecione" },
  { value: "M", label: "Masculino" }, { value: "F", label: "Feminino" },
  { value: "O", label: "Outro" }, { value: "P", label: "Prefiro não informar" },
];

type Tab = "pessoal" | "endereco" | "seguranca";

const TABS: { id: Tab; label: string }[] = [
  { id: "pessoal", label: "Pessoal" },
  { id: "endereco", label: "Endereço" },
  { id: "seguranca", label: "Segurança" },
];

export default function ConsumerSettingsPage() {
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("pessoal");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    gender: "",
    phone: "",
    birth_date: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.user_type === "consumer" && user.consumer_profile) {
      const profile = user.consumer_profile;
      setFormData({
        full_name: profile.full_name || "",
        email: user.email || "",
        cpf: profile.cpf || "",
        gender: profile.gender || "",
        phone: profile.phone || "",
        birth_date: (profile as any).birth_date || "",
        cep: profile.cep || "",
        street: profile.street || "",
        number: profile.number || "",
        complement: profile.complement || "",
        city: profile.city || "",
        state: profile.state || "",
        password: "",
        confirm_password: "",
      });
      if ((user as any).profile_photo_url) setProfilePhotoPreview((user as any).profile_photo_url);
    }
  }, [user]);

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const buildPayload = (tab: Tab): FormData | Record<string, unknown> | null => {
    switch (tab) {
      case "pessoal": {
        const form = new FormData();
        form.append("full_name", formData.full_name);
        form.append("email", formData.email);
        form.append("cpf", formData.cpf.replace(/\D/g, ""));
        form.append("gender", formData.gender);
        form.append("phone", formData.phone.replace(/\D/g, ""));
        if (formData.birth_date) form.append("birth_date", formData.birth_date);
        if (profilePhotoFile) form.append("profile_photo", profilePhotoFile);
        return form;
      }
      case "endereco":
        return {
          cep: formData.cep.replace(/\D/g, ""),
          street: formData.street,
          number: formData.number,
          complement: formData.complement || null,
          city: formData.city,
          state: formData.state,
        };
      case "seguranca":
        if (!formData.password) { setErrorMessage("Digite uma nova senha."); return null; }
        if (formData.password !== formData.confirm_password) { setErrorMessage("As senhas não coincidem."); return null; }
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
      const isFormData = payload instanceof FormData;
      const response = await apiClient.put(
        "/auth/profile/consumer/",
        payload,
        isFormData ? {} : { headers: { "Content-Type": "application/json" } }
      );
      if (response.error) {
        setErrorMessage(response.error.message || "Erro ao salvar.");
      } else {
        await refreshUser();
        setSuccessMessage("Salvo com sucesso!");
        if (activeTab === "seguranca") setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
        if (activeTab === "pessoal") setProfilePhotoFile(null);
      }
    } catch {
      setErrorMessage("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || user.user_type !== "consumer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Configurações" }]} />

        <div className="mb-6">
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
          {/* ── TAB: PESSOAL ── */}
          {activeTab === "pessoal" && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Pessoais</h2>

              {/* Photo */}
              <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
                <div className="relative">
                  {profilePhotoPreview ? (
                    <img
                      src={profilePhotoPreview}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-orange-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-500">
                      {formData.full_name.charAt(0).toUpperCase() || "U"}
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
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
                  >
                    Escolher nova foto
                  </button>
                  <p className="text-xs text-gray-400 mt-1">JPG ou PNG. Máximo 5MB.</p>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nome Completo" value={formData.full_name} onChange={(e) => update("full_name", e.target.value)} />
                <Input label="Email" type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} />
                <Input label="CPF" value={formData.cpf} onChange={(e) => update("cpf", formatCPF(e.target.value))} />
                <Select label="Gênero" options={genders} value={formData.gender} onChange={(e) => update("gender", e.target.value)} />
                <Input label="Celular" value={formData.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} />
                <Input label="Data de Nascimento" type="date" value={formData.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
              </div>
            </div>
          )}

          {/* ── TAB: ENDEREÇO ── */}
          {activeTab === "endereco" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados de Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="CEP" value={formData.cep} onChange={(e) => update("cep", formatCEP(e.target.value))} />
                <Input label="Número" value={formData.number} onChange={(e) => update("number", e.target.value)} />
                <Input label="Rua" value={formData.street} onChange={(e) => update("street", e.target.value)} />
                <Input label="Complemento" value={formData.complement} onChange={(e) => update("complement", e.target.value)} />
                <Input label="Cidade" value={formData.city} onChange={(e) => update("city", e.target.value)} />
                <Select label="Estado" options={states} value={formData.state} onChange={(e) => update("state", e.target.value)} />
              </div>
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
              <p className="text-xs text-gray-400">Deixe em branco se não deseja alterar a senha.</p>
            </div>
          )}

          {/* Save */}
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
