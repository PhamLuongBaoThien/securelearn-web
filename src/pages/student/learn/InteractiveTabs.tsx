// ========================
// Learning Interactive Tabs
// Mục đích:
// - hiển thị tổng quan, tài liệu, ghi chú và thảo luận dưới bài học
// - dùng dữ liệu thật theo course/lesson và quyền học hiện tại
// ========================
import { useEffect, useState } from 'react';
import { BookOpen, Download, FileText, Loader2, MessageSquare, NotebookPen, Send } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useCreateLessonDiscussion,
  useLearningNote,
  useLearningResources,
  useLessonDiscussions,
  useSaveLearningNote,
} from '@/hooks/useLearningInteractions';
import type { ICourse, ILesson } from '@/services/courseApi';

type TabId = 'overview' | 'resources' | 'notes' | 'discussions';

const TABS = [
  { id: 'overview' as const, label: 'Tổng quan', icon: BookOpen },
  { id: 'resources' as const, label: 'Tài liệu', icon: FileText },
  { id: 'notes' as const, label: 'Ghi chú', icon: NotebookPen },
  { id: 'discussions' as const, label: 'Thảo luận', icon: MessageSquare },
];

const formatTime = (seconds: number) => {
  const normalized = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(normalized / 60)}:${String(normalized % 60).padStart(2, '0')}`;
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export function InteractiveTabs({
  course,
  lesson,
  playbackTime,
}: {
  course: ICourse;
  lesson: ILesson;
  playbackTime: number;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <section className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex overflow-x-auto border-b border-zinc-200 px-4 dark:border-zinc-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex min-w-max items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                active ? 'text-zinc-950 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />}
            </button>
          );
        })}
      </div>

      <div className="min-h-64 p-5 md:p-6">
        {activeTab === 'overview' && <OverviewPanel course={course} lesson={lesson} />}
        {activeTab === 'resources' && <ResourcesPanel attachmentIds={lesson.attachments || []} />}
        {activeTab === 'notes' && (
          <NotesPanel courseId={course._id || ''} lessonId={lesson._id || ''} playbackTime={playbackTime} />
        )}
        {activeTab === 'discussions' && (
          <DiscussionsPanel courseId={course._id || ''} lessonId={lesson._id || ''} playbackTime={playbackTime} />
        )}
      </div>
    </section>
  );
}

function OverviewPanel({ course, lesson }: { course: ICourse; lesson: ILesson }) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase text-zinc-400">Bài học hiện tại</p>
        <h2 className="mt-1 text-xl font-bold">{lesson.title}</h2>
        {lesson.content ? (
          <div className="prose prose-sm mt-3 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Bài học chưa có mô tả.</p>
        )}
      </div>
      {(course.whatYouWillLearn?.length || 0) > 0 && (
        <div>
          <h3 className="text-sm font-bold">Bạn sẽ học được</h3>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {(course.whatYouWillLearn || []).map((item) => (
              <li key={item} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResourcesPanel({ attachmentIds }: { attachmentIds: string[] }) {
  const resources = useLearningResources(attachmentIds);
  if (attachmentIds.length === 0) return <EmptyState icon={FileText} message="Bài học này chưa có tài liệu đính kèm." />;

  return (
    <div className="grid max-w-4xl gap-3 md:grid-cols-2">
      {resources.map((resource, index) => {
        if (resource.isLoading) {
          return <div key={attachmentIds[index]} className="flex h-20 items-center justify-center border"><Loader2 className="h-5 w-5 animate-spin" /></div>;
        }
        if (!resource.data) {
          return <div key={attachmentIds[index]} className="border border-red-200 p-4 text-sm text-red-600">Không thể tải tài liệu.</div>;
        }
        return (
          <a
            key={resource.data._id}
            href={resource.data.filePath}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{resource.data.originalFileName || 'Tài liệu bài học'}</p>
              <p className="mt-1 text-xs text-zinc-500">{formatBytes(resource.data.sizeBytes)}</p>
            </div>
            <Download className="h-4 w-4 text-zinc-400" />
          </a>
        );
      })}
    </div>
  );
}

function NotesPanel({ courseId, lessonId, playbackTime }: { courseId: string; lessonId: string; playbackTime: number }) {
  const noteQuery = useLearningNote(courseId, lessonId);
  const saveNote = useSaveLearningNote(courseId, lessonId);
  const [content, setContent] = useState('');
  const [edited, setEdited] = useState(false);
  const debouncedContent = useDebounce(content, 1000);

  useEffect(() => {
    setContent(noteQuery.data?.content || '');
    setEdited(false);
  }, [lessonId, noteQuery.data?.content]);

  useEffect(() => {
    if (!edited || saveNote.isPending) return;
    saveNote.mutate({ content: debouncedContent, timestampSec: playbackTime });
    setEdited(false);
  }, [debouncedContent, edited, playbackTime, saveNote]);

  return (
    <div className="max-w-3xl">
      <div className="mb-3 flex justify-between gap-3 text-xs text-zinc-500">
        <span>Mốc video: <strong className="font-mono text-primary">{formatTime(playbackTime)}</strong></span>
        <span>{saveNote.isPending ? 'Đang lưu...' : saveNote.isSuccess ? 'Đã lưu' : 'Tự động lưu'}</span>
      </div>
      <textarea
        value={content}
        onChange={(event) => { setContent(event.target.value); setEdited(true); }}
        rows={8}
        maxLength={10_000}
        placeholder="Viết ghi chú cá nhân cho bài học này..."
        className="w-full resize-y border border-zinc-300 bg-white p-4 text-sm outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900"
      />
    </div>
  );
}

function DiscussionsPanel({ courseId, lessonId, playbackTime }: { courseId: string; lessonId: string; playbackTime: number }) {
  const discussions = useLessonDiscussions(courseId, lessonId);
  const createDiscussion = useCreateLessonDiscussion(courseId, lessonId);
  const [content, setContent] = useState('');

  const submit = () => {
    if (!content.trim()) return;
    createDiscussion.mutate({ content, timestampSec: playbackTime }, { onSuccess: () => setContent('') });
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="border border-zinc-200 p-4 dark:border-zinc-800">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          maxLength={2_000}
          placeholder="Trao đổi với học viên và giảng viên về bài học..."
          className="w-full resize-none bg-transparent text-sm outline-none"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">Mốc {formatTime(playbackTime)}</span>
          <button
            type="button"
            onClick={submit}
            disabled={!content.trim() || createDiscussion.isPending}
            className="inline-flex h-9 items-center gap-2 bg-zinc-950 px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-950"
          >
            {createDiscussion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Đăng thảo luận
          </button>
        </div>
      </div>

      {discussions.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : discussions.data?.length ? (
        <div className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {discussions.data.map((item) => (
            <article key={item._id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold">{item.authorName || 'Người học'}</span>
                {item.authorRole === 'INSTRUCTOR' && <span className="bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Giảng viên</span>}
                <span className="font-mono text-xs text-primary">{formatTime(item.timestampSec)}</span>
                <span className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">{item.content}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={MessageSquare} message="Chưa có thảo luận nào cho bài học này." />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof FileText; message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center border border-dashed border-zinc-300 px-6 text-center dark:border-zinc-700">
      <Icon className="h-7 w-7 text-zinc-400" />
      <p className="mt-3 text-sm text-zinc-500">{message}</p>
    </div>
  );
}
