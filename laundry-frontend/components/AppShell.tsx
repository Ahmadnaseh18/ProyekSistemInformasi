"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLaundry } from "../context/LaundryContext";
import {
  getInitials,
  getRoleDisplayName,
  isAdminRole,
} from "../lib/utils";

const ICONS: Record<string, string> = {
  Dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  Pesanan: "M6 4h12v17H6z M9 2h6v4H9 M9 10h6 M9 14h6",
  Pelanggan:
    "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-3a4 4 0 0 0-3-4",
  Layanan:
    "M3 5h18v16H3z M3 10h18 M7 7h1 M12 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  Pembayaran: "M3 5h18v14H3z M3 9h18 M6 15h4",
  Laporan: "M4 21V3 M4 21h17 M8 17v-5 M13 17V7 M18 17V3",
  Pegawai: "M12 3l8 4v6c0 5-8 8-8 8s-8-3-8-8V7z M9 12l2 2 4-4",
};

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const ALL_NAV_LINKS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Pesanan" },
  { href: "/payments", label: "Pembayaran" },
  { href: "/customers", label: "Pelanggan" },
  { href: "/services", label: "Layanan", adminOnly: true },
  { href: "/staff", label: "Pegawai", adminOnly: true },
  { href: "/reports", label: "Laporan", adminOnly: true },
];

const ADMIN_ONLY_PATHS = ["/services", "/staff", "/reports"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, authChecked, loading, handleLogout, notify } =
    useLaundry();

  const isAdmin = isAdminRole(currentUser?.role);

  // Route Guard: Redirect unauthenticated users to /login, and restrict pegawai from admin routes
  useEffect(() => {
    if (!authChecked) return;

    if (pathname === "/") {
      if (currentUser) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      return;
    }

    if (pathname === "/login") {
      if (currentUser) {
        router.replace("/dashboard");
      }
      return;
    }

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (
      !isAdmin &&
      ADMIN_ONLY_PATHS.some((adminPath) => pathname?.startsWith(adminPath))
    ) {
      notify("Akses ditolak: Menu tersebut hanya dapat diakses oleh Admin (Owner).");
      router.replace("/dashboard");
    }
  }, [authChecked, currentUser, isAdmin, pathname, router, notify]);

  // Render standalone Login layout when on /login
  if (pathname === "/login") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 16px" }}>
        <div style={{ width: "100%", maxWidth: 980 }}>{children}</div>
      </div>
    );
  }

  // While checking session or redirecting from root `/`
  if (!authChecked || !currentUser || pathname === "/") {
    return (
      <div className="empty" style={{ paddingTop: 120 }}>
        Memeriksa sesi autentikasi...
      </div>
    );
  }

  const visibleNavLinks = ALL_NAV_LINKS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const currentNav =
    ALL_NAV_LINKS.find((item) => pathname?.startsWith(item.href)) ||
    ALL_NAV_LINKS[0];

  return (
    <div className="app-shell">
      {/* FIXED LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">≈</span>
          <div>
            bilas<span style={{ color: "#8ab5a0" }}>.</span>
            <small>INTERNAL SYSTEM</small>
          </div>
        </div>

        <div className="nav-label">
          {isAdmin ? "WORKSPACE · OWNER" : "WORKSPACE · KASIR"}
        </div>
        <nav className="nav">
          {visibleNavLinks.map((item) => {
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ICONS[item.label]} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="side-note">
          <strong>Sistem Internal Laundry</strong>
          {isAdmin
            ? "Akses penuh pengelolaan operasional, layanan, pegawai & laporan."
            : "Mode operasional harian kasir, status cucian & pelanggan."}
          <div style={{ marginTop: 12, color: "var(--teal)" }}>
            ● Cabang Utama
          </div>
        </div>

        <div className="profile" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="avatar">{getInitials(currentUser.name)}</div>
            <div>
              <b>{currentUser.name}</b>
              <small>{getRoleDisplayName(currentUser.role)}</small>
            </div>
          </div>
          <button
            type="button"
            className="small ghost"
            title="Keluar dari sistem"
            onClick={handleLogout}
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main>
        <header className="topbar">
          <div className="crumb">
            Workspace / <b>{currentNav.label}</b>
          </div>
          <div className="top-actions">
            <span className="demo">
              {loading
                ? "MENYINKRONKAN API..."
                : `ROLE: ${isAdmin ? "ADMIN (OWNER)" : "PEGAWAI (KASIR)"}`}
            </span>
            <span className="avatar">{getInitials(currentUser.name)}</span>
            <button
              type="button"
              className="small"
              onClick={handleLogout}
            >
              Keluar →
            </button>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}
