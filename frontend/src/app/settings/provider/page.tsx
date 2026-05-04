"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";
import { formatCEP, formatCPF, formatCNPJ, formatPhone } from "@/utils/formatters";

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
  { value: "M", label: "Masculino" }, { value: "F", label: "Feminino" },
  { value: "O", label: "Outro" }, { value: "P", label: "Prefiro não informar" },
];

const specialties = [
  { value: "eletricista", label: "Eletricista" }, { value: "pedreiro", label: "Pedreiro" },
  { value: "vidraceiro", label: "Vidraceiro" }, { value: "pintor", label: "Pintor" },
  { value: "encanador", label: "Encanador" }, { value: "carpinteiro", label: "Carpinteiro" },
  { value: "serralheiro", label: "Serralheiro" }, { value: "gesseiro", label: "Gesseiro" },
];

export default function ProviderSettingsPage() {
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [criminalRecordFile, setCriminalRecordFile] = useState<File | null>(null);
  const [criminalRecordName, setCriminalRecordName] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const criminalInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "", email: "", cpf: "", cnpj: "", gender: "", phone: "",
    specialties: [] as string[], cep: "", street: "", number: "",
    complement: "", city: "", state: "", coverage_radius_km: "50",
    password: "", confirm_password: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.user_type === "provider" && user.provider_profile) {
      const profile = user.provider_profile;
      setFormData({
        full_name: profile.full_name || "",
        email: user.email || "",
        cpf: profile.cpf || "",
        cnpj: profile.cnpj || "",
        gender: profile.gender || "",
        phone: profile.phone || "",
        specialties: profile.specialties || [],
        cep: profile.cep || "",
        street: profile.street || "",
        number: profile.number || "",
        complement: profile.complement || "",
        city: profile.city || "",
        state: profile.state || "",
        coverage_radius_km: String(profile.coverage_radius_km ?? 50),
        password: "",
        confirm_password: "",
      });
      if (user.profile_photo_url) setProfilePhotoPreview(user.profile_photo_url);
      if (profile.criminal_record_url) setCriminalRecordName("Arquivo atual");
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleCriminalRecordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCriminalRecordFile(file);
    setCriminalRecordName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirm_password) {
      showError("As senhas não coincidem");
      return;
    }
    setLoading(true);

    try {
      const form = new FormData();
      form.append("full_name", formData.full_name);
      form.append("cep", formData.cep.replace(/\D/g, ""));
      form.append("street", formData.street);
      form.append("number", formData.number);
      form.append("complement", formData.complement || "");
      form.append("city", formData.city);
      form.append("state", formData.state);
      form.append("cpf", formData.cpf.replace(/\D/g, ""));
      if (formData.cnpj) form.append("cnpj", formData.cnpj.replace(/\D/g, ""));
      form.append("gender", formData.gender);
      form.append("phone", formData.phone.replace(/\D/g, ""));
      form.append("coverage_radius_km", formData.coverage_radius_km);
      form.append("specialties", JSON.stringify(formData.specialties));
      if (formData.password) form.append("password", formData.password);
      if (profilePhotoFile) form.append("profile_photo", profilePhotoFile);
      if (criminalRecordFile) form.append("criminal_record", criminalRecordFile);
      if (formData.email) form.append("email", formData.email);

      const response = await apiClient.put("/auth/profile/provider/", form);

      if (response.error) {
        showError(response.error.message || "Erro ao atualizar perfil");
      } else {
        await refreshUser();
        showSuccess("Perfil atualizado com sucesso!");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (error) {
      showError("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || user.user_type !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Configurações" }]} />

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações do Prestador</h1>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Foto de Perfil</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Foto de perfil" className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-500">
                    {formData.full_name.charAt(0).toUpperCase() || "P"}
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
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome Completo" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <Input label="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} />
              <Input label="CNPJ (opcional)" value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })} />
              <Select label="Gênero" options={[{ value: "", label: "Selecione" }, ...genders]} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
              <Input label="Celular" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} />
              <div className="md:col-span-2">
                <MultiSelect label="Especialidades" options={specialties} selected={formData.specialties} onChange={(sel) => setFormData({ ...formData, specialties: sel })} placeholder="Selecione suas especialidades" />
              </div>
            </div>
          </div>

          {/* Coverage */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Raio de Atendimento</h2>
            <p className="text-sm text-gray-500 mb-4">Distância máxima que você atende (em quilômetros).</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range" min="5" max="200" step="5"
                  value={formData.coverage_radius_km}
                  onChange={(e) => setFormData({ ...formData, coverage_radius_km: e.target.value })}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5 km</span><span>200 km</span>
                </div>
              </div>
              <div className="w-20 flex-shrink-0">
                <Input
                  label=""
                  type="number" min="1" max="500"
                  value={formData.coverage_radius_km}
                  onChange={(e) => setFormData({ ...formData, coverage_radius_km: e.target.value })}
                />
              </div>
              <span className="text-gray-600 font-medium text-sm flex-shrink-0">km</span>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="CEP" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })} />
              <Input label="Número" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
              <Input label="Rua" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
              <Input label="Complemento" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} />
              <Input label="Cidade" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              <Select label="Estado" options={states} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </div>
          </div>

          {/* Criminal Record */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Antecedentes Criminais</h2>
            <p className="text-sm text-gray-500 mb-4">Envie seu atestado de antecedentes criminais (PDF ou imagem). Necessário para verificação.</p>
            <div
              onClick={() => criminalInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
            >
              {criminalRecordName ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">{criminalRecordName}</p>
                    <p className="text-xs text-gray-400">Clique para substituir</p>
                  </div>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Clique para enviar PDF ou imagem</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG. Máximo 10MB.</p>
                </>
              )}
            </div>
            <input ref={criminalInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleCriminalRecordChange} />
          </div>

          {/* Password */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Alterar Senha</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nova Senha" type="password" value={formData.password} autoComplete="new-password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              <Input label="Confirmar Nova Senha" type="password" value={formData.confirm_password} autoComplete="new-password" onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Deixe em branco se não deseja alterar a senha.</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading}>{loading ? "Salvando..." : "Salvar Alterações"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
