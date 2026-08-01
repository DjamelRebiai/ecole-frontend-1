"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DollarSign, TrendingUp, CreditCard, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api/client";

export default function RevenuePage() {
  const t = useTranslations("superAdmin.revenue");
  const [monthlyData, setMonthlyData] = useState<{ month: string; amount: number }[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>("subscriptions/revenue/monthly"),
      api.get<any>("subscriptions/revenue"),
    ])
      .then(([monthly, rev]) => {
        setMonthlyData(Array.isArray(monthly) ? monthly : []);
        setPayments(Array.isArray(rev) ? rev : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = payments.filter(
    (p) => new Date(p.paid_at || p.created_at) >= monthStart
  );
  const thisMonthRevenue = thisMonth.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];
    return `${months[parseInt(mo) - 1]} ${y}`;
  };

  return (
    <div>
      <PageHeader title={t("title")} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-primary)"
          iconColor="var(--primary)"
          value={loading ? "..." : `${totalRevenue.toLocaleString()} د.ج`}
          label={t("totalRevenue")}
        />
        <StatCard
          icon={<TrendingUp className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-success)"
          iconColor="var(--success)"
          value={loading ? "..." : `${thisMonthRevenue.toLocaleString()} د.ج`}
          label={t("monthlyRevenue")}
        />
        <StatCard
          icon={<CreditCard className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-warning)"
          iconColor="var(--warning)"
          value={loading ? "..." : payments.length}
          label={t("numPayments")}
        />
        <StatCard
          icon={<Calendar className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-danger)"
          iconColor="var(--danger)"
          value={loading ? "..." : `${totalRevenue.toLocaleString()} د.ج`}
          label={t("allTime")}
        />
      </div>

      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">{t("monthlyChart")}</h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted">جاري التحميل...</div>
          ) : monthlyData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted">{t("noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} د.ج`, "الإيرادات"]}
                  labelFormatter={(label: any) => formatMonth(String(label))}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">{t("title")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("school")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("plan")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("amount")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("paymentMethod")}</th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">جاري التحميل...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">{t("noData")}</td></tr>
              ) : (
                payments.map((p: any, i: number) => (
                  <tr key={p.id || i} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-3 font-semibold">
                      {p.platform_schools?.name || "-"}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {p.platform_subscriptions?.platform_subscription_plans?.name || "-"}
                    </td>
                    <td className="border-b border-border px-3 py-3 font-semibold tabular-nums">
                      {Number(p.amount || 0).toLocaleString()} د.ج
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {p.payment_method === "manual" ? "يدوي" : p.payment_method || "-"}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-muted">
                      {new Date(p.paid_at || p.created_at).toLocaleDateString("ar-DZ")}
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
