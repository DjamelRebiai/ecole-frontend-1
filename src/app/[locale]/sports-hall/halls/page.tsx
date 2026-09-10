"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { toast } from "sonner";

interface Hall {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  hourly_rate: number | null;
  is_active: boolean;
  description: string | null;
}

interface HallRow extends Hall {}

const HALL_TYPES = [
  "gym",
  "yoga",
  "pool",
  "multi_purpose",
  "crossfit",
  "pilates",
  "spa",
  "climbing",
  "boxing",
  "other",
];

export default function HallsPage() {
  const t = useTranslations("sportsHall.halls");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [halls, setHalls] = useState<HallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "gym",
    capacity: "",
    hourly_rate: "",
    description: "",
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: HallRow[] }>(
        "facility/sports-hall/halls",
        { limit: "100" },
        { silent: true },
      );
      setHalls(res.data || []);
    } catch {
      setHalls([]);
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
      type: "gym",
      capacity: "",
      hourly_rate: "",
      description: "",
    });
    setModalOpen(true);
  }

  function openEdit(h: Hall) {
    setEditing(h);
    setForm({
      name: h.name,
      type: h.type,
      capacity: h.capacity != null ? String(h.capacity) : "",
      hourly_rate: h.hourly_rate != null ? String(h.hourly_rate) : "",
      description: h.description || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
      description: form.description || undefined,
    };
    try {
      if (editing) {
        await api.put(`facility/sports-hall/halls/${editing.id}`, payload);
      } else {
        await api.post("facility/sports-hall/halls", payload);
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

  async function handleDelete(h: Hall) {
    if (!window.confirm(tShared("delete"))) return;
    try {
      await api.delete(`facility/sports-hall/halls/${h.id}`);
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
                    {tShared("status")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("capacity")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("hourlyPrice")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {tShared("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {halls.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  halls.map((h) => (
                    <tr key={h.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {h.name}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge
                          status={h.is_active ? "active" : "closed"}
                          label={h.is_active ? t("open") : t("closed")}
                        />
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {h.capacity ?? "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {h.hourly_rate != null ? `${h.hourly_rate} د.ج` : "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(h)}
                            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                          >
                            <Pencil className="h-3 w-3" />
                            {tShared("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(h)}
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

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                النوع
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {HALL_TYPES.map((ht) => (
                  <option key={ht} value={ht}>
                    {ht}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("capacity")}
                </label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("hourlyPrice")}
                </label>
                <input
                  type="number"
                  value={form.hourly_rate}
                  onChange={(e) =>
                    setForm({ ...form, hourly_rate: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("description")}
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
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
