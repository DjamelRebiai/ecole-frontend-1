"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  School,
  Calendar,
  CreditCard,
  LogOut,
  GraduationCap,
  DollarSign,
  MessageCircle,
  Building2,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { key: "dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { key: "facilities", href: "/super-admin/facilities", icon: Building2 },
  { key: "schools", href: "/super-admin/schools", icon: School },
  { key: "subscriptions", href: "/super-admin/subscriptions", icon: Calendar },
  { key: "revenue", href: "/super-admin/revenue", icon: DollarSign },
  { key: "billing", href: "/super-admin/billing", icon: CreditCard },
  { key: "support", href: "/super-admin/support", icon: MessageCircle },
];

export function SuperAdminSidebar() {
  const t = useTranslations("superAdmin.nav");
  const tCommon = useTranslations("common");
  const tSuperAdmin = useTranslations("superAdmin");
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 top-0 z-[100] flex flex-col bg-primary text-white transition-transform duration-300",
          "left-0 w-[240px]",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:!translate-x-0",
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-white/8 p-5">
          <Logo
            alt="DJO"
            priority
            className="h-9 w-auto flex-shrink-0 rounded-lg bg-white p-1"
          />
          <div>
            <h2 className="text-base font-bold tracking-tight">
              {tSuperAdmin("title")}
            </h2>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] tracking-wider">
              {tSuperAdmin("badge")}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/40">
            {t("main")}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-white"
                    : "text-white/75 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/8 p-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-all hover:bg-white/6 hover:text-white"
          >
            <GraduationCap className="h-[18px] w-[18px]" />
            {tCommon("schoolDashboard")}
          </Link>
          <button
            onClick={() => {
              logout().then(() => router.replace("/auth/login"));
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-all hover:bg-white/6 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {tCommon("logout")}
          </button>
        </div>
      </aside>

      {/* Mobile menu trigger button overlay handled by parent */}
    </>
  );
}
