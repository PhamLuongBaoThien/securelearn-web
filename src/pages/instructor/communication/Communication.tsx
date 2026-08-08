import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Eye, EyeOff, FilterX, Loader2, MessageSquare, Pencil, Pin, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';
import { createAnnouncement, listInstructorAnnouncements, setAnnouncementPinned, setAnnouncementVisibility, updateAnnouncement, type CourseAnnouncement } from '@/services/announcementApi';
import { DISCUSSION_REALTIME_EVENT, retainDiscussionSocket, type DiscussionRealtimeDetail } from '@/services/discussionSocket';
import { formatRelativeTime } from '@/lib/dateTime';
import { DiscussionManager } from '@/pages/instructor/courses';


const errorText = (error: unknown) => error instanceof Error ? error.message : 'Không thể thực hiện thao tác.';
const filterCardClass = 'rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

/* ================================================================
   AnnouncementHub – Đăng và quản lý thông báo khóa học
   ================================================================ */
function AnnouncementHub({ courses }: { courses: Array<{ _id?: string; title: string }> }) {
  const qc = useQueryClient();

  // --- Form state ---
  const [formCourseId, setFormCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<CourseAnnouncement | null>(null);
  const [notifyAgain, setNotifyAgain] = useState(false);

  // --- Filter state ---
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const query = useInfiniteQuery({
    queryKey: ['communication', 'announcements', filterCourseId, filterStatus, search],
    queryFn: ({ pageParam }) =>
      listInstructorAnnouncements({ cursor: pageParam || undefined, limit: 20, courseId: filterCourseId || undefined, status: filterStatus || undefined, search: search || undefined }),
    initialPageParam: '',
    getNextPageParam: p => p.hasMore ? p.nextCursor || undefined : undefined,
  });

  const items = useMemo(
    () => Array.from(new Map((query.data?.pages.flatMap(p => p.items) || []).map(x => [x._id, x])).values()),
    [query.data],
  );
  const refresh = () => qc.invalidateQueries({ queryKey: ['communication', 'announcements'] });

  const reset = () => { setEditing(null); setTitle(''); setContent(''); setNotifyAgain(false); };

  const submit = async () => {
    if (!formCourseId || !title.trim() || !content.replace(/<[^>]+>/g, '').trim()) {
      toast.error('Chọn khóa học và nhập đủ tiêu đề, nội dung.');
      return;
    }
    try {
      if (editing) await updateAnnouncement(editing.courseId, editing._id, { title, content, notifyAgain });
      else await createAnnouncement(formCourseId, { title, content });
      toast.success(editing ? 'Đã cập nhật thông báo.' : 'Đã đăng thông báo.');
      reset();
      await refresh();
    } catch (e) { toast.error(errorText(e)); }
  };

  const edit = (item: CourseAnnouncement) => {
    setEditing(item);
    setFormCourseId(item.courseId);
    setTitle(item.title);
    setContent(item.content);
    setNotifyAgain(false);
  };

  const hasActiveFilter = Boolean(filterCourseId || filterStatus || search);
  const resetFilters = () => { setFilterCourseId(''); setFilterStatus(''); setSearch(''); };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
      {/* ---------- Form panel ---------- */}
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div>
          <h3 className="font-bold">{editing ? 'Sửa thông báo' : 'Đăng thông báo mới'}</h3>
          <p className="text-sm text-muted-foreground">Thông báo được gửi ngay tới học viên của khóa học.</p>
        </div>
        <Select value={formCourseId} disabled={Boolean(editing)} onValueChange={e => setFormCourseId(e)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Chọn khóa học</SelectItem>
                      {courses.map(c => <SelectItem key={c._id} value={c._id!}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={180} placeholder="Tiêu đề thông báo" />
        <RichTextEditor value={content} onChange={setContent} minHeight="180px" placeholder="Nội dung cập nhật khóa học..." />
        {editing && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notifyAgain} onChange={e => setNotifyAgain(e.target.checked)} />
            Thông báo lại cho học viên
          </label>
        )}
        <div className="flex gap-2">
          <Button onClick={() => void submit()}>
            <Plus className="mr-1 h-4 w-4" />{editing ? 'Lưu thay đổi' : 'Đăng ngay'}
          </Button>
          {editing && <Button variant="outline" onClick={reset}>Hủy</Button>}
        </div>
      </section>

      {/* ---------- List panel ---------- */}
      <section className="space-y-4">
        {/* Filter bar */}
        <div className={filterCardClass}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm thông báo..."
                className="h-11 rounded-xl pl-10"
              />
            </div>
            <Select value={filterCourseId} onValueChange={e => setFilterCourseId(e)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả khóa học</SelectItem>
                              {courses.map(c => <SelectItem key={c._id} value={c._id!}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={e => setFilterStatus(e)}>
                <SelectTrigger className="h-11 flex-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Mọi trạng thái</SelectItem>
                                  <SelectItem value="PUBLISHED">Đang hiển thị</SelectItem>
                                  <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" className="h-11 shrink-0 gap-2" onClick={resetFilters} disabled={!hasActiveFilter}>
                <FilterX className="h-4 w-4" />
                Xóa lọc
              </Button>
            </div>
          </div>
        </div>

        {/* Announcement list */}
        {query.isLoading ? (
          <Loader2 className="mx-auto mt-16 animate-spin" />
        ) : items.length ? (
          <div className="space-y-3">
            {items.map(item => (
              <article key={item._id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.title}</h4>
                      {item.pinnedAt && <Pin className="h-4 w-4 fill-current text-primary" />}
                      {item.status === 'HIDDEN' && <span className="text-xs text-amber-600">Đã ẩn</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.courseTitle} · {formatRelativeTime(item.publishedAt)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => edit(item)}><Pencil className="h-4 w-4" /></Button>
                </div>
                <div className="prose prose-sm mt-3 max-w-none line-clamp-3 dark:prose-invert" dangerouslySetInnerHTML={{ __html: item.content }} />
                <div className="mt-3 flex gap-2">
                  {item.status === 'PUBLISHED' && (
                    <Button size="sm" variant="ghost" onClick={async () => { try { await setAnnouncementPinned(item.courseId, item._id, !item.pinnedAt); await refresh(); } catch (e) { toast.error(errorText(e)); } }}>
                      <Pin className={`mr-1 h-4 w-4 ${item.pinnedAt ? 'fill-current' : ''}`} />{item.pinnedAt ? 'Bỏ ghim' : 'Ghim'}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={async () => { try { await setAnnouncementVisibility(item.courseId, item._id, item.status === 'HIDDEN'); await refresh(); } catch (e) { toast.error(errorText(e)); } }}>
                    {item.status === 'HIDDEN' ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}{item.status === 'HIDDEN' ? 'Hiện lại' : 'Ẩn'}
                  </Button>
                </div>
              </article>
            ))}
            {query.hasNextPage && <Button variant="outline" className="w-full" onClick={() => void query.fetchNextPage()}>Xem thêm</Button>}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">Không có thông báo phù hợp.</div>
        )}
      </section>
    </div>
  );
}

/* ================================================================
   InstructorCommunication – Page shell
   ================================================================ */
export const InstructorCommunication = () => {
  const coursesQuery = useGetMyCourses();
  const courses = coursesQuery.data || [];
  const qc = useQueryClient();

  useEffect(() => {
    const release = retainDiscussionSocket();
    const handler = (e: Event) => {
      const d = (e as CustomEvent<DiscussionRealtimeDetail>).detail;
      if (d.type === 'reconcile' || d.type === 'announcement' || ['created', 'updated', 'deleted', 'hidden'].includes(d.type)) {
        void qc.invalidateQueries({ queryKey: ['communication'] });
      }
    };
    window.addEventListener(DISCUSSION_REALTIME_EVENT, handler);
    return () => { window.removeEventListener(DISCUSSION_REALTIME_EVENT, handler); release(); };
  }, [qc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Giao tiếp</h1>
        <p className="mt-1 text-muted-foreground">Quản lý thảo luận và thông báo của các khóa học.</p></div>
        <Button variant="outline" onClick={() => void Promise.all([coursesQuery.refetch(), qc.invalidateQueries({ queryKey: ['communication'] })])} disabled={coursesQuery.isFetching} className="gap-2" title="Làm mới dữ liệu giao tiếp">
          <RefreshCw className={`h-4 w-4 ${coursesQuery.isFetching ? 'animate-spin' : ''}`} /> Làm mới
        </Button>
      </div>
      <Tabs defaultValue="discussions">
        <TabsList>
          <TabsTrigger value="discussions">
            <MessageSquare className="mr-2 h-4 w-4" />Thảo luận
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Bell className="mr-2 h-4 w-4" />Thông báo khóa học
          </TabsTrigger>
        </TabsList>
        {coursesQuery.isLoading ? (
          <Loader2 className="mt-6 animate-spin" />
        ) : (
          <>
            <TabsContent value="discussions">
              <DiscussionManager courses={courses} />
            </TabsContent>
            <TabsContent value="announcements">
              <AnnouncementHub courses={courses} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};