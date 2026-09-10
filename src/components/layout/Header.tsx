"use client";

import { Menu, LogOut, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { AcademicYearSelector } from "./AcademicYearSelector";
import { ThemeToggle } from "@/contexts/ThemeContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/Logo";

interface HeaderProps {
  pageTitle: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  hideYearSelector?: boolean;
}

export function Header({ pageTitle, onMenuClick, showMenuButton, hideYearSelector }: HeaderProps) {
  const { user, logout } = useAuth();
  const tSuperAdmin = useTranslations("superAdmin.nav");

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-surface px-6">
      {showMenuButton && (
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-fg hover:bg-bg md:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="text-base font-bold tracking-tight">{pageTitle}</div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {!hideYearSelector && <AcademicYearSelector />}
        <ThemeToggle />
        <LanguageSwitcher />
        <NotificationBell />
        {user?.is_super_admin && (
          <Link
            href="/super-admin/dashboard"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition hover:border-primary hover:text-primary"
            title={tSuperAdmin("dashboard")}
          >
            <Shield className="h-4 w-4" />
          </Link>
        )}
        <div
          className="grid h-8 w-8 cursor-pointer flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-border"
          title="DJO"
        >
          <Logo alt="DJO" className="h-full w-auto" />
        </div>
        <button
          onClick={logout}
          className="rounded-md p-1.5 text-muted hover:bg-bg hover:text-danger transition-colors"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
