import { io, type Socket } from "socket.io-client";
import { getAccessToken, getApiBaseUrl } from "./apiClient";
export const INBOX_REALTIME_EVENT = "inbox:realtime";
export type InboxRealtimeDetail =
  | { type: "status"; connected: boolean }
  | { type: "reconcile" }
  | { type: "ticket-new"; ticket: unknown }
  | { type: "ticket-updated"; ticket: unknown }
  | { type: "message-new"; payload: unknown }
  | {
      type: "typing";
      ticketId: string;
      typing: boolean;
      identityType: string;
      expiresAt: number;
    }
  | { type: "unread-count"; count: number | null }
  | {
      type: "read";
      ticketId: string;
      identityType: string;
      identityId: string;
    };
let socket: Socket | null = null,
  consumers = 0,
  activeTicket = "";
let connected = false,
  lastTypingAt = 0;
const dispatch = (detail: InboxRealtimeDetail) =>
  window.dispatchEvent(new CustomEvent(INBOX_REALTIME_EVENT, { detail }));
function bind(client: Socket) {
  client.on("connect", () => {
    connected = true;
    dispatch({ type: "status", connected: true });
    dispatch({ type: "reconcile" });
    if (activeTicket)
      client.emit("inbox:subscribe", { ticketId: activeTicket });
  });
  client.on("disconnect", () => {
    connected = false;
    dispatch({ type: "status", connected: false });
  });
  client.on("connect_error", () => {
    connected = false;
    dispatch({ type: "status", connected: false });
  });
  client.on("inbox:ticket:new", (ticket) =>
    dispatch({ type: "ticket-new", ticket }),
  );
  client.on("inbox:ticket:updated", (ticket) =>
    dispatch({ type: "ticket-updated", ticket }),
  );
  client.on("inbox:message:new", (payload) =>
    dispatch({ type: "message-new", payload }),
  );
  client.on("inbox:typing", (payload) =>
    dispatch({ type: "typing", ...payload }),
  );
  client.on("inbox:unread-count", ({ count }) =>
    dispatch({ type: "unread-count", count }),
  );
  client.on("inbox:read", (payload) => dispatch({ type: "read", ...payload }));
}
function connect() {
  if (!getAccessToken()) return;
  if (!socket) {
    socket = io(getApiBaseUrl() || undefined, {
      path: "/inbox.socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
      auth: (cb) => cb({ token: getAccessToken() }),
    });
    bind(socket);
  }
  if (!socket.connected) socket.connect();
}
export function retainInboxSocket() {
  consumers++;
  connect();
  return () => {
    consumers = Math.max(0, consumers - 1);
    if (!consumers) {
      socket?.disconnect();
      connected = false;
      dispatch({ type: "status", connected: false });
    }
  };
}
export function subscribeInboxTicket(ticketId: string) {
  if (activeTicket && activeTicket !== ticketId)
    socket?.emit("inbox:unsubscribe", { ticketId: activeTicket });
  activeTicket = ticketId;
  if (ticketId) socket?.emit("inbox:subscribe", { ticketId });
  return () => {
    if (activeTicket === ticketId) {
      socket?.emit("inbox:unsubscribe", { ticketId });
      activeTicket = "";
    }
  };
}
export const emitInboxTyping = (ticketId: string, typing: boolean) => {
  const now = Date.now();
  if (typing && now - lastTypingAt < 800) return;
  lastTypingAt = now;
  socket?.emit("inbox:typing", { ticketId, typing });
};
export const emitInboxReconcile = () => dispatch({ type: "reconcile" });
export const isInboxConnected = () => connected;
export const getActiveInboxTicket = () => activeTicket;
window.addEventListener("auth:token-updated", () => {
  if (consumers) {
    socket?.disconnect();
    connect();
  }
});
window.addEventListener("auth:session-expired", () => socket?.disconnect());
