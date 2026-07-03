import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useCourseLearning } from '@/hooks/useCourseLearning';
import { Eye, EyeOff, FilterX, Loader2, MessageSquare, Pin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { toast } from 'sonner';
import { formatExactDateTime, formatRelativeTime } from '@/lib/dateTime';
import {
  getCourseDiscussionsForInstructor,
  getLessonDiscussionReplies,
  moderateLessonDiscussion,
  pinLessonDiscussion,
  type IDiscussionPage,
  type ILessonDiscussion,
} from '@/services/courseApi';
import {
  DISCUSSION_REALTIME_EVENT,
  isDiscussionConnected,
  retainDiscussionSocket,
  subscribeDiscussionCourse,
  type DiscussionRealtimeDetail,
} from '@/services/discussionSocket';

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

const dedupe = (items: ILessonDiscussion[]) =>
  Array.from(new Map(items.map(item => [item._id, item])).values());

export function InstructorDiscussions() {
  const { courseId = '' } = useParams();
  const queryClient = useQueryClient();
  const courseQuery = useCourseLearning(courseId);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [hidden, setHidden] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [connected, setConnected] = useState(isDiscussionConnected());
  const [now, setNow] = useState(() => Date.now());

  const query = useInfiniteQuery({
    queryKey: ['instructor', 'course-discussions', courseId, search, hidden, lessonId],
    queryFn: async ({ pageParam }) => (
      await getCourseDiscussionsForInstructor(courseId, {
        cursor: pageParam || undefined,
        limit: 20,
        search: search || undefined,
        hidden: hidden || undefined,
        lessonId: lessonId || undefined,
      })
    ).data!,
    initialPageParam: '',
    getNextPageParam: page => page.hasMore ? page.nextCursor || undefined : undefined,
    enabled: Boolean(courseId),
  });

  const lessons = useMemo(() => (courseQuery.data?.sections || []).flatMap(section => section.lessons), [courseQuery.data?.sections]);
  const lessonNames = useMemo(() => new Map(lessons.map(lesson => [lesson._id || '', lesson.title])), [lessons]);

  const items = useMemo(
    () => dedupe(query.data?.pages.flatMap(page => page.items) || []),
    [query.data],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const release = retainDiscussionSocket();
    const unsubscribe = subscribeDiscussionCourse(courseId);
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DiscussionRealtimeDetail>).detail;
      if (detail.type === 'status') setConnected(detail.connected);
      if (detail.type === 'reconcile' || ('item' in detail && detail.item.courseId === courseId)) {
        void queryClient.invalidateQueries({ queryKey: ['instructor', 'course-discussions', courseId] });
      }
    };
    window.addEventListener(DISCUSSION_REALTIME_EVENT, handler);
    return () => {
      window.removeEventListener(DISCUSSION_REALTIME_EVENT, handler);
      unsubscribe();
      release();
    };
  }, [courseId, queryClient]);

  useEffect(() => {
    if (connected || document.hidden) return;
    const timer = window.setInterval(
      () => void queryClient.invalidateQueries({ queryKey: ['instructor', 'course-discussions', courseId] }),
      15_000,
    );
    return () => window.clearInterval(timer);
  }, [connected, courseId, queryClient]);

  const togglePin = async (item: ILessonDiscussion) => {
    try {
      await pinLessonDiscussion(courseId, item.lessonId, item._id, !item.pinnedAt);
      await queryClient.invalidateQueries({ queryKey: ['instructor', 'course-discussions', courseId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật ghim.');
    }
  };

  const toggleHidden = async (item: ILessonDiscussion) => {
    await moderateLessonDiscussion(courseId, item.lessonId, item._id, !item.hiddenAt);
    await queryClient.invalidateQueries({ queryKey: ['instructor', 'course-discussions', courseId] });
  };

  const resetFilters = () => {
    setSearchDraft('');
    setSearch('');
    setLessonId('');
    setHidden('');
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-4xl space-y-5">
        {/* Header */}
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-amber-50/60 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Quản lý thảo luận</p>
          <h1 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">Thảo luận khóa học</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi, phản hồi và kiểm duyệt bình luận trên toàn bộ bài học.
          </p>
        </div>

        {/* Filters */}
        <div className={`${cardClass} p-5`}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_180px_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchDraft}
                onChange={event => setSearchDraft(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && setSearch(searchDraft.trim())}
                placeholder="Tìm nội dung bình luận..."
                className="h-11 rounded-xl pl-10"
              />
            </div>
            <Select value={lessonId} onChange={event => setLessonId(event.target.value)} className="h-11 rounded-xl">
              <option value="">Tất cả bài học</option>
              {lessons.map(lesson => <option key={lesson._id} value={lesson._id}>{lesson.title}</option>)}
            </Select>
            <Select value={hidden} onChange={event => setHidden(event.target.value)} className="h-11 rounded-xl">
              <option value="">Tất cả trạng thái</option>
              <option value="false">Đang hiển thị</option>
              <option value="true">Đã ẩn</option>
            </Select>
            <Button type="button" variant="ghost" className="h-11 gap-2" onClick={resetFilters}>
              <FilterX className="h-4 w-4" />
              Xóa lọc
            </Button>
          </div>
        </div>

        {/* Discussion list */}
        {query.isLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : items.length ? (
          <div className="space-y-4">
            {items.map(item => (
              <DiscussionItem
                key={item._id}
                item={item}
                courseId={courseId}
                lessonName={lessonNames.get(item.lessonId) || item.lessonId}
                now={now}
                onTogglePin={() => void togglePin(item)}
                onToggleHidden={() => void toggleHidden(item)}
              />
            ))}
            {query.hasNextPage && (
              <Button
                variant="outline"
                className="w-full rounded-2xl"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xem thêm bình luận
              </Button>
            )}
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 text-center text-sm text-zinc-500 dark:border-zinc-700">
            <MessageSquare className="mb-3 h-8 w-8 opacity-40" />
            Không có bình luận phù hợp.
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ─── Discussion Item ─── */

function DiscussionItem({
  item,
  courseId,
  lessonName,
  now,
  onTogglePin,
  onToggleHidden,
}: {
  item: ILessonDiscussion;
  courseId: string;
  lessonName: string;
  now: number;
  onTogglePin: () => void;
  onToggleHidden: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`rounded-3xl border bg-white p-5 shadow-sm dark:bg-zinc-950 ${item.hiddenAt ? 'border-amber-300 dark:border-amber-800' : 'border-zinc-200 dark:border-zinc-800'}`}>
      <div className="flex gap-3">
        <UserAvatar user={{ fullName: item.authorName, avatarUrl: item.authorAvatarUrl }} className="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.authorName || 'Người học'}</span>
              {item.authorRole === 'INSTRUCTOR' && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Giảng viên</span>
              )}
              {item.hiddenAt && <span className="text-[10px] font-semibold text-amber-600">Đã ẩn</span>}
              {item.pinnedAt && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary"><Pin className="h-3 w-3 fill-current" />Đã ghim</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{lessonName}</span>
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

          {/* Reply-to indicator */}
          {item.parentId && item.replyToAuthorName && (
            <p className="mt-2 text-xs text-zinc-500">
              Trả lời <span className="font-semibold text-primary">{item.replyToAuthorName}</span>
            </p>
          )}

          {/* Content */}
          <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${item.deletedAt ? 'italic text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{item.content}</p>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.replyCount > 0 && (
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={() => setExpanded(value => !value)}>
                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                {expanded ? 'Ẩn phản hồi' : `Xem ${item.replyCount} phản hồi`}
              </Button>
            )}
            {item.parentId && <span className="text-xs text-zinc-400">Phản hồi</span>}
            {!item.parentId && !item.deletedAt && !item.hiddenAt && (
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={onTogglePin}>
                <Pin className={`mr-1 h-3.5 w-3.5 ${item.pinnedAt ? 'fill-current' : ''}`} />
                {item.pinnedAt ? 'Bỏ ghim' : 'Ghim'}
              </Button>
            )}
            {!item.deletedAt && (
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={onToggleHidden}>
                {item.hiddenAt ? <Eye className="mr-1 h-3.5 w-3.5" /> : <EyeOff className="mr-1 h-3.5 w-3.5" />}
                {item.hiddenAt ? 'Hiện lại' : 'Ẩn'}
              </Button>
            )}
          </div>

          {/* Replies */}
          {expanded && !item.parentId && (
            <ReplyList courseId={courseId} lessonId={item.lessonId} discussionId={item._id} now={now} />
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── Reply List (lazy-loaded) ─── */

function ReplyList({
  courseId,
  lessonId,
  discussionId,
  now,
}: {
  courseId: string;
  lessonId: string;
  discussionId: string;
  now: number;
}) {
  const replies = useInfiniteQuery({
    queryKey: ['instructor', 'course-discussions', courseId, 'replies', discussionId],
    queryFn: async ({ pageParam }) => (
      await getLessonDiscussionReplies(courseId, lessonId, discussionId, { cursor: pageParam || undefined, limit: 10 })
    ).data! as IDiscussionPage,
    initialPageParam: '',
    getNextPageParam: page => page.hasMore ? page.nextCursor || undefined : undefined,
  });

  const replyItems = useMemo(
    () => dedupe(replies.data?.pages.flatMap(page => page.items) || []),
    [replies.data],
  );

  if (replies.isLoading) {
    return (
      <div className="mt-4 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
      {replyItems.map(reply => (
        <article key={reply._id} className={`rounded-2xl border bg-zinc-50 p-4 dark:bg-zinc-900 ${reply.hiddenAt ? 'border-amber-300 dark:border-amber-800' : 'border-zinc-200 dark:border-zinc-800'}`}>
          <div className="flex gap-3">
            <UserAvatar user={{ fullName: reply.authorName }} className="h-8 w-8 text-[10px]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{reply.authorName || 'Người học'}</span>
                  {reply.authorRole === 'INSTRUCTOR' && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Giảng viên</span>
                  )}
                  {reply.hiddenAt && <span className="text-[10px] font-semibold text-amber-600">Đã ẩn</span>}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <time dateTime={reply.createdAt} className="cursor-help text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
                      {formatRelativeTime(reply.createdAt, now)}
                    </time>
                  </TooltipTrigger>
                  <TooltipContent>{formatExactDateTime(reply.createdAt)}</TooltipContent>
                </Tooltip>
              </div>
              {reply.replyToAuthorName && (
                <p className="mt-1 text-xs text-zinc-500">
                  Trả lời <span className="font-semibold text-primary">{reply.replyToAuthorName}</span>
                </p>
              )}
              <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${reply.deletedAt ? 'italic text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{reply.content}</p>
            </div>
          </div>
        </article>
      ))}
      {replies.hasNextPage && (
        <Button size="sm" variant="ghost" disabled={replies.isFetchingNextPage} onClick={() => void replies.fetchNextPage()}>
          {replies.isFetchingNextPage && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Xem thêm phản hồi
        </Button>
      )}
    </div>
  );
}
