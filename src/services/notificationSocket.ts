import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { getAccessToken, getApiBaseUrl } from './apiClient';
import type { NotificationItem, NotificationSocketEvents } from '@/types/notification.types';

export const NOTIFICATION_REALTIME_EVENT = 'notification:realtime';
export type NotificationRealtimeDetail =
  | { type: 'status'; connected: boolean }
  | { type: 'reconcile' }
  | { type: 'new'; item: NotificationItem }
  | { type: 'read'; item: NotificationItem }
  | { type: 'read-all'; readAt: string }
  | { type: 'unread-count'; count: number }
  | { type: 'unread-delta'; delta: number };

let socket: Socket | null = null;
let consumers = 0;

const dispatch = (detail: NotificationRealtimeDetail) => {
  window.dispatchEvent(new CustomEvent<NotificationRealtimeDetail>(NOTIFICATION_REALTIME_EVENT, { detail }));
};

const bindSocket = (client: Socket) => {
  client.on('connect', () => {
    dispatch({ type: 'status', connected: true });
    dispatch({ type: 'reconcile' });
  });
  client.on('disconnect', () => dispatch({ type: 'status', connected: false }));
  client.on('connect_error', () => dispatch({ type: 'status', connected: false }));
  client.on('notification:new', (item: NotificationSocketEvents['notification:new']) => {
    dispatch({ type: 'new', item });
    if (item.priority === 'HIGH') toast.warning(item.title, { description: item.body });
    else toast.info(item.title, { description: item.body });
  });
  client.on('notification:read', (item: NotificationSocketEvents['notification:read']) => dispatch({ type: 'read', item }));
  client.on('notification:read-all', ({ readAt }: NotificationSocketEvents['notification:read-all']) => dispatch({ type: 'read-all', readAt }));
  client.on('notification:unread-count', ({ count }: NotificationSocketEvents['notification:unread-count']) => dispatch({ type: 'unread-count', count }));
};

const connect = () => {
  const token = getAccessToken();
  if (!token) return;
  if (!socket) {
    socket = io(getApiBaseUrl() || undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false,
      auth: callback => callback({ token: getAccessToken() }),
    });
    bindSocket(socket);
  }
  if (!socket.connected) socket.connect();
};

export const retainNotificationSocket = () => {
  consumers += 1;
  connect();
  return () => {
    consumers = Math.max(0, consumers - 1);
    if (consumers === 0) {
      socket?.disconnect();
      dispatch({ type: 'status', connected: false });
    }
  };
};

const reconnectWithFreshToken = () => {
  if (consumers === 0) return;
  socket?.disconnect();
  connect();
};

window.addEventListener('auth:token-updated', reconnectWithFreshToken);
window.addEventListener('auth:session-expired', () => {
  socket?.disconnect();
  dispatch({ type: 'status', connected: false });
});