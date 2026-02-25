"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

type UserType = "consumer" | "provider" | "company";

export default function SelectUserTypePage() {
  const router = useRouter();

  const handleSelectType = (type: UserType) => {
    router.push(`/register/${type}`);
  };

  const userTypes = [
    {
      type: "consumer" as UserType,
      title: "Consumidor",
      description: "Compre materiais e contrate prestadores",
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      type: "provider" as UserType,
      title: "Prestador",
      description: "Ofereça seus serviços profissionais",
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      type: "company" as UserType,
      title: "Empresa",
      description: "Venda materiais de construção",
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo and Header */}
          <div className="mb-8">
            <Logo showTagline tagline="Crie sua conta" />
          </div>

          {/* Instruction */}
          <p className="text-center text-gray-700 mb-8">
            Selecione o tipo de usuário:
          </p>

          {/* User Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {userTypes.map((userType) => (
              <button
                key={userType.type}
                onClick={() => handleSelectType(userType.type)}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-500 hover:shadow-md transition-all text-left"
              >
                <div className="text-orange-500 mb-4">{userType.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {userType.title}
                </h3>
                <p className="text-sm text-gray-600">{userType.description}</p>
              </button>
            ))}
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-orange-500 font-medium hover:text-orange-600"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
