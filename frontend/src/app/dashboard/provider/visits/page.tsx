"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { apiClient } from "@/lib/api-client";
import type { TechnicalVisitRequest, VisitMessage } from "@/types";

function useCountdown(pendingSince: string | null | undefined): string | null {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingSince) { setDisplay(null); return; }
    const tick = () => {
      const deadline = new Date(pendingSince).getTime() + 20 * 60 * 1000;
      const remaining = deadline - Date.now();
      if (remaining <= 0) { setDisplay("00:00"); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setDisplay(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pendingSince]);

  return display;
}

type VisitGroups = Record<string, TechnicalVisitRequest[]>;

function PendingCountdown({ pendingSince }: { pendingSince: string | null | undefined }) {
  const time = useCountdown(pendingSince);
  if (!time) return null;
  const isUrgent = (() => {
    if (!pendingSince) return false;
    const remaining = new Date(pendingSince).getTime() + 20 * 60 * 1000 - Date.now();
    return remaining < 5 * 60 * 1000;
  })();
  return (
    <div className={`flex items-center gap-1.5 mt-2 text-xs rounded-lg px-2.5 py-1.5 ${isUrgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Você tem <strong>{time}</strong> para aceitar. Após esse tempo a visita será cancelada automaticamente.</span>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  pending: "Pendentes",
  accepted: "Aceitas",
  refused: "Recusadas",
  completed: "Concluídas",
  cancelled: "Canceladas",
};

const STATUS_COLOR: Record<string, string> = {
  awaiting_payment: "bg-yellow-100 text-yellow-700",
  pending: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-400",
};

const GROUPS = ["pending", "accepted", "completed", "refused", "cancelled"];

export default function ProviderVisitsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<VisitGroups>({});
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, VisitMessage[]>>({});
  const [newMessage, setNewMessage] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const fetchVisits = useCallback(async () => {
    try {
      const r = await apiClient.get<VisitGroups>("/technical-visits/provider-panel/");
      if (r.data) setVisits(r.data);
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (visitId: number) => {
    const r = await apiClient.get<VisitMessage[]>(`/technical-visits/${visitId}/messages/`);
    if (Array.isArray(r.data)) {
      setMessages((prev) => ({ ...prev, [visitId]: r.data as VisitMessage[] }));
    }
  }, []);

  useEffect(() => {
    if (user?.user_type === "provider") {
      fetchVisits();
      pollingRef.current = setInterval(fetchVisits, 10000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [user, fetchVisits]);

  // Poll messages for expanded visit
  useEffect(() => {
    if (!expandedVisit) return;
    fetchMessages(expandedVisit);
    const msgInterval = setInterval(() => fetchMessages(expandedVisit), 8000);
    return () => clearInterval(msgInterval);
  }, [expandedVisit, fetchMessages]);

  const updateStatus = async (id: number, newStatus: "accepted" | "refused") => {
    await apiClient.patch(`/technical-visits/${id}/update/`, { status: newStatus });
    fetchVisits();
  };

  const sendMessage = async (visitId: number) => {
    const content = newMessage[visitId]?.trim();
    if (!content) return;
    setSending(visitId);
    try {
      await apiClient.post(`/technical-visits/${visitId}/messages/`, { content });
      setNewMessage((prev) => ({ ...prev, [visitId]: "" }));
      await fetchMessages(visitId);
    } finally {
      setSending(null);
    }
  };

  const toggleExpand = (visitId: number) => {
    setExpandedVisit((prev) => (prev === visitId ? null : visitId));
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>;
  }
  if (!user || user.user_type !== "provider") return null;

  const userName = user.provider_profile?.full_name || user.first_name || user.username;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} userPhoto={(user as any).profile_photo_url} />
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Painel de Visitas" }]} />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel de Visitas</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie suas solicitações de visitas técnicas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GROUPS.map((group) => {
            const groupVisits = visits[group] || [];
            const nonEmpty = groupVisits.length > 0;
            if (["refused", "cancelled", "completed"].includes(group) && !nonEmpty) return null;

            return (
              <section key={group} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-800">{STATUS_LABEL[group]}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[group]}`}>
                    {groupVisits.length}
                  </span>
                </div>

                {groupVisits.length === 0 && (
                  <p className="text-sm text-gray-400">Sem visitas aqui.</p>
                )}

                <div className="space-y-3">
                  {groupVisits.map((visit) => (
                    <article key={visit.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleExpand(visit.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{visit.consumer_name}</p>
                            <p className="text-xs text-gray-500 truncate">{visit.address}</p>
                            {visit.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{visit.notes}</p>}
                            {visit.preferred_date && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Data preferida: {new Date(visit.preferred_date).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedVisit === visit.id ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {group === "pending" && (
                          <>
                            <PendingCountdown pendingSince={visit.pending_since} />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(visit.id, "accepted"); }}
                                className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Aceitar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(visit.id, "refused"); }}
                                className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Recusar
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Chat expandido */}
                      {expandedVisit === visit.id && (
                        <div className="border-t border-gray-100 bg-gray-50">
                          <div className="px-3 py-2">
                            <p className="text-xs font-medium text-gray-500 mb-2">Chat</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
                              {(messages[visit.id] || []).length === 0 ? (
                                <p className="text-xs text-gray-400 py-2 text-center">Sem mensagens ainda.</p>
                              ) : (
                                (messages[visit.id] || []).map((msg) => {
                                  const isMine = msg.sender_name === visit.provider_name;
                                  return (
                                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                      <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${isMine ? "bg-orange-500 text-white" : "bg-white text-gray-800 border border-gray-100"}`}>
                                        {!isMine && <p className="font-medium mb-0.5 opacity-70">{msg.sender_name}</p>}
                                        <p>{msg.content}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                            {!["refused", "cancelled", "completed"].includes(group) && (
                              <div className="flex gap-2">
                                <input
                                  value={newMessage[visit.id] || ""}
                                  onChange={(e) => setNewMessage((prev) => ({ ...prev, [visit.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(visit.id); }}
                                  placeholder="Mensagem..."
                                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-orange-400 bg-white"
                                />
                                <button
                                  onClick={() => sendMessage(visit.id)}
                                  disabled={sending === visit.id}
                                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs disabled:opacity-50 hover:bg-orange-600 transition-colors"
                                >
                                  {sending === visit.id ? "…" : "Enviar"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        </div>
      </main>
    </div>
  );
}
