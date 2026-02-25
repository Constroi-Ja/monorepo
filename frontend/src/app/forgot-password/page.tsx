"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // TODO: Implementar chamada à API
      // await apiClient.post("/auth/password-reset/", { email });
      
      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Redirecionar para página de confirmação
      router.push(`/forgot-password/confirm?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Back Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-700 mb-6 hover:text-orange-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>

          {/* Logo and Header */}
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center mb-4">
              {/* Logo - Three buildings with arrow */}
              <div className="flex items-end justify-center mb-2">
                <div className="flex items-end gap-1">
                  {/* Building 1 - Smallest */}
                  <div className="w-6 h-8 bg-orange-500 rounded-t"></div>
                  {/* Building 2 - Medium */}
                  <div className="w-6 h-12 bg-orange-400 rounded-t"></div>
                  {/* Building 3 - Tallest with arrow */}
                  <div className="relative">
                    <div className="w-6 h-16 bg-orange-500 rounded-t"></div>
                    {/* Arrow */}
                    <svg
                      className="absolute -right-2 top-0 w-4 h-4 text-orange-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Brand name */}
              <h1 className="text-2xl font-bold text-orange-500 mb-1">ConstróiJá</h1>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              Digite seu email e enviaremos instruções para redefinir sua senha
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Instruções"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
