/**
 * socketService.js
 * Singleton Socket.IO client for the Restaurant Admin dashboard.
 * - Authenticates with the admin JWT from useAuthStore
 * - Receives "notification" events only (server pushes; admin never emits)
 * - Reconnects automatically; callers must refetch notification history on reconnect
 */

import { io } from "socket.io-client";
import useAuthStore from "@/store/useAuthStore";

let socket = null;
let reconnectCallbacks = new Set();
let connectCallbacks  = new Set();
let errorCallbacks    = new Set();
let notifCallbacks    = new Set();

function getToken() {
  return useAuthStore.getState().token;
}

/** Returns the shared socket instance (creates it on first call). */
export function getSocket() {
  return socket;
}

/** Connect (idempotent – safe to call multiple times). */
export function connectSocket() {
  if (socket?.connected) return socket;

  const token = getToken();
  if (!token) return null;

  // Disconnect stale socket before creating a fresh one
  if (socket) {
    socket.off();
    socket.disconnect();
  }

  const baseURL = import.meta.env.VITE_BASE_URL || window.location.origin;

  socket = io(baseURL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    console.log("[Socket] connected", socket.id);
    connectCallbacks.forEach((cb) => cb());
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket] connect_error:", err.message);
    errorCallbacks.forEach((cb) => cb(err));
  });

  socket.on("disconnect", (reason) => {
    console.warn("[Socket] disconnected:", reason);
  });

  socket.on("reconnect", () => {
    console.log("[Socket] reconnected – callers should refetch notification history");
    reconnectCallbacks.forEach((cb) => cb());
  });

  socket.on("notification", (n) => {
    notifCallbacks.forEach((cb) => cb(n));
  });

  return socket;
}

/** Cleanly disconnect and tear down the singleton. */
export function disconnectSocket() {
  if (socket) {
    socket.off();
    socket.disconnect();
    socket = null;
  }
}

// ── Callback registration (returns an unsubscribe fn) ──────────────────────

export function onNotification(cb) {
  notifCallbacks.add(cb);
  return () => notifCallbacks.delete(cb);
}

export function onReconnect(cb) {
  reconnectCallbacks.add(cb);
  return () => reconnectCallbacks.delete(cb);
}

export function onConnect(cb) {
  connectCallbacks.add(cb);
  return () => connectCallbacks.delete(cb);
}

export function onConnectError(cb) {
  errorCallbacks.add(cb);
  return () => errorCallbacks.delete(cb);
}
