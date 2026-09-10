"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api/client";

interface Facility {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  service_type: string | null;
  service_name: string | null;
  subscription_status: string;
  plan_name: string | null;
  member_count: number;
  is_school: boolean;
  created_at: string;
}

export default function FacilitiesPage() {
  const t = useTranslations("superAdmin.facilities");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any>("admin/facilities?limit=100")
      .then((res) => setFacilities(Array.isArray(res) ? res : (res.data ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(f: Facility) {
    try {
      await api.patch(`admin/facilities/${f.id}/toggle-active`);
      setFacilities((prev) =>
        prev.map((x) =>
          x.id === f.id ? { ...x, is_active: !x.is_active } : x,
        ),
      );
    } catch {}
  }

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("table.name")}
                </th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("table.type")}
                </th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("table.plan")}
                </th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("table.members")}
                </th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("table.subscription")}
                </th>
                <th className="border-b border-border px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("table.status")}
                </th>
                <th className="border-b border-border px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm text-muted"
                  >
                    {t("loading")}
                  </td>
                </tr>
              ) : facilities.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm text-muted"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                facilities.map((f) => {
                  const isSchool = f.service_type === "school";
                  return (
                    <tr key={f.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="border-b border-border px-3 py-3 font-semibold">
                        {f.name}
                      </td>
                      <td className="border-b border-border px-3 py-3">
                        <StatusBadge
                          status={isSchool ? "boarding" : "info"}
                          label={isSchool ? t("school") : t("sportsHall")}
                        />
                      </td>
                      <td className="border-b border-border px-3 py-3">
                        {f.plan_name ?? "—"}
                      </td>
                      <td className="border-b border-border px-3 py-3 tabular-nums">
                        {isSchool ? "—" : (f.member_count ?? 0)}
                      </td>
                      <td className="border-b border-border px-3 py-3">
                        <StatusBadge status={f.subscription_status} />
                      </td>
                      <td className="border-b border-border px-3 py-3">
                        <StatusBadge
                          status={f.is_active ? "active" : "closed"}
                          label={f.is_active ? t("active") : t("inactive")}
                        />
                      </td>
                      <td className="border-b border-border px-3 py-3">
                        <button
                          onClick={() => toggleActive(f)}
                          className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
                        >
                          {f.is_active ? t("deactivate") : t("activate")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
