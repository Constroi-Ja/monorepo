"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { apiClient } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Link de recuperação inválido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/auth/password-reset/confirm/", {
        token,
        password,
        confirm_password: confirmPassword,
      });

      if (response.error) {
        setError(response.error.message || "Não foi possível redefinir sua senha.");
        return;
      }

      router.push("/login?password-reset=true");
    } catch {
      setError("Não foi possível redefinir sua senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8 text-center">
            <Logo showTagline tagline="Redefinir senha" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">
            Crie uma nova senha
          </h1>
          <p className="text-gray-600 text-sm text-center leading-relaxed mb-8">
            Escolha uma senha com pelo menos 8 caracteres.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Nova senha"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              label="Confirme a nova senha"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>

          <Link href="/login" className="block text-center text-sm text-orange-500 hover:text-orange-600 mt-6">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}