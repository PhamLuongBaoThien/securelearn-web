import { io, type Socket } from 'socket.io-client';
import { getAccessToken, getApiBaseUrl } from './apiClient';
import type { ILessonDiscussion } from './courseApi';

export const DISCUSSION_REALTIME_EVENT = 'course:discussion:realtime';
export type DiscussionRealtimeDetail =
  | { type: 'status'; connected: boolean }
  | { type: 'reconcile' }
  | { type: 'created' | 'updated' | 'deleted' | 'hidden'; item: ILessonDiscussion };

let socket: Socket | null = null;
let consumers = 0;
let activeSubscription: { courseId: string; lessonId: string } | null = null;

const dispatch = (detail: DiscussionRealtimeDetail) =>
  window.dispatchEvent(new CustomEvent<DiscussionRealtimeDetail>(DISCUSSION_REALTIME_EVENT, { detail }));

const subscribeActive = () => {
  if (socket?.connected && activeSubscription) {
    socket.emit('discussion:subscribe', activeSubscription);
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
  if (activeSubscription) socket?.emit('discussion:unsubscribe', activeSubscription);
  activeSubscription = { courseId, lessonId };
  subscribeActive();
  return () => {
    socket?.emit('discussion:unsubscribe', { courseId, lessonId });
    if (activeSubscription?.courseId === courseId && activeSubscription.lessonId === lessonId) {
      activeSubscription = null;
    }
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

