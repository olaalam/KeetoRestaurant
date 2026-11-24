/**
 * Notifications page – full history with pagination, read/unread filter,
 * and type-aware navigation.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/context/NotificationContext";
import useSidebarStore from "@/store/useSidebarStore";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 20;

const TYPE_ICON = {
  new_order:              "🛒",
  cancel:                 "❌",
  order_transferred:      "🔄",
  overdue_order_alert:    "⏰",
  payment_issue:          "💳",
  gateway_switch:         "🔀",
  points_redeem_approved: "✅",
  points_redeem_rejected: "🚫",
  weight_request_expired: "⚖️",
};

export default function Notifications() {
  const { t }         = useTranslation();
  const navigate      = useNavigate();
  const setActiveModule = useSidebarStore((s) => s.setActiveModule);
  const { markAllAsRead } = useNotifications();

  const [items, setItems]           = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, unreadCount: 0 });
  const [loading, setLoading]       = useState(false);
  const [filter, setFilter]         = useState("unread"); // "unread" | "all"
  const [page, setPage]             = useState(1);

  const fetchPage = useCallback(async (pg, flt) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: PAGE_LIMIT };
      if (flt === "unread") params.unreadOnly = true;
      else params.all = true;

      const { data } = await api.get("/api/restaurant/notifications", { params });
      const list = data?.data?.data || data?.data || [];
      const pag  = data?.data?.pagination || {};
      setItems(list);
      setPagination({
        page:        pag.page        || pg,
        totalPages:  pag.totalPages  || 1,
        unreadCount: pag.unreadCount || 0,
      });
    } catch (err) {
      console.error("[Notifications page] fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPage(1, filter);
  }, [filter, fetchPage]);

  const handlePageChange = (p) => {
    setPage(p);
    fetchPage(p, filter);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    fetchPage(page, filter);
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/restaurant/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setPagination((p) => ({ ...p, unreadCount: Math.max(0, p.unreadCount - 1) }));
    } catch {}
  };

  const handleClick = (n) => {
    if (!n.isRead) handleMarkRead(n.id);
    const type    = n.data?.type;
    const orderId = n.data?.orderId;

    if (type === "payment_issue" || type === "gateway_switch") {
      navigate("/visa-repo");
      return;
    }
    if (orderId) {
      navigate(`/orders/details/${orderId}`);
      return;
    }
    if (["new_order", "cancel", "order_transferred", "overdue_order_alert"].includes(type)) {
      navigate("/orders");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("notifications") || "Notifications"}
          </h1>
          {pagination.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5 min-w-[22px]">
              {pagination.unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter tabs */}
          {["unread", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {f === "unread" ? (t("unread") || "Unread") : (t("all") || "All")}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={pagination.unreadCount === 0}
            className="flex items-center gap-1.5 text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t("markAllRead") || "Mark all read"}
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            {t("loadingNotifications") || "Loading…"}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <Inbox className="w-10 h-10 opacity-30" />
            <span className="text-sm font-medium">
              {t("noNotifications") || "No notifications"}
            </span>
          </div>
        ) : (
          items.map((n) => {
            const icon = TYPE_ICON[n.data?.type] || "🔔";
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors",
                  n.isRead
                    ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    : "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex-none w-9 h-9 rounded-full flex items-center justify-center text-lg",
                    n.isRead
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "bg-blue-100 dark:bg-blue-900/50"
                  )}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        n.isRead
                          ? "font-medium text-slate-700 dark:text-slate-300"
                          : "font-bold text-slate-900 dark:text-slate-100"
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                        className="shrink-0 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors"
                      >
                        {t("markRead") || "Mark read"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {n.body}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    {new Date(n.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            {t("previous") || "Previous"}
          </Button>

          <span className="text-sm text-slate-500 font-medium">
            {page} / {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            {t("next") || "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
