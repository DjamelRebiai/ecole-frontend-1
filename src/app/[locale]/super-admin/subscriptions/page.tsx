"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api/client";

export default function SubscriptionsPage() {
  const t = useTranslations("superAdmin.nav");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("subscriptions?limit=100")
      .then((res) => setSubscriptions(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title={t("subscriptions")} />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">المدرسة</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الباقة</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الدورية</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">المبلغ (د.ج)</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">تاريخ البدء</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">تاريخ الانتهاء</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">لا توجد اشتراكات بعد</td></tr>
              ) : (
                subscriptions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3 font-semibold">{s.platform_schools?.name || "-"}</td>
                    <td className="border-b border-border px-3 py-3">{s.platform_subscription_plans?.name || "-"}</td>
                    <td className="border-b border-border px-3 py-3">{s.billing_cycle === "monthly" ? "شهري" : "سنوي"}</td>
                    <td className="border-b border-border px-3 py-3 font-semibold tabular-nums">{Number(s.price_at_subscription || 0).toLocaleString()}</td>
                    <td className="border-b border-border px-3 py-3 text-muted">{s.start_date ? new Date(s.start_date).toLocaleDateString("ar-DZ") : "-"}</td>
                    <td className="border-b border-border px-3 py-3 text-muted">{s.end_date ? new Date(s.end_date).toLocaleDateString("ar-DZ") : "-"}</td>
                    <td className="border-b border-border px-3 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
