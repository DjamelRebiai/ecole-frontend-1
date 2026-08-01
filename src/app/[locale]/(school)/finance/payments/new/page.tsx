"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronUp, Loader2, Layers, Clock, CircleDollarSign, Wallet } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api/client";

interface PaymentDetail {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
}

interface FeeItem {
  key: string;
  type: "student_fee" | "template";
  student_fee_id?: string;
  fee_category_id?: string;
  label: string;
  frequency: string;
  class_name: string | null;
  amount: number;
  paid_amount: number;
  remaining: number;
  checked: boolean;
  status?: string;
  due_date?: string | null;
  due_day?: number | null;
}

const frequencyMap: Record<string, string> = {
  once: "مرة واحدة",
  monthly: "شهري",
  yearly: "سنوي",
};

const methodMap: Record<string, string> = {
  cash: "نقداً",
  check: "شيك",
  transfer: "تحويل بنكي",
};

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("ar-DZ");
}

function FrequencyBadge({ freq }: { freq: string }) {
  const label = frequencyMap[freq] || freq || "-";
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--icon-bg-primary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--info)]">
      <Clock className="me-1 h-3 w-3" />
      {label}
    </span>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-bold text-fg">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [feeAmount, setFeeAmount] = useState("");
  const [tuitionAmount, setTuitionAmount] = useState("");
  const [form, setForm] = useState({
    student_id: "", payment_method: "cash", notes: "",
  });

  useEffect(() => {
    api.get<any>("school/students?limit=200")
      .then((res) => setStudents(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.student_id) { setFees([]); setPayments([]); return; }
    setLoadingFees(true);
    api.get<any>(`school/students/${form.student_id}/statement`)
      .then((res) => {
        const existing = (res?.fees ?? []) as any[];
        const templates = (res?.available_templates ?? []) as any[];
        setPayments((res?.payments ?? []) as any[]);
        setExpanded(new Set());

        const items: FeeItem[] = [
          ...existing.map((f: any) => ({
            key: `fee_${f.id}`,
            type: "student_fee" as const,
            student_fee_id: f.id,
            fee_category_id: f.fee_category_id,
            label: f.fee_categories?.name || "رسم",
            frequency: f.frequency || f.fee_categories?.frequency || "",
            class_name: f.class_name || null,
            amount: Number(f.amount || 0),
            paid_amount: Number(f.paid_amount || 0),
            remaining: Number(f.amount || 0) - Number(f.paid_amount || 0),
            checked: false,
            status: f.status,
            due_date: f.due_date || null,
          })),
          ...templates.map((t: any) => ({
            key: `tmpl_${t.id}`,
            type: "template" as const,
            fee_category_id: t.fee_category_id,
            label: t.fee_categories?.name || "رسم",
            frequency: t.fee_categories?.frequency || "",
            class_name: t.classes?.name || null,
            amount: Number(t.amount || 0),
            paid_amount: 0,
            remaining: Number(t.amount || 0),
            checked: false,
            due_day: t.due_day ?? null,
          })),
        ];

        setFees(items);
        setFeeAmount("");
        setTuitionAmount("");
      })
      .catch(() => setFees([]))
      .finally(() => setLoadingFees(false));
  }, [form.student_id]);

  const toggleFee = useCallback((key: string) => {
    setFees((prev) => {
      const next = prev.map((f) => f.key === key ? { ...f, checked: !f.checked } : f);
      const total = next.filter((f) => f.checked).reduce((s, f) => s + f.remaining, 0);
      setFeeAmount(total > 0 ? String(total) : "");
      return next;
    });
  }, []);

  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const existingFees = useMemo(() => fees.filter((f) => f.type === "student_fee"), [fees]);
  const templates = useMemo(() => fees.filter((f) => f.type === "template"), [fees]);

  const groupedByClass = useMemo(() => {
    const groups = new Map<string, FeeItem[]>();
    for (const f of existingFees) {
      const key = f.class_name || "بدون فوج";
      groups.set(key, [...(groups.get(key) || []), f]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "ar"));
  }, [existingFees]);

  const paymentMap = useMemo(() => {
    const map = new Map<string, PaymentDetail[]>();
    for (const p of payments) {
      let key: string | undefined;
      if (p.student_fee_id) key = p.student_fee_id;
      else if (p.fee_category_id) key = `cat:${p.fee_category_id}`;
      if (!key) continue;
      map.set(key, [...(map.get(key) || []), p]);
    }
    return map;
  }, [payments]);

  const feeDetails = useMemo(() => {
    const map = new Map<string, PaymentDetail[]>();
    for (const f of existingFees) {
      const key = f.student_fee_id || `cat:${f.fee_category_id}`;
      map.set(f.key, paymentMap.get(key) || []);
    }
    return map;
  }, [existingFees, paymentMap]);

  const totalAmount = useMemo(() => existingFees.reduce((s, f) => s + f.amount, 0), [existingFees]);
  const totalPaid = useMemo(() => existingFees.reduce((s, f) => s + f.paid_amount, 0), [existingFees]);
  const totalRemaining = useMemo(() => existingFees.reduce((s, f) => s + f.remaining, 0), [existingFees]);

  const checkedFees = useMemo(() => fees.filter((f) => f.checked), [fees]);
  const selectedRemaining = useMemo(() => checkedFees.reduce((s, f) => s + f.remaining, 0), [checkedFees]);
  const numericFeeAmount = Number(feeAmount) || 0;
  const numericTuition = Number(tuitionAmount) || 0;
  const grandTotal = numericFeeAmount + numericTuition;

  const allocations = useMemo(() => {
    const result: { key: string; pay_amount: number }[] = [];
    let leftover = numericFeeAmount;
    const sorted = [...checkedFees].sort((a, b) => a.remaining - b.remaining);
    for (const f of sorted) {
      const pay = Math.min(leftover, f.remaining);
      result.push({ key: f.key, pay_amount: pay });
      leftover -= pay;
      if (leftover <= 0) break;
    }
    return result;
  }, [checkedFees, numericFeeAmount]);

  const allocMap = useMemo(() => Object.fromEntries(allocations.map((a) => [a.key, a.pay_amount])), [allocations]);
  const totalAllocated = allocations.reduce((s, a) => s + a.pay_amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkedFees.length && numericTuition <= 0) {
      setError("الرجاء اختيار رسم أو إدخال ثمن التدريس");
      return;
    }
    setSaving(true);
    setError("");

    const results: { ok: boolean; msg?: string }[] = [];

    for (const item of checkedFees) {
      const pay_amount = allocMap[item.key] || 0;
      if (pay_amount <= 0) continue;

      try {
        const payload: any = {
          student_id: form.student_id,
          amount: pay_amount,
          payment_method: form.payment_method,
          notes: form.notes || undefined,
        };

        if (item.type === "student_fee" && item.student_fee_id) {
          payload.student_fee_id = item.student_fee_id;
        } else if (item.fee_category_id) {
          payload.fee_category_id = item.fee_category_id;
          payload.fee_amount = item.amount;
        }

        await api.post("school/payments", payload);
        results.push({ ok: true });
      } catch (err: any) {
        results.push({ ok: false, msg: `${item.label}: ${err?.message || "فشل"}` });
      }
    }

    if (numericTuition > 0) {
      try {
        await api.post("school/payments", {
          student_id: form.student_id,
          amount: numericTuition,
          payment_method: form.payment_method,
          notes: (form.notes ? form.notes + " | " : "") + "ثمن التدريس",
        });
        results.push({ ok: true });
      } catch (err: any) {
        results.push({ ok: false, msg: `ثمن التدريس: ${err?.message || "فشل"}` });
      }
    }

    const failures = results.filter((r) => !r.ok);
    if (failures.length === 0) {
      router.push("/finance/payments");
    } else {
      setError(failures.map((f) => f.msg).join(" | "));
      setSaving(false);
    }
  }

  const selectedStudent = students.find((s) => s.id === form.student_id);

  return (
    <div>
      <PageHeader
        title="تسجيل دفعة جديدة"
        actions={
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="max-w-4xl space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">التلميذ <span className="text-red-500">*</span></label>
              <select
                value={form.student_id}
                required
                onChange={(e) => { setForm((f) => ({ ...f, student_id: e.target.value })); setError(""); }}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">-- اختر تلميذاً --</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.student_code || ""})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">طريقة الدفع <span className="text-red-500">*</span></label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="cash">نقداً</option>
                <option value="transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
              </select>
            </div>
          </div>
        </div>

        {form.student_id && (
          <>
            {loadingFees ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-muted shadow-[var(--shadow)]">
                <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل الرسوم...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
                    <p className="text-xs text-muted">إجمالي الرسوم</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-fg">{fmt(totalAmount)} د.ج</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
                    <p className="text-xs text-muted">المدفوع</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-[var(--success)]">{fmt(totalPaid)} د.ج</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
                    <p className="text-xs text-muted">المتبقي</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-[var(--danger)]">{fmt(totalRemaining)} د.ج</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
                    <p className="text-xs text-muted">عدد الدفعات</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-fg">{payments.length}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
                  <SectionTitle
                    icon={<Wallet className="h-4 w-4" />}
                    title="الرسوم الحالية"
                    subtitle={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name} — رسوم مسجلة في السنة الحالية` : undefined}
                  />

                  {existingFees.length === 0 ? (
                    <p className="py-4 text-sm text-muted">لا توجد رسوم مسجلة لهذا التلميذ بعد.</p>
                  ) : (
                    <div className="space-y-4">
                      {groupedByClass.map(([className, items]) => {
                        const gTotal = items.reduce((s, f) => s + f.amount, 0);
                        const gPaid = items.reduce((s, f) => s + f.paid_amount, 0);
                        const gRemaining = gTotal - gPaid;
                        const frequencies = [...new Set(items.map((f) => f.frequency).filter(Boolean))];
                        return (
                          <div key={className} className="overflow-hidden rounded-lg border border-border">
                            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-[var(--bg)] px-4 py-3">
                              <span className="text-sm font-bold text-fg">{className}</span>
                              <span className="rounded-full bg-[var(--icon-bg-primary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--info)]">
                                {items.length} رسم
                              </span>
                              {frequencies.map((freq) => <FrequencyBadge key={freq} freq={freq} />)}
                              <span className="ms-auto text-xs text-muted">
                                المتبقي: <span className="font-bold text-[var(--danger)]">{fmt(gRemaining)} د.ج</span>
                              </span>
                            </div>

                            <div className="divide-y divide-border">
                              {items.map((item) => {
                                const isExpanded = expanded.has(item.key);
                                const pay_amount = allocMap[item.key];
                                const details = feeDetails.get(item.key) || [];
                                const fullyPaid = item.remaining <= 0;
                                return (
                                  <div key={item.key}>
                                    <div className={`flex items-center gap-3 px-4 py-3 transition ${item.checked ? "bg-accent/5" : ""}`}>
                                      <input
                                        type="checkbox"
                                        checked={item.checked}
                                        disabled={fullyPaid}
                                        onChange={() => toggleFee(item.key)}
                                        className="h-4 w-4 shrink-0 rounded border-border accent-accent disabled:opacity-30"
                                        title={fullyPaid ? "رسم مسدد بالكامل" : undefined}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-sm font-semibold text-fg">{item.label}</span>
                                          {item.status && <StatusBadge status={item.status} />}
                                          {pay_amount > 0 && (
                                            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-bold text-accent">
                                              {fmt(pay_amount)} د.ج
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                                          {item.frequency && <span>{frequencyMap[item.frequency] || item.frequency}</span>}
                                          {item.due_date && <span>الاستحقاق: {fmtDate(item.due_date)}</span>}
                                          <span>المبلغ: {fmt(item.amount)} د.ج</span>
                                          <span className="text-[var(--success)]">المدفوع: {fmt(item.paid_amount)} د.ج</span>
                                          {item.remaining > 0 && (
                                            <span className="text-[var(--danger)]">المتبقي: {fmt(item.remaining)} د.ج</span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleExpand(item.key)}
                                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent"
                                      >
                                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                        تفاصيل
                                      </button>
                                    </div>

                                    {isExpanded && (
                                      <div className="bg-[var(--bg)] px-4 py-3">
                                        {details.length === 0 ? (
                                          <p className="py-1 text-xs text-muted">لا توجد دفعات مسجلة لهذا الرسم.</p>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                              <thead>
                                                <tr className="text-muted">
                                                  <th className="px-2 py-1.5 text-start font-semibold">الإيصال</th>
                                                  <th className="px-2 py-1.5 text-start font-semibold">التاريخ</th>
                                                  <th className="px-2 py-1.5 text-start font-semibold">الطريقة</th>
                                                  <th className="px-2 py-1.5 text-start font-semibold">المبلغ (د.ج)</th>
                                                  <th className="px-2 py-1.5 text-start font-semibold">ملاحظات</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {details.map((p) => (
                                                  <tr key={p.id} className="border-t border-border">
                                                    <td className="px-2 py-1.5 font-semibold">{p.receipt_number || "-"}</td>
                                                    <td className="px-2 py-1.5">{fmtDate(p.payment_date)}</td>
                                                    <td className="px-2 py-1.5">{methodMap[p.payment_method] || p.payment_method}</td>
                                                    <td className="px-2 py-1.5 font-semibold tabular-nums">{fmt(Number(p.amount))}</td>
                                                    <td className="px-2 py-1.5 text-muted">{p.notes || "-"}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
                  <SectionTitle
                    icon={<Layers className="h-4 w-4" />}
                    title="إضافة رسوم جديدة"
                    subtitle="رسوم قوالب الفوج لم تُسجل بعد لهذا التلميذ — اختيارها ينشئ رصيداً جديداً"
                  />
                  {templates.length === 0 ? (
                    <p className="py-4 text-sm text-muted">لا توجد رسوم جديدة متاحة — جميع قوالب الفوج مسجلة لهذا التلميذ.</p>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((item) => {
                        const pay_amount = allocMap[item.key];
                        return (
                          <div
                            key={item.key}
                            className={`rounded-lg border p-3 transition ${item.checked ? "border-accent bg-accent/5" : "border-border"}`}
                          >
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleFee(item.key)}
                                className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-fg">{item.label}</span>
                                  {item.frequency && <FrequencyBadge freq={item.frequency} />}
                                  {item.class_name && (
                                    <span className="rounded-full bg-[var(--icon-bg-warning)] px-2 py-0.5 text-[11px] font-semibold text-[var(--warning)]">
                                      {item.class_name}
                                    </span>
                                  )}
                                  {pay_amount > 0 && (
                                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-bold text-accent">
                                      {fmt(pay_amount)} د.ج
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                                  <span>{fmt(item.amount)} د.ج</span>
                                  {item.due_day && <span>الاستحقاق: يوم {item.due_day} من الشهر</span>}
                                  <span className="text-[var(--info)]">سيتم إنشاء رسم جديد</span>
                                </div>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
                  <SectionTitle
                    icon={<CircleDollarSign className="h-4 w-4" />}
                    title="المبالغ والدفع"
                    subtitle="أدخل المبلغ المراد تسجيله — يوزع تلقائياً على الرسوم المختارة"
                  />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="shrink-0 text-sm text-fg" style={{ minWidth: 120 }}>مبلغ الرسوم</label>
                      <input
                        type="number"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(e.target.value)}
                        placeholder="0"
                        className="w-32 rounded-md border border-border bg-bg px-3 py-2 text-left text-sm outline-none focus:border-accent"
                        min={0}
                      />
                      <span className="text-sm text-muted">د.ج</span>
                      {checkedFees.length > 0 && numericFeeAmount > 0 && (
                        <span className={`mr-auto text-xs ${numericFeeAmount < selectedRemaining ? "text-amber-600" : "text-green-600"}`}>
                          {numericFeeAmount >= selectedRemaining
                            ? "يغطي جميع الرسوم المختارة ✓"
                            : `المتبقي بعد الدفع: ${fmt(selectedRemaining - numericFeeAmount)} د.ج`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="shrink-0 text-sm text-fg" style={{ minWidth: 120 }}>ثمن التدريس</label>
                      <input
                        type="number"
                        value={tuitionAmount}
                        onChange={(e) => setTuitionAmount(e.target.value)}
                        placeholder="0"
                        className="w-32 rounded-md border border-border bg-bg px-3 py-2 text-left text-sm outline-none focus:border-accent"
                        min={0}
                      />
                      <span className="text-sm text-muted">د.ج</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-accent/10 px-4 py-2.5 text-sm font-bold">
                      <span>المجموع الكلي</span>
                      <span className="tabular-nums">{fmt(grandTotal)} د.ج</span>
                    </div>
                    {checkedFees.length > 0 && totalAllocated > 0 && (
                      <div className="text-xs text-muted">
                        سيتم توزيع {fmt(totalAllocated)} د.ج على الرسوم المختارة
                        {numericTuition > 0 && `، وتسجيل ${fmt(numericTuition)} د.ج كثمن تدريس`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-fg">ملاحظات</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !form.student_id || (!checkedFees.length && numericTuition <= 0)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "جارٍ الحفظ..." : "تسجيل الدفعة"}
          </button>
          <Link
            href="/finance/payments"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
