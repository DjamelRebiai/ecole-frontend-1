"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  LayoutGrid,
  CreditCard,
  CalendarCheck,
  UserCog,
  UsersRound,
  DollarSign,
  ClipboardCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { key: "dashboard", href: "/sports-hall/dashboard", icon: LayoutDashboard },
  { key: "halls", href: "/sports-hall/halls", icon: Dumbbell },
  { key: "members", href: "/sports-hall/members", icon: Users },
  {
    key: "membershipPlans",
    href: "/sports-hall/membership-plans",
    icon: LayoutGrid,
  },
  {
    key: "subscriptions",
    href: "/sports-hall/subscriptions",
    icon: CreditCard,
  },
  { key: "bookings", href: "/sports-hall/bookings", icon: CalendarCheck },
  { key: "trainers", href: "/sports-hall/trainers", icon: UserCog },
  { key: "groupClasses", href: "/sports-hall/group-classes", icon: UsersRound },
  { key: "finance", href: "/sports-hall/finance", icon: DollarSign },
  { key: "checkins", href: "/sports-hall/checkins", icon: ClipboardCheck },
];

export function SportsHallSidebar({
  mobileOpen,
  onMenuClick,
}: {
  mobileOpen?: boolean;
  onMenuClick?: () => void;
}) {
  const t = useTranslations("sportsHall.nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = mobileOpen ?? localOpen;
  const toggle = onMenuClick ?? (() => setLocalOpen((v) => !v));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/30 md:hidden"
          onClick={() => toggle()}
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 top-0 z-[100] flex w-[260px] flex-col border-border bg-surface transition-transform duration-300",
          "start-0 border-e",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          "md:!translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-border p-5">
          <Logo
            alt={user?.facility_name || "DJO"}
            priority
            className="h-10 w-auto flex-shrink-0 rounded-lg bg-white p-1"
          />
          <div>
            <h2 className="text-[15px] font-bold leading-tight tracking-tight">
              {user?.facility_name || user?.email?.split("@")[0] || "..."}
            </h2>
            <span className="text-xs text-muted">{user?.role || "..."}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t("main")}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-bg hover:text-fg",
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {t(item.key)}
              </Link>
            );
          })}

          <div className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t("settings")}
          </div>

          <Link
            href="/sports-hall/settings"
            className={cn(
              "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              pathname === "/sports-hall/settings"
                ? "bg-accent text-white"
                : "text-muted hover:bg-bg hover:text-fg",
            )}
          >
            <Settings className="h-[18px] w-[18px] flex-shrink-0" />
            {t("settings")}
          </Link>
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => {
              logout().then(() => router.replace("/auth/login"));
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition-all hover:bg-bg hover:text-danger"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {tCommon("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
