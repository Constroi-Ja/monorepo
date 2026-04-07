"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { apiClient } from "@/lib/api-client";
import { formatCEP, formatCPF, formatCNPJ, formatPhone } from "@/utils/formatters";

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

const genders = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "O", label: "Outro" },
  { value: "P", label: "Prefiro não informar" },
];

const specialties = [
  { value: "eletricista", label: "Eletricista" },
  { value: "pedreiro", label: "Pedreiro" },
  { value: "vidraceiro", label: "Vidraceiro" },
  { value: "pintor", label: "Pintor" },
  { value: "encanador", label: "Encanador" },
  { value: "carpinteiro", label: "Carpinteiro" },
  { value: "serralheiro", label: "Serralheiro" },
  { value: "gesseiro", label: "Gesseiro" },
];

export default function ProviderSettingsPage() {
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    cnpj: "",
    gender: "",
    phone: "",
    specialties: [] as string[],
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
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
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
        password: "",
        confirm_password: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        full_name: formData.full_name,
        cep: formData.cep.replace(/\D/g, ""),
        street: formData.street,
        number: formData.number,
        complement: formData.complement || null,
        city: formData.city,
        state: formData.state,
        cpf: formData.cpf.replace(/\D/g, ""),
        cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, "") : null,
        gender: formData.gender,
        phone: formData.phone.replace(/\D/g, ""),
        specialties: formData.specialties,
      };

      if (formData.password) {
        if (formData.password !== formData.confirm_password) {
          alert("As senhas não coincidem");
          setLoading(false);
          return;
        }
        updateData.password = formData.password;
      }

      const response = await apiClient.put("/auth/profile/provider/", updateData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.error) {
        alert(response.error.message || "Erro ao atualizar perfil");
      } else {
        await refreshUser();
        alert("Perfil atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || user.user_type !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-800 mb-2">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Current Plan */}
          <div className="bg-white rounded-xl p-6 border-b-2 border-orange-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Plano Atual</h2>
            <div className="flex items-center justify-between">
              <button type="button" className="px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Plano Gratuito</span>
              </button>
              <Button type="button" variant="primary" onClick={() => router.push("/settings?tab=plan")}>
                Fazer Upgrade
              </Button>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="bg-white rounded-xl p-6 border-b-2 border-orange-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Foto de Perfil</h2>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-semibold text-gray-600">
                {formData.full_name.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <Button type="button" variant="outline">Escolher nova foto</Button>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG ou GIF. Máximo 5MB.</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl p-6 border-b-2 border-orange-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
              <Input
                label="CPF"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              />
              <Input
                label="CNPJ (opcional)"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              />
              <Select
                label="Gênero"
                options={[{ value: "", label: "Selecione" }, ...genders]}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              />
              <Input
                label="Celular"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              />
              <div className="md:col-span-2">
                <MultiSelect
                  label="Especialidades"
                  options={specialties}
                  selected={formData.specialties}
                  onChange={(selected) => setFormData({ ...formData, specialties: selected })}
                  placeholder="Selecione suas especialidades"
                />
              </div>
            </div>
          </div>

          {/* Address Data */}
          <div className="bg-white rounded-xl p-6 border-b-2 border-orange-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados de Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="CEP" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
              <Input label="Número" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
              <Input label="Rua" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
              <Input label="Complemento" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} />
              <Input label="Cidade" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              <Select label="Estado" options={states} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl p-6 border-b-2 border-orange-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Alterar Senha</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nova Senha" type="password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
              <Input label="Confirmar Nova Senha" type="password" value={formData.confirm_password} onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
            </div>
            <p className="text-sm text-gray-500 mt-2">Deixe em branco se não deseja alterar a senha</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading}>{loading ? "Salvando..." : "Salvar Alterações"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
