"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ProgressIndicator } from "@/components/ui/ProgressIndicator";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { InfoBox } from "@/components/ui/InfoBox";
import { useMultiStepForm } from "@/hooks/useMultiStepForm";
import { formatCEP, formatCPF, formatPhone, formatDate, validateCEP, validateCPF } from "@/utils/formatters";
import { useCEP } from "@/hooks/useCEP";

interface ConsumerFormData {
  // Step 1
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2
  cep: string;
  number: string;
  city: string;
  state: string;
  // Step 3
  cpf: string;
  gender: string;
  phone: string;
  birthDate: string;
}

const initialData: ConsumerFormData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  cep: "",
  number: "",
  city: "",
  state: "",
  cpf: "",
  gender: "",
  phone: "",
  birthDate: "",
};

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
  { value: "", label: "Selecione o gênero" },
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "O", label: "Outro" },
  { value: "P", label: "Prefiro não informar" },
];

function Step1({ data, updateData, errors, setErrors }: { 
  data: ConsumerFormData; 
  updateData: (updates: Partial<ConsumerFormData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Clear password mismatch error when passwords match
    if (errors.confirmPassword && data.password === data.confirmPassword) {
      setErrors({ ...errors, confirmPassword: "" });
    }
  }, [data.password, data.confirmPassword, errors, setErrors]);

  return (
    <div className="space-y-4">
      <Input
        label="Nome Completo"
        placeholder="Seu nome completo"
        value={data.fullName}
        onChange={(e) => {
          updateData({ fullName: e.target.value });
          if (errors.fullName) setErrors({ ...errors, fullName: "" });
        }}
        error={errors.fullName}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        value={data.email}
        onChange={(e) => {
          updateData({ email: e.target.value });
          if (errors.email) setErrors({ ...errors, email: "" });
        }}
        error={errors.email}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />
      <Input
        label="Senha"
        type={showPassword ? "text" : "password"}
        placeholder="********"
        value={data.password}
        onChange={(e) => {
          updateData({ password: e.target.value });
          if (errors.password) setErrors({ ...errors, password: "" });
        }}
        error={errors.password}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        rightIcon={
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showPassword ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
              )}
            </svg>
          </button>
        }
      />
      <Input
        label="Confirmar Senha"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="********"
        value={data.confirmPassword}
        onChange={(e) => {
          updateData({ confirmPassword: e.target.value });
          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
        }}
        error={errors.confirmPassword}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        rightIcon={
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showConfirmPassword ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
              )}
            </svg>
          </button>
        }
      />
    </div>
  );
}

function Step2({ data, updateData, errors, setErrors }: { 
  data: ConsumerFormData; 
  updateData: (updates: Partial<ConsumerFormData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}) {
  const { fetchCEP, loading: cepLoading } = useCEP();

  const handleCEPChange = async (value: string) => {
    const formatted = formatCEP(value);
    updateData({ cep: formatted });
    
    if (errors.cep) setErrors({ ...errors, cep: "" });

    // Buscar CEP quando tiver 8 dígitos
    const numbers = formatted.replace(/\D/g, "");
    if (numbers.length === 8) {
      const cepData = await fetchCEP(formatted);
      if (cepData) {
        updateData({
          city: cepData.localidade,
          state: cepData.uf,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="CEP"
            placeholder="00000-000"
            value={data.cep}
            onChange={(e) => handleCEPChange(e.target.value)}
            error={errors.cep}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          {cepLoading && <p className="text-xs text-gray-500 mt-1">Buscando CEP...</p>}
        </div>
        <Input
          label="Número"
          placeholder="123"
          value={data.number}
          onChange={(e) => {
            updateData({ number: e.target.value });
            if (errors.number) setErrors({ ...errors, number: "" });
          }}
          error={errors.number}
        />
      </div>
      <Input
        label="Cidade"
        placeholder="Sua cidade"
        value={data.city}
        onChange={(e) => {
          updateData({ city: e.target.value });
          if (errors.city) setErrors({ ...errors, city: "" });
        }}
        error={errors.city}
      />
      <Select
        label="Estado"
        options={states}
        value={data.state}
        onChange={(e) => {
          updateData({ state: e.target.value });
          if (errors.state) setErrors({ ...errors, state: "" });
        }}
        error={errors.state}
      />
    </div>
  );
}

function Step3({ data, updateData, errors, setErrors }: { 
  data: ConsumerFormData; 
  updateData: (updates: Partial<ConsumerFormData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="CPF"
        placeholder="000.000.000-00"
        value={data.cpf}
        onChange={(e) => {
          const formatted = formatCPF(e.target.value);
          updateData({ cpf: formatted });
          if (errors.cpf) setErrors({ ...errors, cpf: "" });
        }}
        error={errors.cpf}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />
      <Select
        label="Gênero"
        options={genders}
        value={data.gender}
        onChange={(e) => {
          updateData({ gender: e.target.value });
          if (errors.gender) setErrors({ ...errors, gender: "" });
        }}
        error={errors.gender}
      />
      <Input
        label="Celular"
        placeholder="(00) 00000-0000"
        value={data.phone}
        onChange={(e) => {
          const formatted = formatPhone(e.target.value);
          updateData({ phone: formatted });
          if (errors.phone) setErrors({ ...errors, phone: "" });
        }}
        error={errors.phone}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        }
      />
      <Input
        label="Data de Nascimento"
        placeholder="dd/mm/aaaa"
        value={data.birthDate}
        onChange={(e) => {
          const formatted = formatDate(e.target.value);
          updateData({ birthDate: formatted });
          if (errors.birthDate) setErrors({ ...errors, birthDate: "" });
        }}
        error={errors.birthDate}
        maxLength={10}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
    </div>
  );
}

export default function ConsumerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ConsumerFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateData = (updates: Partial<ConsumerFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cep) {
      newErrors.cep = "CEP é obrigatório";
    } else if (!validateCEP(formData.cep)) {
      newErrors.cep = "CEP inválido";
    }
    
    if (!formData.number.trim()) {
      newErrors.number = "Número é obrigatório";
    }
    
    if (!formData.city.trim()) {
      newErrors.city = "Cidade é obrigatória";
    }
    
    if (!formData.state) {
      newErrors.state = "Estado é obrigatório";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cpf) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Gênero é obrigatório";
    }
    
    if (!formData.phone) {
      newErrors.phone = "Celular é obrigatório";
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const steps = [
    <Step1 key="step1" data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />,
    <Step2 key="step2" data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />,
    <Step3 key="step3" data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />,
  ];

  const { currentStepIndex, step, isFirstStep, isLastStep, next, back } = useMultiStepForm<ConsumerFormData>(
    steps,
    formData
  );

  const handleSubmit = async () => {
    // Validate current step before proceeding
    let isValid = false;
    if (currentStepIndex === 0) {
      isValid = validateStep1();
    } else if (currentStepIndex === 1) {
      isValid = validateStep2();
    } else if (currentStepIndex === 2) {
      isValid = validateStep3();
    }

    if (!isValid) {
      return;
    }

    if (!isLastStep) {
      next();
      setErrors({}); // Clear errors when moving to next step
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar chamada à API
      console.log("Form data:", formData);
      // await register(formData);
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo and Header */}
          <div className="mb-6">
            <Logo showTagline tagline="Crie sua conta" />
          </div>

          {/* Title and Progress */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Cadastro de Consumidor</h2>
            <ProgressIndicator currentStep={currentStepIndex + 1} totalSteps={3} />
          </div>

          {/* Form Step */}
          <div className="mb-6">{step}</div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {!isFirstStep && (
              <Button variant="outline" onClick={back} className="flex-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
              className={isFirstStep ? "w-full" : "flex-1"}
            >
              {isLastStep ? (
                "Criar Conta"
              ) : (
                <>
                  Próximo
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </Button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-orange-500 font-medium hover:text-orange-600">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
