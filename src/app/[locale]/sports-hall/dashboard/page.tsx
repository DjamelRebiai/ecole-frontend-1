"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dumbbell,
  Users,
  DollarSign,
  CalendarCheck,
  ClipboardCheck,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatsSkeleton, TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface Stats {
  total_members: number;
  active_members: number;
  total_halls: number;
  today_bookings: number;
  active_subscriptions: number;
  expiring_subscriptions: number;
  today_revenue: number;
  month_revenue: number;
  today_checkins: number;
}

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface ExpiringSub {
  id: string;
  member: { first_name: string; last_name: string; member_code: string };
  end_date: string;
}

interface Checkin {
  id: string;
  member: { first_name: string; last_name: string; member_code: string };
  checkin_time: string;
}

interface Payment {
  id: string;
  receipt_number: string;
  amount: number;
  paid_at: string;
  member: { first_name: string; last_name: string; member_code: string };
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "ماي",
    "جوان",
    "جويلية",
    "أوت",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatCurrency(n: number) {
  return (n || 0).toLocaleString() + " د.ج";
}

function formatTime(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function SportsHallDashboardPage() {
  const t = useTranslations("sportsHall.dashboard");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [stats, setStats] = useState<Stats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [expiring, setExpiring] = useState<ExpiringSub[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Stats>("facility/sports-hall/dashboard", undefined, {
        silent: true,
      }),
      api.get<MonthlyRevenue[]>(
        "facility/sports-hall/dashboard/monthly-revenue",
        undefined,
        { silent: true },
      ),
      api.get<ExpiringSub[]>(
        "facility/sports-hall/dashboard/expiring-subscriptions",
        undefined,
        { silent: true },
      ),
      api.get<Checkin[]>(
        "facility/sports-hall/dashboard/recent-checkins",
        undefined,
        { silent: true },
      ),
      api.get<Payment[]>(
        "facility/sports-hall/dashboard/recent-payments",
        undefined,
        { silent: true },
      ),
    ])
      .then(([s, m, e, c, p]) => {
        setStats(s);
        setMonthly(m);
        setExpiring(e);
        setCheckins(c);
        setPayments(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = monthly;
  const maxVal = Math.max(...(chartData?.map((d) => d.amount) || [0]), 0) || 1;
  const svgW = 300;
  const svgH = 160;
  const padL = 5;
  const padR = 5;
  const padB = 30;
  const padT = 5;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const n = chartData?.length || 0;
  const stepX = n > 1 ? chartW / (n - 1) : 0;

  function yPos(val: number) {
    return padT + chartH - (val / maxVal) * chartH;
  }

  function buildPoints() {
    return (chartData || [])
      .map((d, i) => `${padL + i * stepX},${yPos(d.amount)}`)
      .join(" ");
  }

  function buildPolygon() {
    if (!chartData?.length) return "";
    const pts = (chartData || [])
      .map((d, i) => `${padL + i * stepX},${yPos(d.amount)}`)
      .join(" ");
    return `${pts} ${padL + (n - 1) * stepX},${svgH} ${padL},${svgH}`;
  }

  function monthLabel(month: string) {
    const [y, m] = month.split("-");
    const names = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "ماي",
      "جوان",
      "جويلية",
      "أوت",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    return names[Number(m) - 1] || month;
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t("title") }]} />

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <StatsSkeleton />
        ) : (
          <>
            <StatCard
              icon={<Dumbbell className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-primary)"
              iconColor="var(--primary)"
              value={stats?.total_halls ?? 0}
              label={t("stats.halls")}
            />
            <StatCard
              icon={<Users className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-success)"
              iconColor="var(--success)"
              value={stats?.active_members ?? 0}
              label={t("stats.activeMembers")}
              change={String(stats?.total_members ?? 0)}
            />
            <StatCard
              icon={<DollarSign className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-warning)"
              iconColor="var(--warning)"
              value={formatCurrency(stats?.month_revenue ?? 0)}
              label={t("stats.monthlyRevenue")}
            />
            <StatCard
              icon={<CalendarCheck className="h-[22px] w-[22px]" />}
              iconBg="var(--icon-bg-danger)"
              iconColor="var(--danger)"
              value={stats?.today_bookings ?? 0}
              label={t("stats.todayBookings")}
              change={String(stats?.today_checkins ?? 0)}
            />
          </>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Monthly revenue chart */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold tracking-tight">
              {t("monthlyRevenue")}
            </h3>
            <span className="text-[13px] font-semibold text-accent">
              {t("last6months")}
            </span>
          </div>
          <div className="px-5 py-3">
            {!chartData?.length ? (
              <p className="py-4 text-center text-sm text-muted">
                {tShared("loading")}
              </p>
            ) : (
              <div className="relative" style={{ height: 180 }}>
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0"
                      y1={yPos(maxVal * ratio)}
                      x2={svgW}
                      y2={yPos(maxVal * ratio)}
                      stroke="var(--border)"
                      strokeWidth="0.5"
                    />
                  ))}
                  <polyline
                    points={buildPoints()}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points={buildPolygon()}
                    fill="url(#incomeGrad)"
                    opacity="0.15"
                  />
                  {(chartData || []).map((d, i) => (
                    <text
                      key={i}
                      x={padL + i * stepX}
                      y={svgH - 4}
                      fill="var(--muted)"
                      fontSize="8"
                      textAnchor="middle"
                    >
                      {monthLabel(d.month)}
                    </text>
                  ))}
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop
                        offset="100%"
                        stopColor="var(--accent)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Expiring subscriptions */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold tracking-tight">
              {t("expiringSubscriptions")}
            </h3>
            <Link
              href="/sports-hall/subscriptions"
              className="text-[13px] font-semibold text-accent hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {tShared("status")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {tShared("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {expiring.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {tShared("noResults")}
                    </td>
                  </tr>
                ) : (
                  expiring.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {s.member?.first_name} {s.member?.last_name}
                        <span className="ms-2 text-xs text-muted">
                          ({s.member?.member_code})
                        </span>
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge
                          status={
                            new Date(s.end_date) < new Date()
                              ? "danger"
                              : "warning"
                          }
                          label={formatDate(s.end_date)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">
            {t("recentCheckins")}
          </h3>
          <Link
            href="/sports-hall/checkins"
            className="text-[13px] font-semibold text-accent hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {tShared("status")}
                </th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {tShared("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {checkins.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-3 py-6 text-center text-sm text-muted"
                  >
                    {tShared("noResults")}
                  </td>
                </tr>
              ) : (
                checkins.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-2.5 font-semibold">
                      <ClipboardCheck className="me-1 inline h-4 w-4 text-success" />
                      {c.member?.first_name} {c.member?.last_name}
                    </td>
                    <td className="border-b border-border px-3 py-2.5 text-muted">
                      {formatTime(c.checkin_time)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold tracking-tight">
            {t("recentPayments")}
          </h3>
          <Link
            href="/sports-hall/finance"
            className="text-[13px] font-semibold text-accent hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  رقم الإيصال
                </th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  العضو
                </th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  المبلغ
                </th>
                <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  التاريخ
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-sm text-muted"
                  >
                    {tShared("noResults")}
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="border-b border-border px-3 py-2.5 font-semibold tabular-nums">
                      {p.receipt_number}
                    </td>
                    <td className="border-b border-border px-3 py-2.5">
                      {p.member?.first_name} {p.member?.last_name}
                    </td>
                    <td className="border-b border-border px-3 py-2.5 font-semibold text-success">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="border-b border-border px-3 py-2.5 text-muted">
                      {formatDate(p.paid_at)}
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
