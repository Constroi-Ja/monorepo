"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";
import type { CartItem } from "@/types";

type PaymentMethod = "pix" | "card";
type CheckoutStep = "review" | "payment" | "success";

interface PixResult {
  payment_id: number;
  mp_payment_id: string;
  qr_code_base64: string;
  qr_code_text: string;
  amount: string;
}

interface CardResult {
  payment_id: number;
  mp_payment_id: string;
  status: string;
  amount: string;
}

export default function CheckoutPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>("review");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [pixResult, setPixResult] = useState<PixResult | null>(null);
  const [cardResult, setCardResult] = useState<CardResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Payer form
  const [payer, setPayer] = useState({
    email: "", first_name: "", last_name: "", cpf: "",
  });

  // Card form (manual, no MP.js yet — user fills token later via Bricks)
  const [card, setCard] = useState({
    token: "", payment_method_id: "visa", installments: 1,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      const profile = user.consumer_profile || user.provider_profile;
      setPayer((prev) => ({
        ...prev,
        email: user.email || "",
        first_name: user.first_name || (profile?.full_name?.split(" ")[0] ?? ""),
        last_name: user.last_name || (profile?.full_name?.split(" ").slice(1).join(" ") ?? ""),
        cpf: profile?.cpf || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get("/cart/").then((r) => {
        const data = r.data as any;
        setCart(Array.isArray(data) ? data : (data?.results ?? []));
      }).finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const total = useMemo(() => cart.reduce((acc, i) => acc + Number(i.total || 0), 0), [cart]);

  const handlePixPayment = async () => {
    setProcessing(true);
    setError("");
    try {
      const r = await apiClient.post<PixResult>("/payments/pix/", {
        amount: total.toFixed(2),
        description: `Pedido ConstróiJá (${cart.length} item${cart.length !== 1 ? "s" : ""})`,
        payer_email: payer.email,
        payer_first_name: payer.first_name,
        payer_last_name: payer.last_name,
        payer_cpf: payer.cpf.replace(/\D/g, ""),
      });
      if (r.data) {
        setPixResult(r.data);
        setStep("success");
      } else {
        setError("Erro ao gerar PIX. Tente novamente.");
      }
    } catch (e: any) {
      setError(e?.message || "Erro ao processar pagamento.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!card.token) {
      setError("Token do cartão é obrigatório. Use o SDK do Mercado Pago para gerar o token.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const r = await apiClient.post<CardResult>("/payments/card/", {
        amount: total.toFixed(2),
        description: `Pedido ConstróiJá`,
        token: card.token,
        installments: card.installments,
        payment_method_id: card.payment_method_id,
        payer_email: payer.email,
        payer_cpf: payer.cpf.replace(/\D/g, ""),
      });
      if (r.data) {
        setCardResult(r.data);
        setStep("success");
      }
    } catch (e: any) {
      setError(e?.message || "Pagamento recusado. Verifique os dados.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPix = () => {
    if (pixResult?.qr_code_text) {
      navigator.clipboard.writeText(pixResult.qr_code_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.company_profile?.company_name ||
    user.first_name ||
    user.username;

  // ── Success screen ──
  if (step === "success") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />
        <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 flex items-center justify-center">
          <div className="max-w-md w-full">
            {pixResult ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">PIX gerado!</h2>
                <p className="text-gray-500 text-sm mb-6">Escaneie o QR Code ou copie o código para pagar.</p>

                {pixResult.qr_code_base64 && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={`data:image/png;base64,${pixResult.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 rounded-xl border border-gray-100"
                    />
                  </div>
                )}

                <p className="text-lg font-bold text-orange-500 mb-4">R$ {Number(pixResult.amount).toFixed(2)}</p>

                {pixResult.qr_code_text && (
                  <div className="mb-4">
                    <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 break-all font-mono mb-2 text-left">
                      {pixResult.qr_code_text}
                    </div>
                    <button
                      onClick={handleCopyPix}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${copied ? "bg-green-500 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                    >
                      {copied ? "Copiado!" : "Copiar código PIX"}
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-4">O pagamento será confirmado automaticamente após o PIX ser processado.</p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Ir para o painel
                </button>
              </div>
            ) : cardResult ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cardResult.status === "approved" ? "bg-green-100" : "bg-amber-100"}`}>
                  {cardResult.status === "approved" ? (
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {cardResult.status === "approved" ? "Pagamento aprovado!" : "Pagamento em processamento"}
                </h2>
                <p className="text-lg font-bold text-orange-500 mb-4">R$ {Number(cardResult.amount).toFixed(2)}</p>
                <p className="text-sm text-gray-500 mb-6">
                  {cardResult.status === "approved"
                    ? "Seu pedido foi confirmado."
                    : "Aguardando confirmação da operadora."}
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
                >
                  Ir para o painel
                </button>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  // ── Review step ──
  if (step === "review") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />
        <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
          <div className="max-w-xl mx-auto">
            <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Carrinho", href: "/cart" }, { label: "Checkout" }]} />
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Revisar Pedido</h1>

            {cart.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
                Seu carrinho está vazio.{" "}
                <button onClick={() => router.push("/materials")} className="text-orange-500 underline">Comprar</button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-4">
                  {cart.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{entry.item.name}</p>
                        <p className="text-xs text-gray-400">{entry.item.company_name} · {entry.quantity}x R$ {Number(entry.item.price).toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-orange-500 text-sm flex-shrink-0">
                        R$ {Number(entry.total).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className="p-4 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-500">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("payment")}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors"
                >
                  Continuar para pagamento
                </button>
                <button onClick={() => router.push("/cart")} className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Voltar ao carrinho
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Payment step ──
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-xl mx-auto">
          <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Carrinho", href: "/cart" }, { label: "Checkout" }]} />
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Pagamento</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {/* Order summary mini */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
              <p className="font-bold text-gray-900">R$ {total.toFixed(2)}</p>
            </div>
            <button onClick={() => setStep("review")} className="text-xs text-orange-500 hover:text-orange-600 underline">
              Editar
            </button>
          </div>

          {/* Payer info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-4">Dados do pagador</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Nome", key: "first_name", type: "text" },
                { label: "Sobrenome", key: "last_name", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "CPF", key: "cpf", type: "text", placeholder: "000.000.000-00" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(payer as any)[key]}
                    onChange={(e) => setPayer((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Method selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-4">Método de pagamento</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["pix", "card"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${method === m ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}
                >
                  {m === "pix" ? (
                    <>
                      <svg className={`w-8 h-8 ${method === "pix" ? "text-orange-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span className={`text-sm font-medium ${method === "pix" ? "text-orange-500" : "text-gray-500"}`}>PIX</span>
                      <span className="text-xs text-gray-400">Aprovação imediata</span>
                    </>
                  ) : (
                    <>
                      <svg className={`w-8 h-8 ${method === "card" ? "text-orange-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className={`text-sm font-medium ${method === "card" ? "text-orange-500" : "text-gray-500"}`}>Cartão</span>
                      <span className="text-xs text-gray-400">Crédito / Débito</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Card extra fields */}
          {method === "card" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <h2 className="font-semibold text-gray-800 mb-3">Dados do cartão</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700">
                O cartão é tokenizado pelo SDK do Mercado Pago. Para uso em produção, integre o{" "}
                <strong>Checkout Bricks</strong> instalando <code>@mercadopago/sdk-react</code>.{" "}
                Em ambiente de teste, você pode fornecer o token manualmente abaixo.
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Token do cartão (gerado pelo MP.js)</label>
                  <input
                    type="text"
                    placeholder="Token gerado pelo Mercado Pago SDK"
                    value={card.token}
                    onChange={(e) => setCard((prev) => ({ ...prev, token: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bandeira</label>
                    <select
                      value={card.payment_method_id}
                      onChange={(e) => setCard((prev) => ({ ...prev, payment_method_id: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    >
                      <option value="visa">Visa</option>
                      <option value="master">Mastercard</option>
                      <option value="amex">Amex</option>
                      <option value="elo">Elo</option>
                      <option value="hipercard">Hipercard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Parcelas</label>
                    <select
                      value={card.installments}
                      onChange={(e) => setCard((prev) => ({ ...prev, installments: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    >
                      {[1, 2, 3, 4, 6, 12].map((n) => (
                        <option key={n} value={n}>{n}x {n === 1 ? "(sem juros)" : `de R$ ${(total / n).toFixed(2)}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={method === "pix" ? handlePixPayment : handleCardPayment}
            disabled={processing}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {processing
              ? "Processando..."
              : method === "pix"
              ? `Gerar PIX · R$ ${total.toFixed(2)}`
              : `Pagar R$ ${total.toFixed(2)}`}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pagamento seguro via Mercado Pago
          </p>
        </div>
      </main>
    </div>
  );
}
