import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { inboxApi } from "@/services/inboxApi";
import {
  INBOX_REALTIME_EVENT,
  retainInboxSocket,
  type InboxRealtimeDetail,
} from "@/services/inboxSocket";
export function useInboxUnread(admin = false) {
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const userAuth = useAppSelector((state) => state.auth);
  const adminAuth = useAppSelector((state) => state.adminAuth);
  const activeAuth = admin ? adminAuth : userAuth;
  const canFetch = activeAuth.authResolved && activeAuth.isAuthenticated;

  useEffect(() => {
    if (!canFetch) {
      const timer = setTimeout(() => {
        setConnected(false);
        setCount(0);
      }, 0);
      return () => clearTimeout(timer);
    }
    return retainInboxSocket();
  }, [canFetch]);

  useEffect(() => {
    if (!canFetch) return;
    const load = () =>
      void inboxApi
        .unreadCount(admin)
        .then(setCount)
        .catch(() => undefined);
    load();
    const handler = (event: Event) => {
      const d = (event as CustomEvent<InboxRealtimeDetail>).detail;
      if (d.type === "status") setConnected(d.connected);
      if (d.type === "unread-count" && typeof d.count === "number")
        setCount(d.count);
      else if (
        [
          "reconcile",
          "ticket-new",
          "ticket-updated",
          "message-new",
          "read",
        ].includes(d.type)
      )
        load();
    };
    window.addEventListener(INBOX_REALTIME_EVENT, handler);
    return () => window.removeEventListener(INBOX_REALTIME_EVENT, handler);
  }, [admin, canFetch]);
  useEffect(() => {
    if (!canFetch || connected || document.hidden) return;
    const timer = setInterval(
      () =>
        void inboxApi
          .unreadCount(admin)
          .then(setCount)
          .catch(() => undefined),
      15000,
    );
    return () => clearInterval(timer);
  }, [admin, canFetch, connected]);
  return count;
}

