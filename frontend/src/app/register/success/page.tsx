"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function RegisterSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <Logo showTagline tagline="Cadastro realizado!" />
          </div>

          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Cadastro realizado com sucesso!
          </h1>

          <p className="text-gray-600 mb-2">
            Enviamos um email de confirmação para:
          </p>
          <p className="text-orange-500 font-semibold mb-6">{email || "seu email"}</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>Próximo passo:</strong> Acesse sua caixa de entrada e clique no link de
              confirmação que enviamos. O link expira em 7 dias.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                Ir para Login
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Voltar ao Início
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Não recebeu o email? Verifique sua pasta de spam ou{" "}
            <Link href="/forgot-password" className="text-orange-500 hover:text-orange-600">
              solicite um novo link
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
