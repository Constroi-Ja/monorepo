"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { apiClient } from "@/lib/api-client";
import type { TechnicalVisitRequest, VisitMessage } from "@/types";

const STATUS_LABEL: Record<TechnicalVisitRequest["status"], string> = {
  awaiting_payment: "Aguardando pagamento",
  pending: "Aguardando confirmação",
  accepted: "Confirmada",
  refused: "Recusada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const STATUS_COLOR: Record<TechnicalVisitRequest["status"], string> = {
  awaiting_payment: "bg-yellow-100 text-yellow-700",
  pending: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-400",
};

const TIMELINE_STEPS = [
  { status: "awaiting_payment", label: "Pagamento" },
  { status: "pending", label: "Aguardando prestador" },
  { status: "accepted", label: "A caminho" },
  { status: "completed", label: "Concluída" },
];

const STEP_ORDER = ["awaiting_payment", "pending", "accepted", "completed"];

function getStepIndex(status: TechnicalVisitRequest["status"]): number {
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function VisitDetailPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const visitId = params?.id as string;

  const [visit, setVisit] = useState<TechnicalVisitRequest | null>(null);
  const [messages, setMessages] = useState<VisitMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [error, setError] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const fetchVisit = useCallback(async () => {
    const r = await apiClient.get<TechnicalVisitRequest>(`/technical-visits/${visitId}/`);
    if (r.data) setVisit(r.data);
  }, [visitId]);

  const fetchMessages = useCallback(async () => {
    const r = await apiClient.get<VisitMessage[]>(`/technical-visits/${visitId}/messages/`);
    if (Array.isArray(r.data)) setMessages(r.data);
  }, [visitId]);

  useEffect(() => {
    if (!user || !visitId) return;
    Promise.all([fetchVisit(), fetchMessages()]).finally(() => setLoading(false));

    pollingRef.current = setInterval(() => {
      fetchVisit();
      fetchMessages();
    }, 8000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user, visitId, fetchVisit, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await apiClient.post(`/technical-visits/${visitId}/messages/`, { content: newMessage.trim() });
      setNewMessage("");
      await fetchMessages();
    } catch {
      setError("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const cancelVisit = async () => {
    setCancelling(true);
    try {
      await apiClient.post(`/technical-visits/${visitId}/cancel/`, {});
      await fetchVisit();
      setConfirmCancel(false);
    } catch {
      setError("Erro ao cancelar visita.");
    } finally {
      setCancelling(false);
    }
  };

  const completeVisit = async () => {
    setCompleting(true);
    try {
      await apiClient.post(`/technical-visits/${visitId}/complete/`, {});
      await fetchVisit();
      setShowRating(true);
    } catch {
      setError("Erro ao encerrar visita.");
    } finally {
      setCompleting(false);
    }
  };

  const submitRating = async () => {
    if (!ratingStars || !visit) return;
    setRatingSubmitting(true);
    try {
      await apiClient.post("/reviews/", {
        target_user_id: visit.provider,
        target_type: "provider",
        rating: ratingStars,
        comment: ratingComment.trim(),
      });
      setRatingDone(true);
    } catch {
      setError("Erro ao enviar avaliação.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;
  if (!user || !visit) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.provider_profile?.full_name ||
    user.first_name ||
    user.username;

  const isConsumer = user.user_type === "consumer";
  const canCancel = isConsumer && ["awaiting_payment", "pending", "accepted"].includes(visit.status);
  const canComplete = isConsumer && visit.status === "accepted";
  const isClosed = ["refused", "cancelled", "completed"].includes(visit.status);
  const currentStep = getStepIndex(visit.status);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />

      <main className="flex-1 p-4 md:p-6 mt-16 md:mt-0 min-w-0">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Back link */}
          <button
            onClick={() => router.push(isConsumer ? "/minhas-visitas" : "/dashboard/provider/visits")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isConsumer ? "Minhas Visitas" : "Painel de Visitas"}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {/* Status card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[visit.status]}`}>
                  {STATUS_LABEL[visit.status]}
                </span>
                <h1 className="text-lg font-bold text-gray-900 mt-2">
                  {isConsumer ? visit.provider_name : visit.consumer_name}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{visit.address}</p>
                {visit.notes && <p className="text-xs text-gray-400 mt-1">{visit.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">Visita #{visit.id}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(visit.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {/* ETA — só exibe quando aceita */}
            {visit.status === "accepted" && visit.estimated_eta_minutes && (
              <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-3 mb-4">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs text-green-600">Tempo estimado de chegada</p>
                  <p className="text-sm font-bold text-green-700">~{visit.estimated_eta_minutes} minutos</p>
                </div>
              </div>
            )}

            {/* Timeline — só quando não cancelada/recusada */}
            {!["refused", "cancelled"].includes(visit.status) && (
              <div className="relative flex items-center justify-between mt-2">
                {TIMELINE_STEPS.map((step, idx) => {
                  const done = idx < currentStep;
                  const active = idx === currentStep && !isClosed;
                  return (
                    <div key={step.status} className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-colors ${
                        done ? "bg-orange-500 border-orange-500" : active ? "bg-white border-orange-500" : "bg-white border-gray-200"
                      }`}>
                        {done ? (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${active ? "bg-orange-500" : "bg-gray-200"}`} />
                        )}
                      </div>
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <div className={`absolute h-0.5 top-3.5 ${idx === 0 ? "left-1/4" : idx === 1 ? "left-2/4" : "left-3/4"} w-1/4 -z-0 ${done ? "bg-orange-500" : "bg-gray-200"}`} />
                      )}
                      <p className={`text-xs mt-1.5 text-center leading-tight ${active ? "text-orange-500 font-medium" : done ? "text-gray-700" : "text-gray-400"}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Refused/cancelled reason */}
            {visit.status === "refused" && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl text-sm text-red-700">
                Visita recusada pelo prestador. O pagamento será reembolsado.
              </div>
            )}
            {visit.status === "cancelled" && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">
                Visita cancelada por {visit.cancelled_by === "consumer" ? "você" : "o prestador"}. O pagamento será reembolsado.
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ maxHeight: "420px" }}>
            <div className="p-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: "180px" }}>
              {messages.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhuma mensagem ainda. Inicie a conversa!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_name === (isConsumer ? visit.consumer_name : visit.provider_name);
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMine ? "bg-orange-500 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                        {!isMine && <p className="text-xs font-medium mb-0.5 opacity-70">{msg.sender_name}</p>}
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? "text-orange-200" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {!isClosed && (
              <div className="p-3 border-t border-gray-50 flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Complete visit button */}
          {canComplete && !showRating && (
            <button
              onClick={completeVisit}
              disabled={completing}
              className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors shadow-sm"
            >
              {completing ? "Encerrando..." : "Encerrar visita"}
            </button>
          )}

          {/* Rating modal */}
          {showRating && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center space-y-4">
              {ratingDone ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-800">Avaliação enviada!</p>
                  <p className="text-sm text-gray-500">Obrigado pelo seu feedback.</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Como foi a visita?</p>
                    <p className="text-xs text-gray-500">Avalie o prestador {visit.provider_name}</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingStars(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-9 h-9 ${star <= ratingStars ? "text-yellow-400" : "text-gray-200"}`}
                          fill="currentColor" viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Comentário opcional..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRating(false)}
                      className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    >
                      Pular
                    </button>
                    <button
                      onClick={submitRating}
                      disabled={ratingStars === 0 || ratingSubmitting}
                      className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {ratingSubmitting ? "Enviando..." : "Enviar avaliação"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cancel button */}
          {canCancel && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full py-3 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Cancelar visita
            </button>
          )}

          {confirmCancel && (
            <div className="bg-white rounded-2xl border border-red-200 p-4 text-center space-y-3">
              <p className="text-sm font-medium text-gray-800">Tem certeza que deseja cancelar?</p>
              <p className="text-xs text-gray-500">O pagamento de R$80,00 será reembolsado.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={cancelVisit}
                  disabled={cancelling}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors"
                >
                  {cancelling ? "Cancelando..." : "Confirmar cancelamento"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
