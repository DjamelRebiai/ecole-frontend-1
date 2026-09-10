"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { toast } from "sonner";

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  price: number | null;
  hall: { name: string };
  member: { first_name: string; last_name: string; member_code: string };
}

interface Hall {
  id: string;
  name: string;
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

function formatTime(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function BookingsPage() {
  const t = useTranslations("sportsHall.bookings");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hall_id: "",
    member_id: "",
    date: new Date().toISOString().slice(0, 10),
    start_time: "09:00",
    end_time: "10:00",
    price: "",
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const [bRes, hRes, mRes] = await Promise.all([
        api.get<{ data: Booking[] }>(
          "facility/sports-hall/bookings",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Hall[] }>(
          "facility/sports-hall/halls",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Member[] }>(
          "facility/sports-hall/members",
          { limit: "100" },
          { silent: true },
        ),
      ]);
      setBookings(bRes.data || []);
      setHalls(hRes.data || []);
      setMembers(mRes.data || []);
    } catch {
      setBookings([]);
      setHalls([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hall_id) return;
    setSaving(true);
    const start = `${form.date}T${form.start_time}:00`;
    const end = `${form.date}T${form.end_time}:00`;
    try {
      await api.post("facility/sports-hall/bookings", {
        hall_id: form.hall_id,
        member_id: form.member_id || undefined,
        start_time: start,
        end_time: end,
        price: form.price ? Number(form.price) : undefined,
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

  async function action(id: string, op: "cancel" | "complete") {
    try {
      await api.post(`facility/sports-hall/bookings/${id}/${op}`);
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
            {t("addNew")}
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
                    {t("hall")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("member")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("date")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("startTime")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("endTime")}
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
                {bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {b.hall?.name}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {b.member
                          ? `${b.member.first_name} ${b.member.last_name}`
                          : "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {formatDate(b.start_time)}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {formatTime(b.start_time)}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {formatTime(b.end_time)}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge
                          status={b.status}
                          label={t(b.status as string) || b.status}
                        />
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <div className="flex gap-1">
                          {b.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => action(b.id, "complete")}
                                className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-success hover:text-success"
                              >
                                <Check className="h-3 w-3" />
                                {t("complete")}
                              </button>
                              <button
                                onClick={() => action(b.id, "cancel")}
                                className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-danger hover:text-danger"
                              >
                                <X className="h-3 w-3" />
                                {t("cancel")}
                              </button>
                            </>
                          )}
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
            <h3 className="mb-4 text-lg font-bold">{t("addNew")}</h3>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("hall")}
              </label>
              <select
                value={form.hall_id}
                onChange={(e) => setForm({ ...form, hall_id: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">—</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("member")}
              </label>
              <select
                value={form.member_id}
                onChange={(e) =>
                  setForm({ ...form, member_id: e.target.value })
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

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("date")}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("startTime")}
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("endTime")}
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">
                السعر
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
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
