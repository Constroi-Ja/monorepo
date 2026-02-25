"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/ui/Logo";

interface SidebarProps {
  userName?: string;
  userInitial?: string;
}

export function Sidebar({ userName, userInitial }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleUpgradeClick = () => {
    // This will be handled by the modal component
    const currentPath = pathname || "/dashboard";
    router.push(currentPath + "?upgrade=true");
  };

  return (
    <div className={`${isCollapsed ? "w-16 md:w-16" : "w-64 md:w-64"} bg-gray-800 min-h-screen flex flex-col transition-all duration-300 relative`}>
      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center z-10 border-2 border-gray-800 transition-all"
        aria-label={isCollapsed ? "Expandir menu" : "Colapsar menu"}
      >
        <svg
          className={`w-4 h-4 text-white transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          {!isCollapsed && <span className="text-white text-xl font-bold whitespace-nowrap">Constróijá</span>}
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
            {userInitial || userName?.charAt(0).toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm">Olá</p>
              <p className="text-white font-medium truncate">{userName || "Usuário"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <Link
          href="/settings"
          className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors mb-2`}
          title={isCollapsed ? "Configurações" : ""}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!isCollapsed && <span>Configurações</span>}
        </Link>

        <button
          onClick={handleUpgradeClick}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mb-2`}
          title={isCollapsed ? "Atualizar Plano" : ""}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {!isCollapsed && <span>Atualizar Plano</span>}
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 py-6 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors w-full`}
          title={isCollapsed ? "Sair" : ""}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>→ Sair</span>}
        </button>
      </div>
    </div>
  );
}
