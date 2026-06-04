"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

function ForgotPasswordConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo and Header */}
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center">
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
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Email Enviado!
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Enviamos as instruções para redefinir sua senha
            </p>
            {email && (
              <p className="text-gray-600 text-sm mt-1">
                para <span className="text-orange-500 font-medium">{email}</span>
              </p>
            )}
          </div>

          {/* Back to Login Button */}
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Voltar ao Login
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordConfirmContent />
    </Suspense>
  );
}
