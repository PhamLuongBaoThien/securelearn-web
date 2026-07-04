import { io, type Socket } from 'socket.io-client';
import { getAccessToken, getApiBaseUrl } from './apiClient';
import type { ILessonDiscussion } from './courseApi';
import type { CourseAnnouncement } from './announcementApi';

export const DISCUSSION_REALTIME_EVENT = 'course:discussion:realtime';
export type DiscussionRealtimeDetail =
  | { type: 'status'; connected: boolean }
  | { type: 'reconcile' }
  | { type: 'created' | 'updated' | 'deleted' | 'hidden'; item: ILessonDiscussion }
  | { type: 'announcement'; action: 'published' | 'updated' | 'hidden' | 'pinned' | 'read' | 'unread-count'; item: CourseAnnouncement | Record<string, unknown> };

let socket: Socket | null = null;
let consumers = 0;
const activeSubscriptions = new Map<string, { courseId: string; lessonId: string; consumers: number }>();

const dispatch = (detail: DiscussionRealtimeDetail) =>
  window.dispatchEvent(new CustomEvent<DiscussionRealtimeDetail>(DISCUSSION_REALTIME_EVENT, { detail }));

const subscribeActive = () => {
  if (!socket?.connected) return;
  for (const { courseId, lessonId } of activeSubscriptions.values()) {
    socket.emit('discussion:subscribe', { courseId, lessonId });
  }
};

const bind = (client: Socket) => {
  client.on('connect', () => {
    dispatch({ type: 'status', connected: true });
    subscribeActive();
    dispatch({ type: 'reconcile' });
  });
  client.on('disconnect', () => dispatch({ type: 'status', connected: false }));
  client.on('connect_error', () => dispatch({ type: 'status', connected: false }));
  client.on('discussion:created', (item: ILessonDiscussion) => dispatch({ type: 'created', item }));
  client.on('discussion:updated', (item: ILessonDiscussion) => dispatch({ type: 'updated', item }));
  client.on('discussion:deleted', (item: ILessonDiscussion) => dispatch({ type: 'deleted', item }));
  client.on('discussion:hidden', (item: ILessonDiscussion) => dispatch({ type: 'hidden', item }));
  for (const action of ['published', 'updated', 'hidden', 'pinned', 'read', 'unread-count'] as const) {
    client.on(`announcement:${action}`, (item: CourseAnnouncement | Record<string, unknown>) => dispatch({ type: 'announcement', action, item }));
  }
};

const connect = () => {
  if (!getAccessToken()) return;
  if (!socket) {
    socket = io(getApiBaseUrl() || undefined, {
      path: '/course.socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false,
      auth: callback => callback({ token: getAccessToken() }),
    });
    bind(socket);
  }
  if (!socket.connected) socket.connect();
};

export const retainDiscussionSocket = () => {
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

export const subscribeDiscussionLesson = (courseId: string, lessonId: string) => {
  const key = `${courseId}:${lessonId}`;
  const current = activeSubscriptions.get(key);
  if (current) current.consumers += 1;
  else activeSubscriptions.set(key, { courseId, lessonId, consumers: 1 });
  if (socket?.connected && !current) socket.emit('discussion:subscribe', { courseId, lessonId });
  return () => {
    const active = activeSubscriptions.get(key);
    if (!active) return;
    active.consumers -= 1;
    if (active.consumers > 0) return;
    activeSubscriptions.delete(key);
    socket?.emit('discussion:unsubscribe', { courseId, lessonId });
  };
};

export const subscribeDiscussionCourse = (courseId: string) => {
  if (socket?.connected) socket.emit('discussion:subscribe-course', { courseId });
  const onConnect = () => socket?.emit('discussion:subscribe-course', { courseId });
  socket?.on('connect', onConnect);
  return () => {
    socket?.off('connect', onConnect);
    socket?.emit('discussion:unsubscribe', { courseId });
  };
};
export const isDiscussionConnected = () => Boolean(socket?.connected);

window.addEventListener('auth:token-updated', () => {
  if (!consumers) return;
  socket?.disconnect();
  connect();
});
window.addEventListener('auth:session-expired', () => {
  socket?.disconnect();
  dispatch({ type: 'status', connected: false });
});

