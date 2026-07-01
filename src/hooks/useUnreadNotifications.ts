import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { notificationApi } from '@/services/notificationApi';
import {
  NOTIFICATION_REALTIME_EVENT,
  retainNotificationSocket,
  type NotificationRealtimeDetail,
} from '@/services/notificationSocket';

const UNREAD_CACHE_PREFIX = 'sl_notification_unread';

const readCachedCount = (recipientKey: string | null) => {
  if (!recipientKey) return 0;
  try {
    const value = Number(localStorage.getItem(`${UNREAD_CACHE_PREFIX}:${recipientKey}`));
    return Number.isInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
};

const cacheCount = (recipientKey: string | null, count: number) => {
  if (!recipientKey) return;
  try {
    localStorage.setItem(`${UNREAD_CACHE_PREFIX}:${recipientKey}`, String(count));
  } catch {
    // localStorage có thể bị chặn ở private mode; badge vẫn hoạt động trong phiên hiện tại.
  }
};

export const useUnreadNotifications = (enabled = true) => {
  const { pathname } = useLocation();
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const userAuth = useAppSelector(state => state.auth);
  const adminAuth = useAppSelector(state => state.adminAuth);
  const activeAuth = isAdminPath ? adminAuth : userAuth;
  const recipientKey = activeAuth.user?._id
    ? `${isAdminPath ? 'ADMIN' : 'USER'}:${activeAuth.user._id}`
    : null;
  const canFetch = enabled && activeAuth.authResolved && activeAuth.isAuthenticated && Boolean(recipientKey);
  const [count, setCountState] = useState(() => readCachedCount(recipientKey));
  const [socketConnected, setSocketConnected] = useState(false);

  const setCount = useCallback((next: number | ((current: number) => number)) => {
    setCountState(current => {
      const resolved = typeof next === 'function' ? next(current) : next;
      cacheCount(recipientKey, resolved);
      return resolved;
    });
  }, [recipientKey]);

  const refresh = useCallback(async () => {
    if (!canFetch || document.visibilityState !== 'visible') return;
    try {
      setCount(await notificationApi.unreadCount());
    } catch {
      // Giữ số gần nhất khi mạng/socket đang phục hồi, tránh badge nhấp nháy về 0.
    }
  }, [canFetch, setCount]);

  useEffect(() => {
    setCountState(readCachedCount(recipientKey));
  }, [recipientKey]);

  useEffect(() => {
    if (!canFetch) return;

    const releaseSocket = retainNotificationSocket();
    const handleRealtime = (event: Event) => {
      const detail = (event as CustomEvent<NotificationRealtimeDetail>).detail;
      if (detail.type === 'status') setSocketConnected(detail.connected);
      if (detail.type === 'unread-count') setCount(detail.count);
      if (detail.type === 'unread-delta') setCount(current => Math.max(0, current + detail.delta));
      if (detail.type === 'reconcile') void refresh();
    };
    window.addEventListener(NOTIFICATION_REALTIME_EVENT, handleRealtime);
    void refresh();
    return () => {
      releaseSocket();
      window.removeEventListener(NOTIFICATION_REALTIME_EVENT, handleRealtime);
    };
  }, [canFetch, refresh, setCount]);

  useEffect(() => {
    if (!canFetch || socketConnected) return;
    const timer = window.setInterval(() => void refresh(), 30000);
    const onVisibilityChange = () => void refresh();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [canFetch, refresh, socketConnected]);

  return { count, refresh, setCount, socketConnected };
};
