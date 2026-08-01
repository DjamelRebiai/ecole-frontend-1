"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, School, Calendar, AlertCircle, DollarSign } from "lucide-react";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api/client";

interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  platform_subscriptions?: { status: string; platform_subscription_plans?: { name: string } }[];
  created_at: string;
}

export default function SuperAdminDashboardPage() {
  const t = useTranslations("superAdmin.dashboard");
  const tg = useTranslations("superAdmin.dashboard.table");
  const [stats, setStats] = useState<any>(null);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  const lastUpdated = new Date().toLocaleDateString("ar-DZ", {
    year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    Promise.all([
      api.get<any>("admin/dashboard"),
      api.get<any>("admin/schools?limit=5"),
    ])
      .then(([s, sch]) => {
        setStats(s);
        setSchools(Array.isArray(sch) ? sch : sch.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={`${t("subtitle")} — آخر تحديث: ${lastUpdated}`}
        actions={
          <Link
            href="/super-admin/schools/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            {t("addSchool")}
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<School className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-primary)"
          iconColor="var(--primary)"
          value={loading ? "..." : stats?.total_schools ?? 0}
          label={t("stats.activeSchools")}
        />
        <StatCard
          icon={<Calendar className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-success)"
          iconColor="var(--success)"
          value={loading ? "..." : stats?.active_subscriptions ?? 0}
          label={t("stats.activeSubscriptions")}
        />
        <StatCard
          icon={<AlertCircle className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-danger)"
          iconColor="var(--danger)"
          value={loading ? "..." : stats?.overdue_subscriptions ?? 0}
          label={t("stats.overdue")}
          trend="down"
        />
        <StatCard
          icon={<DollarSign className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-warning)"
          iconColor="var(--warning)"
          value={loading ? "..." : `${(stats?.monthly_revenue ?? 0).toLocaleString()} د.ج`}
          label={t("stats.revenue")}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">{t("recentSchools")}</h3>
          <Link href="/super-admin/schools" className="text-[13px] font-semibold text-accent hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("school")}</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("plan")}</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("status")}</th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">{tg("date")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : schools.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">لا توجد مدارس بعد</td></tr>
              ) : (
                schools.map((sch) => {
                  const sub = sch.platform_subscriptions?.[0];
                  return (
                    <tr key={sch.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">{sch.name}</td>
                      <td className="border-b border-border px-3 py-2.5">{sub?.platform_subscription_plans?.name || "-"}</td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge status={sub?.status || "unknown"} label={sub?.status === "active" ? "نشط" : "قيد الانتظار"} />
                      </td>
                      <td className="border-b border-border px-3 py-2.5">{new Date(sch.created_at).toLocaleDateString("ar-DZ")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
