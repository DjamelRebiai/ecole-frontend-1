"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Send,
  ArrowRight,
  X,
  Building2,
  User,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

interface Sender {
  email: string;
}

interface LastMessage {
  content: string;
  created_at: string;
  sender?: Sender;
  sender_id?: string;
}

interface SupportTicket {
  id: string;
  school_id: string;
  school_name?: string | null;
  type: string;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  contact?: { full_name: string; email: string } | null;
  last_message?: LastMessage | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_email?: string | null;
}

interface ConversationDetail extends SupportTicket {
  participants: { id: string; user_id: string; role: string }[];
}

interface SchoolUser {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
}

interface School {
  id: string;
  name: string;
}

const typeLabels: Record<string, string> = {
  support: "دعم فني",
  direct: "مباشر",
  group: "مجموعة",
  announcement: "إعلان",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString("ar-DZ");
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ar-DZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SuperAdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    const [support, all] = await Promise.all([
      api.get<SupportTicket[]>("chat/conversations/support", {}, { silent: true }).catch(() => [] as SupportTicket[]),
      api.get<SupportTicket[]>("chat/conversations", {}, { silent: true }).catch(() => [] as SupportTicket[]),
    ]);

    const merged = new Map<string, SupportTicket>();
    for (const t of [...all, ...support]) {
      const prev = merged.get(t.id);
      merged.set(t.id, prev ? { ...t, ...prev } : t);
    }
    return [...merged.values()].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, []);

  const refreshTickets = useCallback(() => {
    fetchTickets()
      .then((list) => {
        setTickets(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchTickets]);

  const openConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      try {
        const [conv, msgs] = await Promise.all([
          api.get<ConversationDetail>(`chat/conversations/${id}`, {}, { silent: true }),
          api.get<ChatMessage[]>(`chat/conversations/${id}/messages`, {}, { silent: true }),
        ]);
        setDetail(conv);
        setMessages(msgs);
        api.post(`chat/conversations/${id}/read`, {}, { silent: true });
        setTickets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, unread_count: 0 } : t))
        );
      } catch {
        /* ignore */
      }
    },
    []
  );

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setDraft("");
    try {
      const msg = await api.post<ChatMessage>(
        `chat/conversations/${activeId}/messages`,
        { content: text },
        { silent: true }
      );
      setMessages((prev) => [...prev, msg]);
      refreshTickets();
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  }, [draft, activeId, sending, refreshTickets]);

  useEffect(() => {
    refreshTickets();
    const interval = setInterval(() => {
      setNow(Date.now());
      refreshTickets();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshTickets]);

  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await api.get<ChatMessage[]>(
          `chat/conversations/${activeId}/messages`,
          {},
          { silent: true }
        );
        setMessages(msgs);
      } catch {
        /* ignore */
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const filtered = tickets.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.title || "").toLowerCase().includes(q) ||
      (t.school_name || "").toLowerCase().includes(q) ||
      (t.contact?.full_name || "").toLowerCase().includes(q) ||
      (t.contact?.email || "").toLowerCase().includes(q) ||
      (t.last_message?.content || "").toLowerCase().includes(q)
    );
  });

  const totalTickets = tickets.filter((t) => t.type === "support").length;
  const unreadTickets = tickets.filter((t) => (t.unread_count || 0) > 0).length;
  const recentTickets = tickets.filter((t) => {
    const updated = new Date(t.updated_at);
    return now - updated.getTime() < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div>
      <PageHeader
        title="الدعم الفني — صندوق الوارد"
        subtitle="تابع طلبات المدارس وردّ عليها مباشرة"
        actions={
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            رسالة جديدة
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<MessageCircle className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-primary)"
          iconColor="var(--primary)"
          value={loading ? "..." : totalTickets}
          label="إجمالي التذاكر"
        />
        <StatCard
          icon={<AlertCircle className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-danger)"
          iconColor="var(--danger)"
          value={loading ? "..." : unreadTickets}
          label="غير مقروءة"
        />
        <StatCard
          icon={<Clock className="h-[22px] w-[22px]" />}
          iconBg="var(--icon-bg-warning)"
          iconColor="var(--warning)"
          value={loading ? "..." : recentTickets}
          label="نشطة في آخر 24 ساعة"
        />
      </div>

      <div className="flex h-[calc(100vh-320px)] min-h-[480px] overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
        {/* ===== List pane ===== */}
        <div className="flex w-full max-w-[360px] flex-col border-e border-border md:w-[360px]">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في التذاكر، المدارس، الرسائل..."
                className="w-full rounded-lg border border-border bg-bg py-2.5 pe-3 ps-9 text-sm outline-none transition focus:border-accent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid h-32 place-items-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                {search ? "لا توجد نتائج مطابقة" : "لا توجد محادثات بعد"}
              </p>
            ) : (
              filtered.map((t) => {
                const hasUnread = (t.unread_count || 0) > 0;
                const active = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => openConversation(t.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-start transition-colors",
                      active ? "bg-accent/10" : "hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-xs font-bold",
                        t.type === "support"
                          ? "bg-warning/10 text-warning"
                          : "bg-accent/10 text-accent"
                      )}
                    >
                      {t.type === "support" ? "د" : "م"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-muted" />
                          <span className="truncate text-[13px] font-bold text-fg">
                            {t.school_name || "مدرسة"}
                          </span>
                        </span>
                        <span className="flex-shrink-0 text-[11px] text-muted">
                          {timeAgo(t.updated_at)}
                        </span>
                      </div>

                      <div className="mt-0.5 truncate text-[13px] font-semibold text-fg">
                        {t.title || typeLabels[t.type] || "محادثة"}
                        <span className="ms-1.5 text-[10px] font-normal text-muted">
                          {typeLabels[t.type] || ""}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] text-muted">
                          {t.last_message?.content || "لا توجد رسائل بعد"}
                        </span>
                        {hasUnread && (
                          <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-white">
                            {t.unread_count! > 9 ? "9+" : t.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ===== Thread pane ===== */}
        <div className="flex flex-1 flex-col bg-bg/30">
          {detail ? (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-3">
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-fg">
                    <Building2 className="h-4 w-4 text-muted" />
                    <span className="truncate">{detail.school_name || "مدرسة"}</span>
                  </h3>
                  <p className="mt-0.5 truncate text-[12px] text-muted">
                    {detail.title || typeLabels[detail.type]}
                    {detail.contact?.full_name && ` • ${detail.contact.full_name}`}
                    {detail.contact?.email && ` (${detail.contact.email})`}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {messages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted">
                    لا توجد رسائل بعد — ابدأ المحادثة
                  </p>
                ) : (
                  <div className="space-y-1">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      const senderName =
                        detail.contact &&
                        (msg.sender_id === detail.created_by ||
                          (detail.type === "direct" &&
                            msg.sender_id !== user?.id))
                          ? detail.contact.full_name || detail.contact.email || "مدرسة"
                          : msg.sender_email === user?.email
                            ? "الدعم الفني"
                            : msg.sender_email || "مدرسة";
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex items-end gap-2",
                            isMine ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isMine && (
                            <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-warning/10 text-[10px] font-bold text-warning">
                              {senderName.charAt(0)}
                            </div>
                          )}
                          <div className={cn("max-w-[75%]", isMine && "items-end")}>
                            {!isMine && (
                              <span className="mb-0.5 block text-[11px] text-muted">
                                {senderName}
                              </span>
                            )}
                            <div
                              className={cn(
                                "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                                isMine
                                  ? "rounded-br-md bg-accent text-white"
                                  : "rounded-bl-md bg-surface text-fg shadow-[var(--shadow)]"
                              )}
                            >
                              {msg.content}
                            </div>
                            <span
                              className={cn(
                                "mt-0.5 block text-[10px] text-muted/70",
                                isMine ? "text-end" : "text-start"
                              )}
                            >
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-surface p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="اكتب رسالتك..."
                    rows={1}
                    className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl border border-border bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-accent"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent text-white transition hover:bg-accent-dark disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 rtl:rotate-180" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted/40" />
                <p className="text-sm font-semibold text-fg">اختر محادثة لعرضها</p>
                <p className="mt-1 text-[13px] text-muted">
                  افتح تذكرة من القائمة أو ابدأ محادثة جديدة
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
          onCreated={(conv) => {
            setShowNew(false);
            setActiveId(conv.id);
            refreshTickets();
            openConversation(conv.id);
          }}
        />
      )}
    </div>
  );
}

function NewConversationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conv: SupportTicket) => void;
}) {
  const [schools, setSchools] = useState<School[]>([]);
  const [usersBySchool, setUsersBySchool] = useState<Record<string, SchoolUser[]>>({});
  const [schoolId, setSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .get<School[] | { data: School[] }>("admin/schools?limit=100", {}, { silent: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setSchools(list);
      })
      .finally(() => setLoadingSchools(false));
  }, []);

  const users = schoolId ? usersBySchool[schoolId] || [] : [];

  useEffect(() => {
    if (!schoolId || usersBySchool[schoolId]) return;
    api
      .get<SchoolUser[]>(`admin/schools/${schoolId}/users`, {}, { silent: true })
      .then((list) => {
        setUsersBySchool((prev) => ({
          ...prev,
          [schoolId]: (list || []).filter((u) => u.auth_user_id),
        }));
      });
  }, [schoolId, usersBySchool]);

  const handleCreate = async () => {
    if (!userId || creating) return;
    setCreating(true);
    try {
      const conv = await api.post<SupportTicket>(
        "chat/conversations/direct",
        { other_user_id: userId },
        { silent: true }
      );
      onCreated(conv);
    } catch {
      /* handled by api client */
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight">محادثة جديدة</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted transition hover:bg-bg hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">المدرسة</label>
            {loadingSchools ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> جاري تحميل المدارس...
              </div>
            ) : (
              <select
                value={schoolId}
                onChange={(e) => {
                  setSchoolId(e.target.value);
                  setUserId("");
                }}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">اختر مدرسة...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">المستخدم</label>
            {!schoolId ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm text-muted">
                <User className="h-4 w-4" />
                اختر المدرسة أولاً
              </div>
            ) : !usersBySchool[schoolId] ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> جاري تحميل المستخدمين...
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm text-muted">
                <User className="h-4 w-4" />
                لا يوجد مستخدمون مسجلون في هذه المدرسة
              </div>
            ) : (
              <select
                key={schoolId}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">اختر مستخدم...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.auth_user_id!}>
                    {u.full_name}
                    {u.email ? ` (${u.email})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={!userId || creating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? "جاري الإنشاء..." : "بدء المحادثة"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
