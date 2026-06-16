// ========================
// Learning Interactive Tabs
// Mục đích:
// - hiển thị tổng quan, tài liệu, ghi chú và thảo luận dưới bài học
// - dùng dữ liệu thật theo course/lesson và quyền học hiện tại
// ========================
import { useState } from 'react';
import { BookOpen, Clock3, Download, FileText, Loader2, MessageSquare, NotebookPen, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import {
  useCreateLearningNote,
  useDeleteLearningNote,
  useCreateLessonDiscussion,
  useLearningNotes,
  useLearningResources,
  useLessonDiscussions,
  useUpdateLearningNote,
} from '@/hooks/useLearningInteractions';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { ICourse, ILearningNote, ILesson } from '@/services/courseApi';

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
  onRequestPauseVideo,
}: {
  course: ICourse;
  lesson: ILesson;
  playbackTime: number;
  onRequestPauseVideo: () => void;
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
        {activeTab === 'overview' && <OverviewPanel lesson={lesson} />}
        {activeTab === 'resources' && <ResourcesPanel attachmentIds={lesson.attachments || []} />}
        {activeTab === 'notes' && (
          <NotesPanel
            courseId={course._id || ''}
            lessonId={lesson._id || ''}
            playbackTime={playbackTime}
            onRequestPauseVideo={onRequestPauseVideo}
          />
        )}
        {activeTab === 'discussions' && (
          <DiscussionsPanel courseId={course._id || ''} lessonId={lesson._id || ''} playbackTime={playbackTime} />
        )}
      </div>
    </section>
  );
}

function OverviewPanel({ lesson }: { lesson: ILesson }) {
  return (
    <div className="max-w-4xl">
      <div>
        <p className="text-xs font-semibold uppercase text-zinc-400">Bài học hiện tại</p>
        <h2 className="mt-1 text-xl font-bold">{lesson.title}</h2>
        {lesson.content ? (
          <div className="prose prose-sm mt-3 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Bài học chưa có mô tả.</p>
        )}
      </div>
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

type NoteComposerState =
  | { mode: 'create'; content: string; timestampSec: number }
  | { mode: 'edit'; noteId: string; content: string; timestampSec: number };

const EMPTY_NOTE_HTML = '<p></p>';

const stripRichText = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function NotesPanel({
  courseId,
  lessonId,
  playbackTime,
  onRequestPauseVideo,
}: {
  courseId: string;
  lessonId: string;
  playbackTime: number;
  onRequestPauseVideo: () => void;
}) {
  const notesQuery = useLearningNotes(courseId, lessonId);
  const createNote = useCreateLearningNote(courseId, lessonId);
  const updateNote = useUpdateLearningNote(courseId, lessonId);
  const deleteNote = useDeleteLearningNote(courseId, lessonId);
  const [composer, setComposer] = useState<NoteComposerState | null>(null);
  const currentTimestamp = Math.max(0, Math.floor(playbackTime || 0));
  const isMutating = createNote.isPending || updateNote.isPending || deleteNote.isPending;

  const openCreateComposer = () => {
    onRequestPauseVideo();
    setComposer({ mode: 'create', content: EMPTY_NOTE_HTML, timestampSec: currentTimestamp });
  };

  const openEditComposer = (note: ILearningNote) => {
    onRequestPauseVideo();
    setComposer({
      mode: 'edit',
      noteId: note._id,
      content: note.content || EMPTY_NOTE_HTML,
      timestampSec: note.timestampSec,
    });
  };

  const handleSubmit = () => {
    if (!composer) return;
    if (!stripRichText(composer.content)) return;

    if (composer.mode === 'create') {
      createNote.mutate(
        { content: composer.content, timestampSec: composer.timestampSec },
        { onSuccess: () => setComposer(null) },
      );
      return;
    }

    updateNote.mutate(
      {
        noteId: composer.noteId,
        content: composer.content,
        timestampSec: composer.timestampSec,
      },
      { onSuccess: () => setComposer(null) },
    );
  };

  const notes = notesQuery.data || [];
  const actionLabel =
    composer?.mode === 'edit' ? 'Lưu chỉnh sửa' : 'Tạo ghi chú';

  return (
    <div className="max-w-4xl space-y-5">
      <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-amber-50/60 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-amber-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Ghi chú bài học</p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">Lưu lại ý quan trọng theo từng mốc video</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Khi tạo ghi chú mới, video sẽ tạm dừng để bạn tập trung soạn nội dung.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateComposer}
            disabled={Boolean(composer)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            {`Thêm ghi chú tại ${formatTime(currentTimestamp)}`}
          </button>
        </div>
      </div>

      {composer && (
        <div className="rounded-3xl border border-primary/20 bg-white p-5 shadow-sm ring-1 ring-primary/10 dark:border-primary/25 dark:bg-zinc-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              <NotebookPen className="h-4 w-4 text-primary" />
              {composer.mode === 'edit' ? 'Chỉnh sửa ghi chú' : 'Ghi chú mới'}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTime(composer.timestampSec)}
            </div>
          </div>

          <RichTextEditor
            value={composer.content}
            onChange={(value) => setComposer((current) => (current ? { ...current, content: value } : current))}
            placeholder="Viết ghi chú của bạn tại mốc thời gian này..."
            minHeight="220px"
            disabled={isMutating}
          />

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setComposer(null)}
              disabled={isMutating}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isMutating || !stripRichText(composer.content)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(createNote.isPending || updateNote.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {actionLabel}
            </button>
          </div>
        </div>
      )}

      {notesQuery.isLoading ? (
        <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : notes.length ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <article
              key={note._id}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatTime(note.timestampSec)}
                  </span>
                  <span className="text-xs font-normal text-zinc-400">
                    {note.updatedAt ? `Cập nhật ${new Date(note.updatedAt).toLocaleString('vi-VN')}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditComposer(note)}
                    disabled={Boolean(composer) || isMutating}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-300 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote.mutate(note._id)}
                    disabled={Boolean(composer) || isMutating}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {deleteNote.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Xóa
                  </button>
                </div>
              </div>
              <div
                className="prose prose-sm mt-4 max-w-none text-zinc-700 dark:prose-invert dark:text-zinc-300"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={NotebookPen} message="Chưa có ghi chú nào cho bài học này." />
      )}
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
