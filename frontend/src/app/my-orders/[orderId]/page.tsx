"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";

interface OrderItem {
  id: number;
  item_name?: string;
  quantity: number;
  unit_price: number;
}

interface OrderMessage {
  id: number;
  sender_name?: string;
  sender_id?: number;
  content: string;
  created_at: string;
}

interface Order {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  buyer_name?: string;
  company: number;
  company_name?: string;
  items: OrderItem[];
}

const STAGES = ["pendente", "confirmado", "enviado", "entregue"] as const;

const STAGE_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          <svg
            className={`w-9 h-9 transition-colors ${
              star <= (hovered || value) ? "text-orange-400" : "text-gray-200"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewModal({
  companyName,
  onSubmit,
  onSkip,
}: {
  companyName: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onSkip: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const LABELS: Record<number, string> = {
    1: "Ruim",
    2: "Regular",
    3: "Bom",
    4: "Muito bom",
    5: "Excelente!",
  };

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    await onSubmit(rating, comment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Como foi sua experiência?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Avalie a loja <span className="font-semibold text-gray-700">{companyName}</span>
        </p>

        <StarRating value={rating} onChange={setRating} />

        {rating > 0 && (
          <p className="mt-2 text-sm font-medium text-orange-500 h-5">{LABELS[rating]}</p>
        )}
        {rating === 0 && <p className="mt-2 h-5" />}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi... (opcional)"
          rows={3}
          className="mt-4 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
        />

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </button>
          <button
            onClick={onSkip}
            disabled={submitting}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Pular
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    apiClient
      .get<Order>(`/orders/${orderId}/`)
      .then((r) => { if (r.data) setOrder(r.data); })
      .catch(() => {})
      .finally(() => setLoadingOrder(false));
  }, [user, orderId]);

  useEffect(() => {
    if (!user) return;
    const fetchMessages = () => {
      apiClient
        .get<OrderMessage[]>(`/orders/${orderId}/messages/`)
        .then((r) => { if (r.data && Array.isArray(r.data)) setMessages(r.data); })
        .catch(() => {});
    };
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user, orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading || loadingOrder) return <LoadingScreen />;
  if (!user) return null;
  if (
    user.user_type !== "consumer" &&
    user.user_type !== "provider" &&
    user.user_type !== "company"
  )
    return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.company_profile?.company_name ||
    user.first_name ||
    user.username;

  const userInitial = userName?.charAt(0).toUpperCase() ?? "U";
  const currentStageIndex = STAGES.indexOf(order?.status as (typeof STAGES)[number]);

  const handleConfirmDelivery = async () => {
    if (!order || confirming) return;
    setConfirming(true);
    const result = await apiClient.patch(`/orders/${orderId}/status/`, { status: "entregue" });
    if (!result.error) {
      setOrder((prev) => (prev ? { ...prev, status: "entregue" } : prev));
      setShowReview(true);
    }
    setConfirming(false);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!order) return;
    await apiClient.post("/reviews/", {
      target_user_id: order.company,
      rating,
      comment,
      target_type: "company",
    });
    setShowReview(false);
  };

  const handleSendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setMessageText("");
    const result = await apiClient.post<OrderMessage>(`/orders/${orderId}/messages/`, { content: trimmed });
    if (result.data) setMessages((prev) => [...prev, result.data as OrderMessage]);
    setSending(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userInitial} userPhoto={(user as any).profile_photo_url} />

      {showReview && order && (
        <ReviewModal
          companyName={order.company_name ?? "a loja"}
          onSubmit={handleSubmitReview}
          onSkip={() => setShowReview(false)}
        />
      )}

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Minhas Compras", href: "/my-orders" },
              { label: `Pedido #${orderId}` },
            ]}
          />

          {!order ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-sm font-medium">Pedido não encontrado.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {order.company_name && (
                      <span className="font-medium text-gray-700">{order.company_name}</span>
                    )}
                    {order.company_name && " · "}
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 capitalize">
                  {STAGE_LABEL[order.status] ?? order.status}
                </span>
              </div>

              {/* 4-stage tracker */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
                  Acompanhe seu pedido
                </h2>
                <div className="flex items-start">
                  {STAGES.map((stage, index) => {
                    const reached = currentStageIndex >= index;
                    const isLast = index === STAGES.length - 1;
                    return (
                      <div key={stage} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          {index > 0 && (
                            <div className={`flex-1 h-0.5 ${reached ? "bg-orange-500" : "bg-gray-200"}`} />
                          )}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${reached ? "bg-orange-500 border-orange-500 shadow-sm shadow-orange-200" : "bg-white border-gray-300"}`}>
                            {reached ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-gray-300" />
                            )}
                          </div>
                          {!isLast && (
                            <div className={`flex-1 h-0.5 ${currentStageIndex > index ? "bg-orange-500" : "bg-gray-200"}`} />
                          )}
                        </div>
                        <p className={`mt-2.5 text-xs font-medium text-center ${reached ? "text-orange-600" : "text-gray-400"}`}>
                          {STAGE_LABEL[stage]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items list */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Itens do pedido
                </h2>
                <div className="divide-y divide-gray-50">
                  {order.items.map((item) => {
                    const subtotal = item.quantity * item.unit_price;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-3 gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.item_name ?? `Item #${item.id}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                          {formatCurrency(subtotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              {/* Confirm delivery button */}
              {order.status === "enviado" &&
                (user.user_type === "consumer" || user.user_type === "provider") && (
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={confirming}
                    className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    {confirming ? "Confirmando…" : "Confirmar recebimento"}
                  </button>
                )}

              {/* Rate store button (after delivered, if review not yet shown) */}
              {order.status === "entregue" &&
                (user.user_type === "consumer" || user.user_type === "provider") && (
                  <button
                    onClick={() => setShowReview(true)}
                    className="w-full py-2.5 rounded-xl border border-orange-200 text-orange-500 hover:bg-orange-50 text-sm font-semibold transition-colors"
                  >
                    ★ Avaliar a loja
                  </button>
                )}

              {/* Chat section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Mensagens</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 min-h-[220px] max-h-[420px]">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-10">
                      <p className="text-xs text-gray-400">Nenhuma mensagem ainda. Inicie a conversa abaixo.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? "self-end items-end" : "self-start items-start"}`}
                        >
                          <p className="text-[10px] text-gray-400 px-1">
                            {msg.sender_name ?? "Usuário"} · {formatTime(msg.created_at)}
                          </p>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwn ? "bg-orange-500 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Digite uma mensagem…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !messageText.trim()}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                    aria-label="Enviar mensagem"
                  >
                    <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
