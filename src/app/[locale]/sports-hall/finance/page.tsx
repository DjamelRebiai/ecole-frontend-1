"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { toast } from "sonner";

interface Payment {
  id: string;
  receipt_number: string;
  amount: number;
  paid_at: string;
  payment_method: string;
  member: { first_name: string; last_name: string; member_code: string };
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor: string | null;
  category: { name: string };
}

interface Member {
  id: string;
  member_code: string;
  first_name: string;
  last_name: string;
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

export default function FinancePage() {
  const t = useTranslations("sportsHall.finance");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"payments" | "expenses">("payments");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    member_id: "",
    amount: "",
    payment_method: "cash",
    description: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    category_id: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const [pRes, eRes, mRes, cRes] = await Promise.all([
        api.get<{ data: Payment[] }>(
          "facility/sports-hall/payments",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Expense[] }>(
          "facility/sports-hall/expenses",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Member[] }>(
          "facility/sports-hall/members",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ id: string; name: string }[]>(
          "facility/sports-hall/expense-categories",
          undefined,
          { silent: true },
        ),
      ]);
      setPayments(pRes.data || []);
      setExpenses(eRes.data || []);
      setMembers(mRes.data || []);
      setCategories(cRes || []);
    } catch {
      setPayments([]);
      setExpenses([]);
      setMembers([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!form_amount_valid) return;
    setSaving(true);
    try {
      await api.post("facility/sports-hall/payments", {
        member_id: paymentForm.member_id || undefined,
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        description: paymentForm.description || undefined,
      });
      setPaymentOpen(false);
      setPaymentForm({
        member_id: "",
        amount: "",
        payment_method: "cash",
        description: "",
      });
      toast.success(t("payment"));
      load();
    } catch {
      toast.error(tShared("save"));
    } finally {
      setSaving(false);
    }
  }

  const form_amount_valid =
    paymentForm.amount && Number(paymentForm.amount) > 0;

  async function handleExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.description || !(Number(expenseForm.amount) > 0)) return;
    setSaving(true);
    try {
      await api.post("facility/sports-hall/expenses", {
        category_id: expenseForm.category_id || undefined,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        expense_date: expenseForm.expense_date || undefined,
      });
      setExpenseOpen(false);
      setExpenseForm({
        category_id: "",
        description: "",
        amount: "",
        expense_date: new Date().toISOString().slice(0, 10),
      });
      toast.success(t("expense"));
      load();
    } catch {
      toast.error(tShared("save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t("title") }]} />
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              <ArrowDownCircle className="h-4 w-4" />
              {t("addPayment")}
            </button>
            <button
              onClick={() => setExpenseOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              <ArrowUpCircle className="h-4 w-4" />
              {t("addExpense")}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("payments")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "payments" ? "bg-accent text-white" : "border border-border text-muted hover:bg-bg"}`}
        >
          {t("payments")}
        </button>
        <button
          onClick={() => setTab("expenses")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "expenses" ? "bg-accent text-white" : "border border-border text-muted hover:bg-bg"}`}
        >
          {t("expenses")}
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : tab === "payments" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    رقم الإيصال
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("member")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("amount")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("method")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noPayments")}
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold tabular-nums">
                        {p.receipt_number}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {p.member?.first_name} {p.member?.last_name}{" "}
                        <span className="text-xs text-muted">
                          ({p.member?.member_code})
                        </span>
                      </td>
                      <td className="border-b border-border px-3 py-2.5 font-semibold text-success">
                        {p.amount.toLocaleString()} د.ج
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge
                          status={p.payment_method}
                          label={
                            t(p.payment_method as string) || p.payment_method
                          }
                        />
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
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("description")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("category")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("amount")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noExpenses")}
                    </td>
                  </tr>
                ) : (
                  expenses.map((ex) => (
                    <tr key={ex.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {ex.description}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {ex.category?.name || "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5 font-semibold text-danger">
                        {ex.amount.toLocaleString()} د.ج
                      </td>
                      <td className="border-b border-border px-3 py-2.5 text-muted">
                        {formatDate(ex.expense_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paymentOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handlePayment}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-lg)]"
          >
            <h3 className="mb-4 text-lg font-bold">{t("addPayment")}</h3>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("member")}
              </label>
              <select
                value={paymentForm.member_id}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, member_id: e.target.value })
                }
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

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("amount")}
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("method")}
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  <option value="cash">{t("cash")}</option>
                  <option value="card">{t("card")}</option>
                  <option value="transfer">{t("transfer")}</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("description")}
              </label>
              <input
                type="text"
                value={paymentForm.description}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !form_amount_valid}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70"
              >
                {saving ? tShared("loading") : tShared("save")}
              </button>
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-bg"
              >
                {tShared("cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {expenseOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleExpense}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-lg)]"
          >
            <h3 className="mb-4 text-lg font-bold">{t("addExpense")}</h3>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("description")}
              </label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("amount")}
                </label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("category")}
                </label>
                <select
                  value={expenseForm.category_id}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      category_id: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("date")}
              </label>
              <input
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    expense_date: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
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
                onClick={() => setExpenseOpen(false)}
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
