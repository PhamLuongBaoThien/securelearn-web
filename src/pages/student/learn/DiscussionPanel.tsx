import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, MessageSquare, Pencil, Pin, Send, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  learningInteractionKeys,
  useCreateLessonDiscussion,
  useDeleteLessonDiscussion,
  useLessonDiscussionReplies,
  useLessonDiscussions,
  useModerateLessonDiscussion,
  usePinLessonDiscussion,
  useUpdateLessonDiscussion,
} from '@/hooks/useLearningInteractions';
import {
  DISCUSSION_REALTIME_EVENT,
  isDiscussionConnected,
  retainDiscussionSocket,
  subscribeDiscussionLesson,
  type DiscussionRealtimeDetail,
} from '@/services/discussionSocket';
import type { ILessonDiscussion } from '@/services/courseApi';
import { toast } from 'sonner';
import { formatExactDateTime, formatRelativeTime } from '@/lib/dateTime';

const dedupe = (items: ILessonDiscussion[]) =>
  Array.from(new Map(items.map(item => [item._id, item])).values());

export function DiscussionPanel({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const focusedId = searchParams.get('discussionId') || '';
  const discussions = useLessonDiscussions(courseId, lessonId, focusedId);
  const createDiscussion = useCreateLessonDiscussion(courseId, lessonId);
  const [content, setContent] = useState('');
  const [connected, setConnected] = useState(isDiscussionConnected());
  const [now, setNow] = useState(() => Date.now());
  const focusedScrollRef = useRef('');

  const scrollToFocusedItem = useCallback((discussionId: string) => {
    if (!discussionId || focusedScrollRef.current === discussionId) return;
    window.requestAnimationFrame(() => {
      if (focusedScrollRef.current === discussionId) return;
      const element = document.getElementById('discussion-' + discussionId);
      if (!element) return;
      focusedScrollRef.current = discussionId;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!focusedId || !discussions.data) return;
    scrollToFocusedItem(focusedId);
  }, [focusedId, discussions.data, scrollToFocusedItem]);
  const items = useMemo(
    () => dedupe(discussions.data?.pages.flatMap(page => page.items) || []),
    [discussions.data],
  );

  useEffect(() => {
    const release = retainDiscussionSocket();
    const unsubscribe = subscribeDiscussionLesson(courseId, lessonId);
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DiscussionRealtimeDetail>).detail;
      if (detail.type === 'status') setConnected(detail.connected);
      if (detail.type === 'reconcile' || ('item' in detail && detail.item.courseId === courseId && detail.item.lessonId === lessonId)) {
        void queryClient.invalidateQueries({ queryKey: learningInteractionKeys.discussions(courseId, lessonId) });
      }
    };
    window.addEventListener(DISCUSSION_REALTIME_EVENT, handler);
    return () => {
      window.removeEventListener(DISCUSSION_REALTIME_EVENT, handler);
      unsubscribe();
      release();
    };
  }, [courseId, lessonId, queryClient]);

  useEffect(() => {
    if (connected || document.hidden) return;
    const timer = window.setInterval(
      () => void queryClient.invalidateQueries({ queryKey: learningInteractionKeys.discussions(courseId, lessonId) }),
      15_000,
    );
    return () => window.clearInterval(timer);
  }, [connected, courseId, lessonId, queryClient]);

  const submit = () => {
    const normalized = content.trim();
    if (!normalized) return;
    createDiscussion.mutate(
      { content: normalized },
      {
        onSuccess: () => setContent(''),
        onError: error => toast.error(error instanceof Error ? error.message : 'Không thể đăng thảo luận.'),
      },
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-4xl space-y-5">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-amber-50/60 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Thảo luận bài học</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">Trao đổi cùng giảng viên và học viên</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Đặt câu hỏi, chia sẻ góc nhìn và trao đổi về nội dung bài học theo thời gian thực.
          </p>
        </div>

        <Composer
          value={content}
          onChange={setContent}
          onSubmit={submit}

          pending={createDiscussion.isPending}
          submitLabel="Đăng thảo luận"
        />

        {discussions.isLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : items.length ? (
          <div className="space-y-4">
            {items.map(item => (
              <DiscussionItem key={item._id} item={item} courseId={courseId} lessonId={lessonId} now={now} scrollToFocusedItem={scrollToFocusedItem} />
            ))}
            {discussions.hasNextPage && (
              <Button
                variant="outline"
                className="w-full rounded-2xl"
                disabled={discussions.isFetchingNextPage}
                onClick={() => void discussions.fetchNextPage()}
              >
                {discussions.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xem thêm bình luận
              </Button>
            )}
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 text-center text-sm text-zinc-500 dark:border-zinc-700">
            <MessageSquare className="mb-3 h-8 w-8 opacity-40" />
            Chưa có bình luận nào cho bài học này.
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function DiscussionItem({
  item,
  courseId,
  lessonId,
  now,
  scrollToFocusedItem,
}: {
  item: ILessonDiscussion;
  courseId: string;
  lessonId: string;
  now: number;
  scrollToFocusedItem: (discussionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(Boolean(item.focusReplyId));
  const [reply, setReply] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const isReply = Boolean(item.parentId);
  const replies = useLessonDiscussionReplies(courseId, lessonId, item.parentId || item._id, expanded && !isReply);
  const createReply = useCreateLessonDiscussion(courseId, lessonId);
  const update = useUpdateLessonDiscussion(courseId, lessonId);
  const remove = useDeleteLessonDiscussion(courseId, lessonId);
  const moderate = useModerateLessonDiscussion(courseId, lessonId);
  const pin = usePinLessonDiscussion(courseId, lessonId);
  const replyItems = dedupe(replies.data?.pages.flatMap(page => page.items) || []);

  useEffect(() => {
    if (!item.focusReplyId || !replyItems.length) return;
    scrollToFocusedItem(item.focusReplyId);
  }, [item.focusReplyId, replyItems, scrollToFocusedItem]);

  const submitReply = () => {
    if (!reply.trim()) return;
    createReply.mutate(
      { content: reply.trim(), parentId: item.parentId || item._id, replyToId: item._id },
      {
        onSuccess: () => {
          setReply('');
          setExpanded(true);
        },
        onError: error => toast.error(error instanceof Error ? error.message : 'Không thể trả lời.'),
      },
    );
  };

  const saveEdit = () => {
    if (!editContent.trim()) return;
    update.mutate(
      { discussionId: item._id, content: editContent.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <article id={'discussion-' + item._id} className={`rounded-3xl border bg-white p-5 shadow-sm dark:bg-zinc-950 ${item.hiddenAt ? 'border-amber-300 dark:border-amber-800' : 'border-zinc-200 dark:border-zinc-800'}`}>
      <div className="flex gap-3">
        <UserAvatar user={{ fullName: item.authorName, avatarUrl: item.authorAvatarUrl }} className="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.authorName || 'Người học'}</span>
              {item.authorRole === 'INSTRUCTOR' && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Giảng viên</span>
              )}
              {item.editedAt && <span className="text-[10px] text-zinc-400">Đã chỉnh sửa</span>}
              {item.hiddenAt && <span className="text-[10px] font-semibold text-amber-600">Đã ẩn</span>}
              {item.pinnedAt && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary"><Pin className="h-3 w-3 fill-current" />Đã ghim</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">

              <Tooltip>
                <TooltipTrigger asChild>
                  <time dateTime={item.createdAt} className="cursor-help transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
                    {formatRelativeTime(item.createdAt, now)}
                  </time>
                </TooltipTrigger>
                <TooltipContent>{formatExactDateTime(item.createdAt)}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {item.parentId && item.replyToAuthorName && (
            <button
              type="button"
              className="mt-2 text-xs text-zinc-500 hover:text-primary"
              onClick={() => item.replyToId && document.getElementById('discussion-' + item.replyToId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              Trả lời <span className="font-semibold text-primary">{item.replyToAuthorName}</span>
            </button>
          )}

          {editing ? (
            <div className="mt-3 space-y-2">
              <textarea value={editContent} onChange={event => setEditContent(event.target.value)} maxLength={2000} rows={3} className="w-full rounded-xl border bg-transparent p-3 text-sm outline-none focus:border-primary" />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={update.isPending}>Lưu</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
              </div>
            </div>
          ) : (
            <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${item.deletedAt || item.hiddenForViewer ? 'italic text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{item.content}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!item.deletedAt && (
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={() => setExpanded(true)}>Trả lời</Button>
            )}
            {item.replyCount > 0 && (
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={() => setExpanded(value => !value)}>
                {expanded ? 'Ẩn phản hồi' : 'Xem ' + item.replyCount + ' phản hồi'}
              </Button>
            )}
            {item.canEdit && <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={() => setEditing(true)}><Pencil className="mr-1 h-3.5 w-3.5" />Sửa</Button>}
            {item.canDelete && <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs text-destructive" onClick={() => remove.mutate(item._id)}><Trash2 className="mr-1 h-3.5 w-3.5" />Xóa</Button>}
            {item.canModerate && !item.parentId && !item.deletedAt && !item.hiddenAt && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-xl text-xs"
                disabled={pin.isPending}
                onClick={() => pin.mutate(
                  { discussionId: item._id, pinned: !item.pinnedAt },
                  { onError: error => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật ghim.') },
                )}
              >
                <Pin className={`mr-1 h-3.5 w-3.5 ${item.pinnedAt ? 'fill-current' : ''}`} />
                {item.pinnedAt ? 'Bỏ ghim' : 'Ghim'}
              </Button>
            )}
            {item.canModerate && !item.deletedAt && (
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={() => moderate.mutate({ discussionId: item._id, hidden: !item.hiddenAt })}>
                {item.hiddenAt ? <Eye className="mr-1 h-3.5 w-3.5" /> : <EyeOff className="mr-1 h-3.5 w-3.5" />}
                {item.hiddenAt ? 'Hiện lại' : 'Ẩn'}
              </Button>
            )}
          </div>

          {expanded && (
            <div className="mt-4 space-y-3 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
              <Composer value={reply} onChange={setReply} onSubmit={submitReply} pending={createReply.isPending} submitLabel="Trả lời" compact />
              {!isReply && (
                <>
                  {replies.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : replyItems.map(replyItem => (
                    <DiscussionItem key={replyItem._id} item={replyItem} courseId={courseId} lessonId={lessonId} now={now} scrollToFocusedItem={scrollToFocusedItem} />
                  ))}
                  {replies.hasNextPage && (
                    <Button size="sm" variant="ghost" disabled={replies.isFetchingNextPage} onClick={() => void replies.fetchNextPage()}>
                      Xem thêm phản hồi
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  submitLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'rounded-2xl border p-3' : 'rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950'}>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={compact ? 2 : 3}
        maxLength={2_000}
        placeholder={compact ? 'Viết phản hồi...' : 'Trao đổi về bài học...'}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400"
      />
      <div className="mt-2 flex items-center justify-end gap-3 border-t pt-2">
        <Button size="sm" onClick={onSubmit} disabled={!value.trim() || pending} className="rounded-xl">
          {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}{submitLabel}
        </Button>
      </div>
    </div>
  );
}





