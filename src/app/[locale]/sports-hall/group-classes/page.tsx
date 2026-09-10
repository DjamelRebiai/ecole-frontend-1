"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { toast } from "sonner";

interface GroupClass {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_capacity: number | null;
  is_active: boolean;
  hall: { name: string };
  trainer: { full_name: string };
}

interface Hall {
  id: string;
  name: string;
}

interface Trainer {
  id: string;
  full_name: string;
}

const DAY_NAMES = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

export default function GroupClassesPage() {
  const t = useTranslations("sportsHall.groupClasses");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GroupClass | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hall_id: "",
    trainer_id: "",
    day_of_week: "0",
    start_time: "09:00",
    end_time: "10:00",
    max_capacity: "",
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const [cRes, hRes, trRes] = await Promise.all([
        api.get<{ data: GroupClass[] }>(
          "facility/sports-hall/group-classes",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Hall[] }>(
          "facility/sports-hall/halls",
          { limit: "100" },
          { silent: true },
        ),
        api.get<{ data: Trainer[] }>(
          "facility/sports-hall/trainers",
          { limit: "100" },
          { silent: true },
        ),
      ]);
      setClasses(cRes.data || []);
      setHalls(hRes.data || []);
      setTrainers(trRes.data || []);
    } catch {
      setClasses([]);
      setHalls([]);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      hall_id: "",
      trainer_id: "",
      day_of_week: "0",
      start_time: "09:00",
      end_time: "10:00",
      max_capacity: "",
    });
    setModalOpen(true);
  }

  function openEdit(c: GroupClass) {
    setEditing(c);
    setForm({
      name: c.name,
      hall_id: c.hall
        ? halls.find((h) => h.name === c.hall.name)?.id || ""
        : "",
      trainer_id: c.trainer
        ? trainers.find((tr) => tr.full_name === c.trainer.full_name)?.id || ""
        : "",
      day_of_week: String(c.day_of_week),
      start_time: c.start_time.slice(0, 5),
      end_time: c.end_time.slice(0, 5),
      max_capacity: c.max_capacity != null ? String(c.max_capacity) : "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      hall_id: form.hall_id || undefined,
      trainer_id: form.trainer_id || undefined,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      max_capacity: form.max_capacity ? Number(form.max_capacity) : undefined,
    };
    try {
      if (editing) {
        await api.put(
          `facility/sports-hall/group-classes/${editing.id}`,
          payload,
        );
      } else {
        await api.post("facility/sports-hall/group-classes", payload);
      }
      setModalOpen(false);
      toast.success(editing ? tShared("save") : t("addNew"));
      load();
    } catch {
      toast.error(tShared("save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: GroupClass) {
    if (!window.confirm(tShared("delete"))) return;
    try {
      await api.delete(`facility/sports-hall/group-classes/${c.id}`);
      toast.success(tShared("delete"));
      load();
    } catch {
      toast.error(tShared("delete"));
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t("title") }]} />
      <PageHeader
        title={t("title")}
        actions={
          <button
            onClick={openCreate}
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
                    {t("name")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("hall")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("trainer")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("dayOfWeek")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("startTime")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("maxParticipants")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {tShared("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  classes.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {c.name}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {c.hall?.name || "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {c.trainer?.full_name || "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {DAY_NAMES[c.day_of_week] || c.day_of_week}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {c.start_time}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {c.max_capacity ?? "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(c)}
                            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                          >
                            <Pencil className="h-3 w-3" />
                            {tShared("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-danger hover:text-danger"
                          >
                            <Trash2 className="h-3 w-3" />
                            {tShared("delete")}
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
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-lg)]"
          >
            <h3 className="mb-4 text-lg font-bold">
              {editing ? tShared("edit") : t("addNew")}
            </h3>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("name")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("hall")}
                </label>
                <select
                  value={form.hall_id}
                  onChange={(e) =>
                    setForm({ ...form, hall_id: e.target.value })
                  }
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
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("trainer")}
                </label>
                <select
                  value={form.trainer_id}
                  onChange={(e) =>
                    setForm({ ...form, trainer_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  <option value="">—</option>
                  {trainers.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("dayOfWeek")}
              </label>
              <select
                value={form.day_of_week}
                onChange={(e) =>
                  setForm({ ...form, day_of_week: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {DAY_NAMES.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
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
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("maxParticipants")}
                </label>
                <input
                  type="number"
                  value={form.max_capacity}
                  onChange={(e) =>
                    setForm({ ...form, max_capacity: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
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
