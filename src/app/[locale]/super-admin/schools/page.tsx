"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api/client";

interface School {
  id: string;
  name: string;
  email: string;
  max_students: number;
  is_active: boolean;
  student_count: number;
  last_payment_date: string | null;
  platform_subscriptions?: { status: string; platform_subscription_plans?: { name: string } }[];
  created_at: string;
}

export default function SchoolsPage() {
  const t = useTranslations("superAdmin.schools");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("admin/schools?limit=100")
      .then((res) => setSchools(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <Link
            href="/super-admin/schools/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("table.name")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("table.email")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("table.plan")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("table.students")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("table.lastPayment")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("table.status")}</th>
                <th className="border-b border-border px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : schools.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">لا توجد مدارس بعد</td></tr>
              ) : (
                schools.map((s) => {
                  const sub = s.platform_subscriptions?.[0];
                  const planName = sub?.platform_subscription_plans?.name || "-";
                  const subStatus = sub?.status || "unknown";
                  return (
                    <tr key={s.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-3 font-semibold">{s.name}</td>
                      <td className="border-b border-border px-3 py-3 text-muted">{s.email || "-"}</td>
                      <td className="border-b border-border px-3 py-3">{planName}</td>
                      <td className="border-b border-border px-3 py-3 tabular-nums">{s.student_count ?? 0}</td>
                      <td className="border-b border-border px-3 py-3 text-muted">{s.last_payment_date ? new Date(s.last_payment_date).toLocaleDateString("ar-DZ") : "-"}</td>
                      <td className="border-b border-border px-3 py-3">
                        <StatusBadge status={subStatus} />
                      </td>
                      <td className="border-b border-border px-3 py-3">
                        <div className="flex gap-1">
                          <Link href={`/super-admin/schools/${s.id}`} className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">عرض</Link>
                          <Link href={`/super-admin/schools/${s.id}/edit`} className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary">تعديل</Link>
                        </div>
                      </td>
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
