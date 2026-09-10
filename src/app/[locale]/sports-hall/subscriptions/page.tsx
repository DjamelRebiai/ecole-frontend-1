"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Snowflake, RefreshCcw, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { toast } from "sonner";

interface Subscription {
  id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_method: string | null;
  member: { first_name: string; last_name: string; member_code: string };
  plan: { name: string; price: number };
}

interface Member {
  id: string;
  member_code: string;
  first_name: string;
  last_name: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
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

export default function SubscriptionsPage() {
  const t = useTranslations("sportsHall.subscriptions");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    member_id: "",
    plan_id: "",
    start_date: "",
    payment_method: "cash",
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const [subRes, memRes, planRes] = await Promise.all([
        api.get<{ data: Subscription[] }>(
          "facility/sports-hall/subscriptions",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Member[] }>(
          "facility/sports-hall/members",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Plan[] }>(
          "facility/sports-hall/membership-plans",
          { limit: "100" },
          { silent: true },
        ),
      ]);
      setSubs(subRes.data || []);
      setMembers(memRes.data || []);
      setPlans(planRes.data || []);
    } catch {
      setSubs([]);
      setMembers([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.member_id || !form.plan_id) return;
    setSaving(true);
    try {
      await api.post("facility/sports-hall/subscriptions", {
        member_id: form.member_id,
        plan_id: form.plan_id,
        start_date: form.start_date || undefined,
        payment_method: form.payment_method,
      });
      setModalOpen(false);
      toast.success(t("title"));
      load();
    } catch {
      toast.error(tShared("save"));
    } finally {
      setSaving(false);
    }
  }

  async function action(
    id: string,
    op: "freeze" | "unfreeze" | "cancel" | "renew",
  ) {
    try {
      if (op === "freeze") {
        const days = window.prompt("عدد أيام التجميد", "7");
        if (!days) return;
        await api.post(`facility/sports-hall/subscriptions/${id}/freeze`, {
          days: Number(days),
        });
      } else {
        await api.post(`facility/sports-hall/subscriptions/${id}/${op}`);
      }
      toast.success(op);
      load();
    } catch {
      toast.error(op);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t("title") }]} />
      <PageHeader
        title={t("title")}
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            {t("title")}
          </button>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("member")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("plan")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("startDate")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("endDate")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {tShared("status")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {tShared("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  subs.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {s.member?.first_name} {s.member?.last_name}
                        <span className="ms-2 text-xs text-muted">
                          ({s.member?.member_code})
                        </span>
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {s.plan?.name} ({s.plan?.price} د.ج)
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {formatDate(s.start_date)}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {formatDate(s.end_date)}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge
                          status={s.status}
                          label={t(s.status as string) || s.status}
                        />
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <div className="flex gap-1">
                          {s.status === "active" && (
                            <button
                              onClick={() => action(s.id, "freeze")}
                              className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                            >
                              <Snowflake className="h-3 w-3" />
                              {t("freeze")}
                            </button>
                          )}
                          {s.status === "frozen" && (
                            <button
                              onClick={() => action(s.id, "unfreeze")}
                              className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              {t("unfreeze")}
                            </button>
                          )}
                          {(s.status === "active" || s.status === "frozen") && (
                            <button
                              onClick={() => action(s.id, "renew")}
                              className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              {t("renew")}
                            </button>
                          )}
                          <button
                            onClick={() => action(s.id, "cancel")}
                            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-danger hover:text-danger"
                          >
                            <X className="h-3 w-3" />
                            {t("cancel")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-lg)]"
          >
            <h3 className="mb-4 text-lg font-bold">{t("title")}</h3>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("member")}
              </label>
              <select
                value={form.member_id}
                onChange={(e) =>
                  setForm({ ...form, member_id: e.target.value })
                }
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.member_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("plan")}
              </label>
              <select
                value={form.plan_id}
                onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">—</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price} د.ج)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("startDate")}
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">
                طريقة الدفع
              </label>
              <select
                value={form.payment_method}
                onChange={(e) =>
                  setForm({ ...form, payment_method: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="cash">نقدي</option>
                <option value="card">بطاقة</option>
                <option value="transfer">تحويل</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70"
              >
                {saving ? tShared("loading") : tShared("save")}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-bg"
              >
                {tShared("cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
