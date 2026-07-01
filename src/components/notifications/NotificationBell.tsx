import { useEffect, useRef, useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '@/services/notificationApi';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import type { NotificationItem } from '@/types/notification.types';

type Props = { enabled?: boolean; allPath?: string };
export function NotificationBell({ enabled = true, allPath = '/notifications' }: Props) {
  const navigate = useNavigate(); const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false); const [items, setItems] = useState<NotificationItem[]>([]);
  const { count, refresh } = useUnreadNotifications(enabled);
  useEffect(() => { const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const toggle = async () => { const next = !open; setOpen(next); if (next) { try { setItems(await notificationApi.recent()); } catch { setItems([]); } } };
  const openItem = async (item: NotificationItem) => { if (!item.readAt) await notificationApi.markRead(item._id); setOpen(false); await refresh(); if (item.actionUrl) navigate(item.actionUrl); else navigate(allPath); };
  if (!enabled) return null;
  return <div ref={rootRef} className="relative">
    <button type="button" onClick={() => void toggle()} className="relative rounded-full p-2 hover:bg-secondary" aria-label="Thông báo"><Bell className="h-5 w-5"/>{count > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count > 99 ? '99+' : count}</span>}</button>
    {open && <div className="absolute right-0 top-12 z-[80] w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b p-4"><strong>Thông báo</strong><button className="text-xs text-primary" onClick={async()=>{await notificationApi.markAllRead();await refresh();setItems(v=>v.map(i=>({...i,readAt:new Date().toISOString()})));}}><Check className="mr-1 inline h-3 w-3"/>Đã đọc tất cả</button></div>
      <div className="max-h-[420px] overflow-y-auto">{items.length===0?<p className="p-8 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>:items.map(item=><button key={item._id} onClick={()=>void openItem(item)} className={`block w-full border-b p-4 text-left hover:bg-secondary/60 ${item.readAt?'':'bg-primary/5'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p><p className="mt-2 text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString('vi-VN')}</p></div>{item.priority==='HIGH'&&<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500"/>}</div></button>)}</div>
      <button onClick={()=>{setOpen(false);navigate(allPath);}} className="flex w-full items-center justify-center gap-2 p-3 text-sm font-medium text-primary hover:bg-secondary"><ExternalLink className="h-4 w-4"/>Xem tất cả</button>
    </div>}
  </div>;
}