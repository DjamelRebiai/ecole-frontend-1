"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LogIn, LogOut } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";
import { toast } from "sonner";

interface Checkin {
  id: string;
  member_id: string;
  checkin_time: string;
  checkout_time: string | null;
  member: { first_name: string; last_name: string; member_code: string };
}

function formatTime(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function CheckinsPage() {
  const t = useTranslations("sportsHall.checkins");
  const tShared = useTranslations("sportsHall.shared");
  const { setTitle } = usePageTitle();

  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCode, setMemberCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTitle(t("title"));
  }, [setTitle, t]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Checkin[]>(
        "facility/sports-hall/checkins/today",
        undefined,
        { silent: true },
      );
      setCheckins(res || []);
    } catch {
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (!memberCode) return;
    setSubmitting(true);
    try {
      // ابحث عن العضو بالرمز أولاً
      const res = await api.get<{
        data: { id: string; member_code: string }[];
      }>(
        "facility/sports-hall/members",
        { search: memberCode, limit: "5" },
        { silent: true },
      );
      const match = (res.data || []).find(
        (m) => m.member_code === memberCode.trim(),
      );
      if (!match) {
        toast.error("العضو غير موجود");
        return;
      }
      const result = await api.post<{ has_active_subscription: boolean }>(
        "facility/sports-hall/checkins",
        {
          member_id: match.id,
          method: "manual",
        },
      );
      setMemberCode("");
      toast.success(
        result.has_active_subscription
          ? "تم تسجيل الدخول"
          : "تم التسجيل بدون اشتراك نشط",
      );
      load();
    } catch {
      toast.error("تعذر تسجيل الدخول");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckout(memberId: string) {
    try {
      await api.post(`facility/sports-hall/members/${memberId}/checkout`);
      toast.success("تم تسجيل الخروج");
      load();
    } catch {
      toast.error("تعذر تسجيل الخروج");
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t("title") }]} />
      <PageHeader title={t("title")} />

      <form
        onSubmit={handleCheckin}
        className="mb-6 flex max-w-md items-center gap-2"
      >
        <input
          type="text"
          value={memberCode}
          onChange={(e) => setMemberCode(e.target.value)}
          placeholder={t("memberCode")}
          className="flex-1 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70"
        >
          <LogIn className="h-4 w-4" />
          {t("checkin")}
        </button>
      </form>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    العضو
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("checkinTime")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("checkoutTime")}
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {tShared("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {checkins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-sm text-muted"
                    >
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  checkins.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-2.5 font-semibold">
                        {c.member?.first_name} {c.member?.last_name}
                        <span className="ms-2 text-xs text-muted">
                          ({c.member?.member_code})
                        </span>
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {formatTime(c.checkin_time)}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {c.checkout_time ? formatTime(c.checkout_time) : "—"}
                      </td>
                      <td className="border-b border-border px-3 py-2.5">
                        {!c.checkout_time && (
                          <button
                            onClick={() => handleCheckout(c.member_id)}
                            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-danger hover:text-danger"
                          >
                            <LogOut className="h-3 w-3" />
                            {t("checkout")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
