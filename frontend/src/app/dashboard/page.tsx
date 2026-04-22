"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!loading && user) {
      // Redirect to specific dashboard based on user type
      if (user.user_type === "consumer") {
        router.push("/dashboard/consumer");
      } else if (user.user_type === "provider") {
        router.push("/dashboard/provider");
      } else if (user.user_type === "company") {
        router.push("/dashboard/company");
      } else if (user.user_type === "admin") {
        router.push("/dashboard/admin");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return null;
}
