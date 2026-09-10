import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type VariantKey = "success" | "danger" | "warning" | "info" | "neutral";

const styles: Record<VariantKey, { bg: string; fg: string }> = {
  success: { bg: "var(--icon-bg-success)", fg: "var(--success)" },
  danger: { bg: "var(--icon-bg-danger)", fg: "var(--danger)" },
  warning: { bg: "var(--icon-bg-warning)", fg: "var(--warning)" },
  info: { bg: "var(--icon-bg-primary)", fg: "var(--info)" },
  neutral: { bg: "var(--bg)", fg: "var(--muted)" },
};

const variantByKey: Record<string, VariantKey> = {
  active: "success",
  paid: "success",
  present: "success",
  pending: "warning",
  partial: "warning",
  late: "warning",
  overdue: "danger",
  cancelled: "danger",
  expired: "danger",
  absent: "danger",
  excused: "info",
  boarding: "info",
  half_boarding: "warning",
  external: "neutral",
  open: "success",
  confirmed: "success",
  booked: "info",
  completed: "success",
  no_show: "danger",
  waitlist: "warning",
  frozen: "info",
  maintenance: "warning",
  pending_payment: "warning",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const variant = variantByKey[status] ?? "neutral";
  const { bg, fg } = styles[variant];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: bg, color: fg }}
    >
      {label ?? status}
    </span>
  );
}

export { variantByKey, styles as statusStyles };
