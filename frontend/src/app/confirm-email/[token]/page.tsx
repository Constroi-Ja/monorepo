"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";

type Status = "loading" | "success" | "error";

export default function ConfirmEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasConfirmed = useRef(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage("Token inválido");
      setStatus("error");
      return;
    }
    if (hasConfirmed.current) return;
    hasConfirmed.current = true;
    confirmEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const confirmEmail = async () => {
    try {
      const response = await apiClient.post("/auth/confirm-email/", {
        token: token,
      });

      if (response.error) {
        setErrorMessage(response.error.message || "Erro ao confirmar email");
        setStatus("error");
      } else {
        setStatus("success");
        setTimeout(() => {
          router.push("/login?confirmed=true");
        }, 3000);
      }
    } catch (error) {
      console.error("Error confirming email:", error);
      setErrorMessage("Erro ao confirmar email. Tente novamente.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <Logo showTagline tagline="Confirmando email" />
          </div>

          {status === "loading" && (
            <>
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600">Confirmando seu email...</p>
            </>
          )}

          {status === "success" && (
            <>
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
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Email confirmado com sucesso!
              </h1>
              <p className="text-gray-600 mb-6">
                Você será redirecionado para a página de login em instantes...
              </p>
              <Link href="/login" className="block">
                <Button variant="primary" className="w-full">
                  Ir para Login
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-red-500"
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
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Erro ao confirmar email
              </h1>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
              <div className="space-y-3">
                <Link href="/login" className="block">
                  <Button variant="primary" className="w-full">
                    Ir para Login
                  </Button>
                </Link>
                <Link href="/forgot-password" className="block">
                  <Button variant="outline" className="w-full">
                    Solicitar novo link
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
