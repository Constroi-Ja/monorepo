"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  userName?: string;
  userInitial?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function PackageIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
    </svg>
  );
}
function ShoppingBagIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function getNavItems(userType: string | null | undefined): NavItem[] {
  if (userType === "company") {
    return [
      { href: "/dashboard", label: "Painel", icon: <HomeIcon /> },
      { href: "/dashboard/company/items", label: "Conferir Itens", icon: <PackageIcon /> },
      { href: "/dashboard/company/deliveries", label: "Ger. Entregas", icon: <TruckIcon /> },
      { href: "/settings", label: "Configurações", icon: <SettingsIcon /> },
    ];
  }
  if (userType === "consumer") {
    return [
      { href: "/dashboard", label: "Painel", icon: <HomeIcon /> },
      { href: "/materials", label: "Comprar Material", icon: <ShoppingBagIcon /> },
      { href: "/providers", label: "Prestadores", icon: <UsersIcon /> },
      { href: "/cart", label: "Carrinho", icon: <CartIcon /> },
      { href: "/settings", label: "Configurações", icon: <SettingsIcon /> },
    ];
  }
  if (userType === "provider") {
    return [
      { href: "/dashboard", label: "Painel", icon: <HomeIcon /> },
      { href: "/materials", label: "Comprar Material", icon: <ShoppingBagIcon /> },
      { href: "/dashboard/provider/visits", label: "Painel de Visitas", icon: <CalendarIcon /> },
      { href: "/cart", label: "Carrinho", icon: <CartIcon /> },
      { href: "/settings", label: "Configurações", icon: <SettingsIcon /> },
    ];
  }
  return [
    { href: "/dashboard", label: "Painel", icon: <HomeIcon /> },
    { href: "/settings", label: "Configurações", icon: <SettingsIcon /> },
  ];
}

export function Sidebar({ userName, userInitial }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = getNavItems(user?.user_type);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === `/dashboard/${user?.user_type}`;
    return pathname.startsWith(href);
  };

  const navLinkClass = (href: string) => {
    const active = isActive(href);
    return [
      "flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 mb-1",
      isCollapsed ? "justify-center" : "gap-3",
      active
        ? "bg-orange-500 text-white shadow-sm"
        : "text-gray-400 hover:bg-gray-700 hover:text-white",
    ].join(" ");
  };

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-gray-800 text-white rounded-lg flex items-center justify-center shadow-lg"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "bg-gray-900 min-h-screen flex flex-col transition-all duration-300 relative z-40",
          isMobile
            ? `fixed top-0 left-0 w-64 h-full shadow-2xl transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`
            : isCollapsed
              ? "w-16"
              : "w-60",
        ].join(" ")}
      >
        {/* Desktop collapse button */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-7 w-6 h-6 bg-gray-700 hover:bg-orange-500 rounded-full flex items-center justify-center z-10 border-2 border-gray-900 transition-colors shadow"
            aria-label={isCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            <svg
              className={`w-3 h-3 text-white transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-gray-800 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="text-white text-lg font-bold tracking-tight whitespace-nowrap">
              Constróijá
            </span>
          )}
        </div>

        {/* User Info */}
        <div className={`px-4 py-4 border-b border-gray-800 ${isCollapsed ? "flex justify-center" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-sm font-bold flex-shrink-0">
              {userInitial || userName?.charAt(0).toUpperCase() || "U"}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName || "Usuário"}</p>
                <p className="text-gray-500 text-xs capitalize">{user?.user_type || ""}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(item.href)}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}

          {/* Upgrade button */}
          <div className="mt-2 pt-2 border-t border-gray-800">
            <Link
              href="/settings?tab=plan"
              className={[
                "flex items-center px-3 py-2.5 rounded-lg transition-all mb-1",
                isCollapsed ? "justify-center" : "gap-3",
                "text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40",
              ].join(" ")}
              title={isCollapsed ? "Atualizar Plano" : undefined}
            >
              <StarIcon />
              {!isCollapsed && <span className="text-sm font-medium">Atualizar Plano</span>}
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className={[
              "flex items-center w-full px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-all",
              isCollapsed ? "justify-center" : "gap-3",
            ].join(" ")}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogoutIcon />
            {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
