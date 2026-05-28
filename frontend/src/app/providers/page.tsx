"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import type { CreateVisitResponse, Provider } from "@/types";

type ModalStep = "details" | "paying" | "awaiting_pix";
type PayMethod = "pix" | "credit_card";

interface PayerForm {
  email: string;
  first_name: string;
  last_name: string;
  cpf: string;
}

interface CardForm {
  token: string;
  payment_method_id: string;
  installments: number;
}

export default function ProvidersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("details");
  const [payMethod, setPayMethod] = useState<PayMethod>("pix");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [payer, setPayer] = useState<PayerForm>({ email: "", first_name: "", last_name: "", cpf: "" });
  const [card, setCard] = useState<CardForm>({ token: "", payment_method_id: "visa", installments: 1 });
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<{ payment_id: number; mp_payment_id?: string; qr_code_base64: string; qr_code_text: string } | null>(null);
  const [simulateDone, setSimulateDone] = useState(false);
  const [visitId, setVisitId] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await apiClient.get("/providers/nearby/");
        const data = response.data as unknown as Provider[];
        setProviders(Array.isArray(data) ? data : []);
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  // Auto-open booking modal when ?provider_id=X is present
  useEffect(() => {
    const pid = searchParams.get("provider_id");
    if (!pid || providers.length === 0 || selectedProvider) return;
    const found = providers.find((p) => String(p.id) === pid);
    if (found) {
      setSelectedProvider(found);
      setModalStep("details");
      setPayMethod("pix");
      setNotes("");
      setModalError("");
      setPixData(null);
      setVisitId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  // Prefill payer info from user profile
  useEffect(() => {
    if (user) {
      const profile = user.consumer_profile;
      setPayer({
        email: user.email || "",
        first_name: user.first_name || profile?.full_name?.split(" ")[0] || "",
        last_name: user.last_name || profile?.full_name?.split(" ").slice(1).join(" ") || "",
        cpf: profile?.cpf || "",
      });
    }
  }, [user]);

  // PIX polling
  useEffect(() => {
    if (modalStep !== "awaiting_pix" || !pixData || !visitId) return;
    pollingRef.current = setInterval(async () => {
      const r = await apiClient.get<{ status: string }>(`/payments/${pixData.payment_id}/`);
      if (r.data?.status === "approved") {
        clearInterval(pollingRef.current!);
        router.refresh();
        router.push(`/visitas/${visitId}`);
      }
    }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [modalStep, pixData, visitId, router]);

  const openModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setModalStep("details");
    setPayMethod("pix");
    setNotes("");
    setModalError("");
    setPixData(null);
    setVisitId(null);
    if (user?.consumer_profile) {
      const p = user.consumer_profile;
      setAddress(`${p.street}, ${p.number}${p.complement ? ` ${p.complement}` : ""} - ${p.city}/${p.state}`);
    }
  };

  const closeModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedProvider(null);
  };

  const handlePay = async () => {
    if (!selectedProvider || !user?.consumer_profile) return;
    setProcessing(true);
    setModalError("");

    const basePayload = {
      provider: selectedProvider.id,
      address,
      notes,
      preferred_date: null,
      payment_method: payMethod,
      payer_email: payer.email,
      payer_first_name: payer.first_name,
      payer_last_name: payer.last_name,
      payer_cpf: payer.cpf.replace(/\D/g, ""),
    };

    const payload = payMethod === "credit_card"
      ? { ...basePayload, token: card.token, payment_method_id: card.payment_method_id, installments: card.installments }
      : basePayload;

    try {
      const r = await apiClient.post<CreateVisitResponse>("/technical-visits/", payload);
      if (r.error) throw new Error(r.error.message);
      if (!r.data) throw new Error("Resposta inválida do servidor.");
      const { visit, payment } = r.data;
      setVisitId(visit.id);

      if (payMethod === "pix") {
        setPixData({
          payment_id: payment.payment_id,
          mp_payment_id: (payment as any).mp_payment_id,
          qr_code_base64: payment.qr_code_base64 || "",
          qr_code_text: payment.qr_code_text || "",
        });
        setModalStep("awaiting_pix");
      } else {
        // Card: approved synchronously or pending
        if (payment.status === "approved") {
          router.push(`/visitas/${visit.id}`);
        } else {
          setModalError("Pagamento não aprovado. Verifique os dados do cartão.");
        }
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setModalError(err?.message || "Erro ao processar. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providers;
    const term = search.toLowerCase();
    return providers.filter(
      (p) =>
        p.full_name.toLowerCase().includes(term) ||
        p.specialties.join(", ").toLowerCase().includes(term)
    );
  }, [search, providers]);

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.company_profile?.company_name ||
    user.first_name ||
    user.username;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} userPhoto={(user as any).profile_photo_url} />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Prestadores" }]} />

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contratar Prestador</h1>
              <p className="text-sm text-gray-500 mt-0.5">Prestadores disponíveis próximos a você.</p>
            </div>
            <button
              onClick={() => router.push("/minhas-visitas")}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:border-orange-300 transition-colors flex-shrink-0 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Minhas Visitas
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou especialidade..."
              className="w-full md:max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            />
          </div>

          {filteredProviders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                title="Nenhum prestador disponível"
                description="Não há prestadores disponíveis no momento ou que correspondam à sua busca."
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProviders.map((provider) => (
                <article
                  key={provider.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-gray-900 text-sm leading-tight">{provider.full_name}</h2>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{provider.specialties.join(", ")}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {provider.distance} km
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {provider.rating}
                      </span>
                      <span>~{provider.eta_minutes || "-"} min</span>
                    </div>
                    <button
                      onClick={() => openModal(provider)}
                      className="mt-3 w-full bg-orange-500 text-white text-xs font-medium rounded-xl py-2.5 hover:bg-orange-600 transition-colors"
                    >
                      Solicitar visita técnica
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Solicitar Visita Técnica</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedProvider.full_name}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Price badge */}
              <div className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-700 font-medium">Visita técnica</span>
                <span className="text-lg font-bold text-orange-500">R$&nbsp;80,00</span>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{modalError}</div>
              )}

              {/* Step: details */}
              {modalStep === "details" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Endereço da visita</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Observações (opcional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Descreva o problema ou serviço necessário..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
                    />
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Método de pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["pix", "credit_card"] as PayMethod[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setPayMethod(m)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${payMethod === m ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-200"}`}
                        >
                          {m === "pix" ? (
                            <>
                              <svg className={`w-6 h-6 ${payMethod === "pix" ? "text-orange-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                              <span className={`text-xs font-medium ${payMethod === "pix" ? "text-orange-500" : "text-gray-500"}`}>PIX</span>
                            </>
                          ) : (
                            <>
                              <svg className={`w-6 h-6 ${payMethod === "credit_card" ? "text-orange-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <span className={`text-xs font-medium ${payMethod === "credit_card" ? "text-orange-500" : "text-gray-500"}`}>Cartão</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payer info */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Dados do pagador</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Nome", key: "first_name" },
                        { label: "Sobrenome", key: "last_name" },
                        { label: "Email", key: "email" },
                        { label: "CPF", key: "cpf", placeholder: "000.000.000-00" },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key} className={key === "email" || key === "cpf" ? "col-span-2" : ""}>
                          <label className="block text-xs text-gray-500 mb-1">{label}</label>
                          <input
                            type={key === "email" ? "email" : "text"}
                            placeholder={placeholder}
                            value={(payer as Record<string, string>)[key]}
                            onChange={(e) => setPayer((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card fields */}
                  {payMethod === "credit_card" && (
                    <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                      <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2">
                        Token gerado pelo SDK Mercado Pago (Checkout Bricks em produção).
                      </p>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Token do cartão</label>
                        <input
                          type="text"
                          placeholder="Token MP.js"
                          value={card.token}
                          onChange={(e) => setCard((prev) => ({ ...prev, token: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Bandeira</label>
                          <select
                            value={card.payment_method_id}
                            onChange={(e) => setCard((prev) => ({ ...prev, payment_method_id: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                          >
                            <option value="visa">Visa</option>
                            <option value="master">Mastercard</option>
                            <option value="elo">Elo</option>
                            <option value="amex">Amex</option>
                            <option value="hipercard">Hipercard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Parcelas</label>
                          <select
                            value={card.installments}
                            onChange={(e) => setCard((prev) => ({ ...prev, installments: Number(e.target.value) }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                          >
                            {[1, 2, 3, 4, 6, 12].map((n) => (
                              <option key={n} value={n}>{n}x {n === 1 ? "(sem juros)" : `de R$ ${(80 / n).toFixed(2)}`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={processing || !address.trim()}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? "Processando..." : payMethod === "pix" ? "Gerar PIX · R$80,00" : "Pagar R$80,00"}
                  </button>
                </>
              )}

              {/* Step: awaiting PIX */}
              {modalStep === "awaiting_pix" && pixData && (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900">Escaneie o QR Code</p>
                  <p className="text-xs text-gray-500">Após o pagamento, você será redirecionado automaticamente.</p>

                  {pixData.qr_code_base64 && (
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-44 h-44 rounded-xl border border-gray-100 mx-auto"
                    />
                  )}

                  <p className="text-lg font-bold text-orange-500">R$&nbsp;80,00</p>

                  {pixData.qr_code_text && (
                    <>
                      <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 break-all font-mono text-left">
                        {pixData.qr_code_text}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.qr_code_text);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${copied ? "bg-green-500 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                      >
                        {copied ? "Copiado!" : "Copiar código PIX"}
                      </button>
                    </>
                  )}

                  {process.env.NEXT_PUBLIC_TEST_MODE === "true" && pixData.mp_payment_id && (
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.post(`/payments/${pixData.mp_payment_id}/simulate-approve/`);
                          setSimulateDone(true);
                          if (visitId) setTimeout(() => { router.refresh(); router.push(`/visitas/${visitId}`); }, 800);
                        } catch { /* ignore */ }
                      }}
                      disabled={simulateDone}
                      className="w-full py-2.5 bg-yellow-400 text-yellow-900 rounded-xl text-sm font-semibold hover:bg-yellow-500 disabled:opacity-60 transition-colors"
                    >
                      {simulateDone ? "Aprovado!" : "⚡ Simular pagamento aprovado (teste)"}
                    </button>
                  )}

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Aguardando confirmação do pagamento…
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
