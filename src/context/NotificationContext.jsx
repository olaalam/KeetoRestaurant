/**
 * NotificationContext
 *
 * Central store for real-time notifications.
 * - Manages the Socket.IO connection lifecycle.
 * - De-duplicates socket events vs FCM pushes by id.
 * - Exposes notifications list, unread badge count, and mutation helpers.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import useAuthStore from "@/store/useAuthStore";
import { hasPermission } from "@/lib/permissions";
import {
  connectSocket,
  disconnectSocket,
  onConnect,
  onConnectError,
  onNotification,
  onReconnect,
} from "@/services/socketService";

export const NOTIFICATIONS_QK = "restaurant-notifications";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token, isAuth } = useAuthStore((s) => s);
  const queryClient = useQueryClient();

  const canView = hasPermission(user, "notification", "View");

  // Local list (prepended by socket events; initial load from REST)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // De-duplication set
  const seenIds = useRef(new Set());

  // ── REST: fetch notification history ────────────────────────────────────
  const fetchNotifications = useCallback(
    async (opts = {}) => {
      if (!canView) return;
      setIsLoading(true);
      try {
        const { data } = await api.get("/api/restaurant/notifications", {
          params: { all: true, ...opts },
        });
        const list       = data?.data?.data   || data?.data   || [];
        const pagination = data?.data?.pagination || {};
        const unread     = pagination.unreadCount ?? list.filter((n) => !n.isRead).length;

        // Seed the de-duplication set so we don't double-pop old notifications
        list.forEach((n) => seenIds.current.add(n.id));

        setNotifications(list);
        setUnreadCount(unread);

        // Keep react-query cache in sync so other consumers (e.g. the old polling
        // in Layout) also get the fresh data without an extra network call.
        queryClient.setQueryData([NOTIFICATIONS_QK], data);
      } catch (err) {
        console.error("[Notifications] fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [canView, queryClient]
  );

  // ── REST: mark one as read ───────────────────────────────────────────────
  const markAsRead = useCallback(
    async (id) => {
      try {
        await api.put(`/api/restaurant/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QK] });
      } catch (err) {
        console.error("[Notifications] markAsRead error:", err);
      }
    },
    [queryClient]
  );

  // ── REST: mark all as read ───────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/api/restaurant/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QK] });
    } catch (err) {
      console.error("[Notifications] markAllAsRead error:", err);
    }
  }, [queryClient]);

  // ── Incoming socket notification ─────────────────────────────────────────
  const handleIncoming = useCallback(
    (n) => {
      const id = n.id;
      if (!id || seenIds.current.has(id)) return; // de-duplicate
      seenIds.current.add(id);

      setNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);

      // Invalidate so REST refetch picks it up too
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QK] });

      // Dispatch a custom event so Layout can react (play sound, show popup)
      // without prop-drilling through multiple levels.
      window.dispatchEvent(
        new CustomEvent("keeto:notification", { detail: n })
      );
    },
    [queryClient]
  );

  // ── Socket lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuth || !token || !canView) return;

    fetchNotifications();

    const socket = connectSocket();

    const unsubNotif    = onNotification(handleIncoming);
    const unsubConnect  = onConnect(() => setSocketConnected(true));
    const unsubError    = onConnectError(() => setSocketConnected(false));
    const unsubReconn   = onReconnect(() => {
      setSocketConnected(true);
      fetchNotifications(); // catch missed notifications
    });

    return () => {
      unsubNotif();
      unsubConnect();
      unsubError();
      unsubReconn();
    };
  }, [isAuth, token, canView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disconnect on logout
  useEffect(() => {
    if (!isAuth) {
      disconnectSocket();
      setNotifications([]);
      setUnreadCount(0);
      seenIds.current.clear();
      setSocketConnected(false);
    }
  }, [isAuth]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    socketConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
