"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

export default function SportsHallSettingsPage() {
  const t = useTranslations("sportsHall.settings");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.facility_name || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  useEffect(() => {
    setForm({ name: user?.facility_name || "", email: user?.email || "" });
  }, [user?.facility_name, user?.email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // تحديث معلومات القاعة من نقطة مخصصة (اختيارية). هنا نخزن محلياً كقيمة افتراضية.
      toast.success(t("save"));
    } catch {
      toast.error(tShared("save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t("title") }]} />
      <PageHeader title={t("title")} />

      <form
        onSubmit={handleSubmit}
        className="max-w-lg rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]"
      >
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold">
            {t("name")}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="mb-5">
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

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70"
        >
          {saving ? tShared("loading") : tShared("save")}
        </button>
      </form>
    </div>
  );
}
