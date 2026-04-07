"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/api-client";
import type { TechnicalVisitRequest } from "@/types";

type VisitGroups = Record<"pending" | "accepted" | "refused" | "completed", TechnicalVisitRequest[]>;

export default function ProviderVisitsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<VisitGroups>({
    pending: [],
    accepted: [],
    refused: [],
    completed: [],
  });

  const fetchVisits = async () => {
    try {
      const response = await apiClient.get<VisitGroups>("/technical-visits/provider-panel/");
      if (response.data) setVisits(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.user_type === "provider") fetchVisits();
  }, [user]);

  const updateStatus = async (id: number, status: "accepted" | "refused" | "completed") => {
    await apiClient.patch(`/technical-visits/${id}/`, { status });
    fetchVisits();
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  if (!user || user.user_type !== "provider") return null;

  const userName = user.provider_profile?.full_name || user.first_name || user.username;
  const sections: Array<{ key: keyof VisitGroups; title: string }> = [
    { key: "pending", title: "Pedidos pendentes" },
    { key: "accepted", title: "Pedidos aceitos" },
    { key: "refused", title: "Pedidos recusados" },
    { key: "completed", title: "Pedidos concluídos" },
  ];

  return (
    <div className="flex min-h-screen bg-orange-50">
      <Sidebar userName={userName} userInitial={userName?.charAt(0).toUpperCase()} />
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel de Visitas Técnicas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <section key={section.key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h2 className="font-semibold text-lg text-gray-800 mb-3">
                {section.title} ({visits[section.key].length})
              </h2>
              {visits[section.key].length === 0 && <p className="text-sm text-gray-500">Sem pedidos.</p>}
              <div className="space-y-3">
                {visits[section.key].map((visit) => (
                  <article key={visit.id} className="border border-gray-200 rounded-lg p-3">
                    <p className="font-medium text-gray-800">{visit.consumer_name}</p>
                    <p className="text-sm text-gray-600">{visit.address}</p>
                    {visit.notes && <p className="text-sm text-gray-500 mt-1">{visit.notes}</p>}
                    <div className="flex gap-2 mt-3">
                      {section.key === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(visit.id, "accepted")}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => updateStatus(visit.id, "refused")}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md"
                          >
                            Recusar
                          </button>
                        </>
                      )}
                      {section.key === "accepted" && (
                        <button
                          onClick={() => updateStatus(visit.id, "completed")}
                          className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md"
                        >
                          Marcar como concluído
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
