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

interface Trainer {
  id: string;
  full_name: string;
  specialization: string[];
  hourly_rate: number | null;
  is_active: boolean;
}

export default function TrainersPage() {
  const t = useTranslations("sportsHall.trainers");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    specialization: "",
    hourly_rate: "",
    is_active: true,
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Trainer[] }>(
        "facility/sports-hall/trainers",
        { limit: "100" },
        { silent: true },
      );
      setTrainers(res.data || []);
    } catch {
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
      full_name: "",
      specialization: "",
      hourly_rate: "",
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEdit(tr: Trainer) {
    setEditing(tr);
    setForm({
      full_name: tr.full_name,
      specialization: (tr.specialization || []).join(", "),
      hourly_rate: tr.hourly_rate != null ? String(tr.hourly_rate) : "",
      is_active: tr.is_active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return;
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      specialization: form.specialization
        ? form.specialization
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await api.put(`facility/sports-hall/trainers/${editing.id}`, payload);
      } else {
        await api.post("facility/sports-hall/trainers", payload);
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

  async function handleDelete(tr: Trainer) {
    if (!window.confirm(tShared("delete"))) return;
    try {
      await api.delete(`facility/sports-hall/trainers/${tr.id}`);
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
                    {t("fullName")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("specialty")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("hourlyRate")}
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
                {trainers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  trainers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {tr.full_name}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {(tr.specialization || []).join(", ") || "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {tr.hourly_rate != null ? `${tr.hourly_rate} د.ج` : "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge
                          status={tr.is_active ? "active" : "closed"}
                          label={tr.is_active ? t("active") : t("inactive")}
                        />
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(tr)}
                            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                          >
                            <Pencil className="h-3 w-3" />
                            {tShared("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(tr)}
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
                {t("fullName")}
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
                minLength={2}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("specialty")}
              </label>
              <input
                type="text"
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
                placeholder="كمال أجسام, يوجا"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("hourlyRate")}
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

            <div className="mb-5 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label className="text-sm font-semibold">{t("active")}</label>
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
