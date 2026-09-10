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

interface Plan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export default function MembershipPlansPage() {
  const t = useTranslations("sportsHall.membershipPlans");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_days: "30",
    price: "",
    is_active: true,
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Plan[] }>(
        "facility/sports-hall/membership-plans",
        { limit: "100", includeInactive: "true" },
        { silent: true },
      );
      setPlans(res.data || []);
    } catch {
      setPlans([]);
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
      description: "",
      duration_days: "30",
      price: "",
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEdit(p: Plan) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      duration_days: String(p.duration_days),
      price: String(p.price),
      is_active: p.is_active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2 || !form.price) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description || undefined,
      duration_days: Number(form.duration_days),
      price: Number(form.price),
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await api.put(
          `facility/sports-hall/membership-plans/${editing.id}`,
          payload,
        );
      } else {
        await api.post("facility/sports-hall/membership-plans", payload);
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

  async function handleDelete(p: Plan) {
    if (!window.confirm(tShared("delete"))) return;
    try {
      await api.delete(`facility/sports-hall/membership-plans/${p.id}`);
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
              {t("noResults")}
            </div>
          ) : (
            plans.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]"
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h3 className="text-base font-bold tracking-tight">
                    {p.name}
                  </h3>
                  <StatusBadge
                    status={p.is_active ? "active" : "closed"}
                    label={p.is_active ? t("isActive") : tShared("status")}
                  />
                </div>
                <div className="px-5 py-4">
                  <div className="mb-1 text-2xl font-bold text-fg">
                    {p.price.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted">د.ج</span>
                  </div>
                  <div className="text-sm text-muted">
                    {t("duration")}: {p.duration_days}
                  </div>
                  {p.description && (
                    <p className="mt-2 text-sm text-muted">{p.description}</p>
                  )}
                </div>
                <div className="flex gap-2 border-t border-border px-5 py-3">
                  <button
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                  >
                    <Pencil className="h-3 w-3" />
                    {tShared("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-danger hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                    {tShared("delete")}
                  </button>
                </div>
              </div>
            ))
          )}
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
                  {t("duration")}
                </label>
                <input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm({ ...form, duration_days: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("price")}
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mb-4">
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

            <div className="mb-5 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label className="text-sm font-semibold">{t("isActive")}</label>
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
