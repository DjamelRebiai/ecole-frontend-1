"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, CheckCheck, AlertCircle, Info, AlertTriangle, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { notificationsApi } from "@/lib/api";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/AuthContext";

// ─── Types ───────────────────────────────────────────────
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  priority: "urgent" | "high" | "normal" | "low";
  link: string | null;
  created_at: string;
  actor: { full_name: string; email: string } | null;
  metadata: Record<string, unknown>;
}

// ─── Priority config ─────────────────────────────────────
const priorityConfig: Record<
  string,
  { color: string; bg: string; border: string; icon: typeof AlertCircle }
> = {
  urgent: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertCircle,
  },
  high: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertTriangle,
  },
  normal: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Info,
  },
  low: {
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: Info,
  },
};

// ─── Type labels ─────────────────────────────────────────
const typeLabels: Record<string, string> = {};

// ─── Time formatting ─────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} د`;
  if (diffHours < 24) return `منذ ${diffHours} س`;
  if (diffDays < 7) return `منذ ${diffDays} ي`;
  
  return date.toLocaleDateString("ar-DZ", {
    day: "numeric",
    month: "short",
  });
}

// ─── Main Component ──────────────────────────────────────
export function NotificationBell() {
  const { user } = useAuth();
  const isSchoolUser = user?.service_type === "school" || !!user?.school_id;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── جلب عدد غير المقروء ─────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // silent
    }
  }, []);

  // ─── جلب الإشعارات ────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ page: pageNum, limit: 15 });
      const items = res.data || [];

      if (append) {
        setNotifications((prev) => [...prev, ...items]);
      } else {
        setNotifications(items);
      }

      setHasMore(pageNum < res.total_pages);
      setPage(pageNum);

      // تحديث العدد غير المقروء بعد الجلب
      const unread = items.filter((n) => !n.is_read).length;
      if (!append) setUnreadCount(unread);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Initial load ──────────────────────────────────────
  useEffect(() => {
    if (isSchoolUser) fetchUnreadCount();
  }, [fetchUnreadCount, isSchoolUser]);

  // ─── Polling كل 30 ثانية ──────────────────────────────
  useEffect(() => {
    if (!isSchoolUser) return;

    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchUnreadCount, isSchoolUser]);

  // ─── فتح/غلق القائمة ──────────────────────────────────
  const toggleDropdown = async () => {
    if (!isOpen) {
      await fetchNotifications(1);
      if (isSchoolUser) fetchUnreadCount(); // تحديث العدد فوراً
    }
    setIsOpen(!isOpen);
  };

  // ─── إغلاق عند النقر خارجاً ────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ─── تحديد إشعار كمقروء ───────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  // ─── تحديد الكل كمقروء ─────────────────────────────────
  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  // ─── تحميل المزيد ──────────────────────────────────────
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // ─── Render ────────────────────────────────────────────
  if (!isSchoolUser) return null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* زر الجرس */}
      <button
        onClick={toggleDropdown}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted transition-all hover:border-primary hover:text-primary"
        aria-label="الإشعارات"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold leading-none text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div
          className={cn(
            "absolute start-1/2 z-[200] mt-2 w-[380px] -translate-x-1/2 rounded-xl border border-border bg-surface shadow-lg",
            "max-h-[520px] overflow-hidden"
          )}
        >
          {/* رأس القائمة */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">الإشعارات</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                  {unreadCount} غير مقروءة
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition hover:bg-bg hover:text-fg disabled:opacity-50"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {markingAll ? "..." : "تحديد الكل"}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted hover:bg-bg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* محتوى الإشعارات */}
          <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted">
                <Bell className="mb-2 h-10 w-10 opacity-30" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              <>
                {notifications.map((notif) => {
                  const config = priorityConfig[notif.priority] || priorityConfig.normal;
                  const Icon = config.icon;
                  const isUnread = !notif.is_read;

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "group relative border-b border-border/50 transition-colors",
                        isUnread ? "bg-[var(--bg-notification-unread,#f8fafc)]" : "bg-surface",
                        "hover:bg-bg"
                      )}
                    >
                      {/* مؤشر الأولوية - شريط جانبي */}
                      <div
                        className={cn(
                          "absolute start-0 top-0 h-full w-[3px]",
                          notif.priority === "urgent"
                            ? "bg-red-500"
                            : notif.priority === "high"
                              ? "bg-orange-400"
                              : isUnread
                                ? "bg-primary"
                                : "bg-transparent"
                        )}
                      />

                      {/* المحتوى - رابط */}
                      <Link
                        href={notif.link || "#"}
                        onClick={() => {
                          if (!notif.is_read) handleMarkAsRead(notif.id);
                        }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3",
                          isUnread ? "ps-5" : "ps-4"
                        )}
                      >
                        {/* أيقونة النوع */}
                        <div className={cn("mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg", config.bg)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>

                        {/* النص */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm leading-snug",
                                isUnread ? "font-semibold text-fg" : "font-medium text-muted"
                              )}
                            >
                              {notif.title}
                            </p>
                            <span className="shrink-0 text-[11px] text-muted/70">
                              {timeAgo(notif.created_at)}
                            </span>
                          </div>
                          {notif.message && (
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted/80">
                              {notif.message}
                            </p>
                          )}
                          {/* تاق النوع */}
                          <span className="mt-1 inline-block rounded bg-bg px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted/60">
                            {typeLabels[notif.type] || notif.type}
                          </span>
                        </div>
                      </Link>

                      {/* زر تحديد كمقروء (يظهر عند التحويم) */}
                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="absolute end-2 top-2 hidden rounded-md p-1 text-muted/50 transition hover:bg-bg hover:text-fg group-hover:block"
                          title="تحديد كمقروء"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* زر تحميل المزيد */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="flex w-full items-center justify-center py-3 text-sm font-medium text-accent transition hover:bg-bg disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "عرض المزيد"
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
