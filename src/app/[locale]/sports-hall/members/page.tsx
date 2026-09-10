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

interface Member {
  id: string;
  member_code: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  status: string;
  birth_date: string | null;
}

export default function MembersPage() {
  const t = useTranslations("sportsHall.members");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    gender: "male",
    status: "pending",
    birth_date: "",
  });

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Member[] }>(
        "facility/sports-hall/members",
        { limit: "100", ...(search ? { search } : {}) },
        { silent: true },
      );
      setMembers(res.data || []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      gender: "male",
      status: "pending",
      birth_date: "",
    });
    setModalOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setForm({
      first_name: m.first_name,
      last_name: m.last_name,
      phone: m.phone || "",
      email: m.email || "",
      gender: m.gender || "male",
      status: m.status,
      birth_date: m.birth_date ? m.birth_date.slice(0, 10) : "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.first_name.trim().length < 2 || form.last_name.trim().length < 2) return;
    setSaving(true);
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone || undefined,
      email: form.email || undefined,
      gender: form.gender,
      status: form.status,
      birth_date: form.birth_date || undefined,
    };
    try {
      if (editing) {
        await api.put(`facility/sports-hall/members/${editing.id}`, payload);
      } else {
        await api.post("facility/sports-hall/members", payload);
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

  async function handleDelete(m: Member) {
    if (!window.confirm(tShared("delete"))) return;
    try {
      await api.delete(`facility/sports-hall/members/${m.id}`);
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

      <div className="mb-4 flex max-w-xs items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tShared("search")}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("code")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("fullName")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("phone")}
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
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold tabular-nums">
                        {m.member_code}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {m.first_name} {m.last_name}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {m.phone || "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <StatusBadge
                          status={m.status}
                          label={t(m.status as string) || m.status}
                        />
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                          >
                            <Pencil className="h-3 w-3" />
                            {tShared("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
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

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  الاسم الأول
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  الاسم الأخير
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("phone")}
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {t("gender")}
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  <option value="male">{t("male")}</option>
                  <option value="female">{t("female")}</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("email")}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">
                {t("birthDate")}
              </label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) =>
                  setForm({ ...form, birth_date: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold">
                {tShared("status")}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="pending">pending</option>
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactive")}</option>
                <option value="frozen">frozen</option>
                <option value="cancelled">cancelled</option>
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
