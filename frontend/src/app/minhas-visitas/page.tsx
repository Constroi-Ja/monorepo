"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import type { TechnicalVisitRequest } from "@/types";

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

export default function MinhasVisitasPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<TechnicalVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user || user.user_type !== "consumer") return;
    apiClient
      .get<TechnicalVisitRequest[]>("/technical-visits/my/")
      .then((r) => setVisits(Array.isArray(r.data) ? r.data : []))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return null;

  const userName =
    user.consumer_profile?.full_name ||
    user.first_name ||
    user.username;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} userPhoto={(user as any).profile_photo_url} />

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 min-w-0">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={[{ label: "Painel", href: "/dashboard" }, { label: "Minhas Visitas" }]} />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Visitas</h1>
              <p className="text-sm text-gray-500 mt-0.5">Acompanhe suas visitas técnicas.</p>
            </div>
            <button
              onClick={() => router.push("/providers")}
              className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova visita
            </button>
          </div>

          {visits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                title="Nenhuma visita técnica"
                description="Você ainda não solicitou nenhuma visita técnica."
                action={{ label: "Contratar prestador", onClick: () => router.push("/providers") }}
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => router.push(`/visitas/${visit.id}`)}
                  className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{visit.provider_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{visit.address}</p>
                      {visit.notes && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{visit.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(visit.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[visit.status]}`}>
                        {STATUS_LABEL[visit.status]}
                      </span>
                      {visit.status === "accepted" && visit.estimated_eta_minutes && (
                        <span className="text-xs text-green-600 font-medium">
                          ~{visit.estimated_eta_minutes} min
                        </span>
                      )}
                      <svg className="w-4 h-4 text-gray-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
