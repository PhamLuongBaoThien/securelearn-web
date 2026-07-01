import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '@/services/notificationApi';
export const useUnreadNotifications = (enabled = true) => {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => { if (!enabled || document.visibilityState !== 'visible') return; try { setCount(await notificationApi.unreadCount()); } catch { setCount(0); } }, [enabled]);
  useEffect(() => { if (!enabled) return; void refresh(); const timer = window.setInterval(() => void refresh(), 30000); document.addEventListener('visibilitychange', refresh); return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); }; }, [enabled, refresh]);
  return { count, refresh, setCount };
};