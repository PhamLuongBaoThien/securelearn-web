import { useEffect, useState } from 'react';
import { notificationApi } from '@/services/notificationApi';
export const useUnreadNotifications = () => { const [count, setCount] = useState(0); useEffect(() => { let active = true; const load = () => { if (document.visibilityState === 'visible')
    void notificationApi.unreadCount().then(v => { if (active)
        setCount(v); }).catch(() => undefined); }; load(); const timer = window.setInterval(load, 30000); document.addEventListener('visibilitychange', load); return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', load); }; }, []); return { count, refresh: () => notificationApi.unreadCount().then(setCount) }; };

