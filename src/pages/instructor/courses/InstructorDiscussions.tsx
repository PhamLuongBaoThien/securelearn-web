import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useCourseLearning } from '@/hooks/useCourseLearning';
import { Eye, EyeOff, Loader2, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  getCourseDiscussionsForInstructor,
  moderateLessonDiscussion,
  type ILessonDiscussion,
} from '@/services/courseApi';
import {
  DISCUSSION_REALTIME_EVENT,
  isDiscussionConnected,
  retainDiscussionSocket,
  subscribeDiscussionCourse,
  type DiscussionRealtimeDetail,
} from '@/services/discussionSocket';

export function InstructorDiscussions() {
  const { courseId = '' } = useParams();
  const queryClient = useQueryClient();
  const courseQuery = useCourseLearning(courseId);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [hidden, setHidden] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [connected, setConnected] = useState(isDiscussionConnected());

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
    () => Array.from(new Map((query.data?.pages.flatMap(page => page.items) || []).map(item => [item._id, item])).values()),
    [query.data],
  );

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

  const toggleHidden = async (item: ILessonDiscussion) => {
    await moderateLessonDiscussion(courseId, item.lessonId, item._id, !item.hiddenAt);
    await queryClient.invalidateQueries({ queryKey: ['instructor', 'course-discussions', courseId] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <MessageSquare className="h-7 w-7 text-primary" />Thảo luận khóa học
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi, phản hồi và kiểm duyệt bình luận trên toàn bộ bài học.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={event => setSearchDraft(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && setSearch(searchDraft.trim())}
            placeholder="Tìm nội dung bình luận..."
            className="pl-9"
          />
        </div>
        <Select value={lessonId} onChange={event => setLessonId(event.target.value)} className="sm:w-52">
          <option value="">Tất cả bài học</option>
          {lessons.map(lesson => <option key={lesson._id} value={lesson._id}>{lesson.title}</option>)}
        </Select>        <Select value={hidden} onChange={event => setHidden(event.target.value)} className="sm:w-48">
          <option value="">Tất cả trạng thái</option>
          <option value="false">Đang hiển thị</option>
          <option value="true">Đã ẩn</option>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length ? (
        <div className="space-y-3">
          {items.map(item => (
            <article key={item._id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex gap-3">
                <UserAvatar user={{ fullName: item.authorName }} className="h-10 w-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold">{item.authorName || 'Người học'}</span>
                      <span className="ml-2 text-xs text-muted-foreground">Bài học: {lessonNames.get(item.lessonId) || item.lessonId}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className={`mt-2 whitespace-pre-wrap text-sm ${item.deletedAt ? 'italic text-muted-foreground' : ''}`}>{item.content}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {item.parentId && <span className="text-xs text-muted-foreground">Phản hồi</span>}
                    {item.replyCount > 0 && <span className="text-xs text-muted-foreground">{item.replyCount} phản hồi</span>}
                    {!item.deletedAt && (
                      <Button size="sm" variant="ghost" onClick={() => void toggleHidden(item)}>
                        {item.hiddenAt ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
                        {item.hiddenAt ? 'Hiện lại' : 'Ẩn'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
          {query.hasNextPage && (
            <Button variant="outline" className="w-full rounded-xl" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
              {query.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Xem thêm
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">Không có bình luận phù hợp.</div>
      )}
    </div>
  );
}

