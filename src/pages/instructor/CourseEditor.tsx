// ========================
// Instructor Course Editor: Chỉnh sửa chi tiết khóa học + Giáo trình
// Video upload inline per lesson — upload đi qua Media Service nền.
// ========================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetCourseForManage, useUpdateCourse, usePublishCourse } from '@/hooks/useInstructorCourses';
import { toast } from 'sonner';
import type { ICourse, ISection, ILesson } from '@/services/courseApi';
import { LessonVideoUploader } from './LessonVideoUploader';

export const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading, error } = useGetCourseForManage(courseId!);
  const updateMutation = useUpdateCourse();
  const publishMutation = usePublishCourse();

  // Local state cho form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<string>('BEGINNER');
  const [price, setPrice] = useState<number>(0);
  const [sections, setSections] = useState<ISection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  // Khởi tạo form từ API data
  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || '');
      setCategory(course.category || '');
      setLevel(course.level);
      setPrice(course.price);
      setSections(course.sections || []);
      setExpandedSections(new Set(course.sections?.map((_, i) => i) || []));
    }
  }, [course]);

  // ─── Tính số video chưa sẵn sàng ───
  const pendingVideos = sections
    .flatMap((s) => s.lessons)
    .filter(
      (l) =>
        l.type === 'VIDEO' &&
        (l.processingStatus === 'PENDING' || l.processingStatus === 'PROCESSING')
    );
  const hasBlockingVideos = pendingVideos.length > 0;

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        courseId: courseId!,
        payload: { title, description, category, level: level as ICourse['level'], price, sections },
      },
      {
        onSuccess: () => toast.success('Đã lưu khóa học!'),
        onError: (err: any) => toast.error(err.message || 'Lưu thất bại.'),
      }
    );
  };

  const handlePublish = () => {
    if (hasBlockingVideos) {
      toast.error(
        `Còn ${pendingVideos.length} video đang được xử lý. Vui lòng đợi hoàn tất trước khi xuất bản.`
      );
      return;
    }
    publishMutation.mutate(courseId!, {
      onSuccess: () => {
        toast.success('Khóa học đã được xuất bản!');
        navigate('/instructor/courses');
      },
      onError: (err: any) => toast.error(err.message),
    });
  };

  // ===== Section / Lesson Helpers =====
  const addSection = () => {
    const newSection: ISection = {
      title: `Chương ${sections.length + 1}: Chưa đặt tên`,
      order: sections.length + 1,
      lessons: [],
    };
    setSections([...sections, newSection]);
    setExpandedSections((prev) => new Set(prev).add(sections.length));
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSectionTitle = (index: number, newTitle: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], title: newTitle };
    setSections(updated);
  };

  const addLesson = (sectionIndex: number) => {
    const updated = [...sections];
    const lessons = updated[sectionIndex].lessons;
    const newLesson: ILesson = {
      title: `Bài ${lessons.length + 1}: Chưa đặt tên`,
      type: 'VIDEO',
      content: '',
      duration: 0,
      order: lessons.length + 1,
      processingStatus: 'NONE',
    };
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      lessons: [...lessons, newLesson],
    };
    setSections(updated);
  };

  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      lessons: updated[sectionIndex].lessons.filter((_, i) => i !== lessonIndex),
    };
    setSections(updated);
  };

  const updateLesson = (sectionIndex: number, lessonIndex: number, field: string, value: any) => {
    const updated = [...sections];
    const lessons = [...updated[sectionIndex].lessons];
    lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
    updated[sectionIndex] = { ...updated[sectionIndex], lessons };
    setSections(updated);
  };

  const handleLessonTypeChange = (sectionIndex: number, lessonIndex: number, newType: string) => {
    const updated = [...sections];
    const lessons = [...updated[sectionIndex].lessons];
    // Reset video fields khi đổi type khỏi VIDEO
    lessons[lessonIndex] = {
      ...lessons[lessonIndex],
      type: newType as ILesson['type'],
      ...(newType !== 'VIDEO' && {
        videoId: undefined,
        processingStatus: undefined,
        processingProgress: undefined,
        playbackUrl: undefined,
        videoFileName: undefined,
        videoDurationSec: undefined,
      }),
      ...(newType === 'VIDEO' && {
        processingStatus: 'NONE' as const,
      }),
    };
    updated[sectionIndex] = { ...updated[sectionIndex], lessons };
    setSections(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-32">
        <p className="text-destructive font-medium">{(error as Error)?.message || 'Không tìm thấy khóa học.'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/instructor/courses')}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/instructor/courses')} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Chỉnh sửa khóa học</h1>
              {getStatusBadge(course.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">ID: {courseId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Video processing warning */}
          {hasBlockingVideos && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              {pendingVideos.length} video đang xử lý
            </div>
          )}
          <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-xl">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu
          </Button>
          {course.status === 'DRAFT' && (
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className={`gap-2 rounded-xl ${hasBlockingVideos ? 'opacity-60' : ''}`}
              title={hasBlockingVideos ? 'Đợi video xử lý xong để xuất bản' : ''}
            >
              {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Xuất bản
              {hasBlockingVideos && <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
            </Button>
          )}
        </div>
      </div>

      {/* Course Info Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Thông tin chung</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Tên khóa học</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl" placeholder="Nhập tên khóa học..." />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] p-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Mô tả ngắn gọn về khóa học..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Danh mục</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-xl" placeholder="VD: Phát triển Web" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Trình độ</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="BEGINNER">Cơ bản</option>
              <option value="INTERMEDIATE">Trung cấp</option>
              <option value="ADVANCED">Nâng cao</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Giá (VND)</label>
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="h-11 rounded-xl" min={0} step={1000} />
          </div>
        </div>
      </div>

      {/* Curriculum / Sections */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Giáo trình</h2>
            {hasBlockingVideos && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {pendingVideos.length} video đang được mã hóa — khóa học sẽ xuất bản được khi xong
              </p>
            )}
          </div>
          <Button variant="outline" onClick={addSection} className="gap-2 rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Thêm chương
          </Button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Chưa có chương nào. Hãy thêm chương đầu tiên!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                {/* Section Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  onClick={() => toggleSection(sIdx)}
                >
                  <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                  <Input
                    value={section.title}
                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 text-sm font-medium border-none bg-transparent p-0 focus-visible:ring-0"
                  />
                  <Badge variant="secondary" className="shrink-0 text-xs">{section.lessons.length} bài</Badge>
                  <button onClick={(e) => { e.stopPropagation(); removeSection(sIdx); }} className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedSections.has(sIdx)
                    ? <ChevronUp className="w-4 h-4 shrink-0 text-zinc-400" />
                    : <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />
                  }
                </div>

                {/* Lessons */}
                {expandedSections.has(sIdx) && (
                  <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                    {section.lessons.map((lesson, lIdx) => (
                      <LessonRow
                        key={lIdx}
                        lesson={lesson}
                        sectionIndex={sIdx}
                        lessonIndex={lIdx}
                        onUpdateField={(field, value) => updateLesson(sIdx, lIdx, field, value)}
                        onChangeType={(newType) => handleLessonTypeChange(sIdx, lIdx, newType)}
                        onRemove={() => removeLesson(sIdx, lIdx)}
                      />
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addLesson(sIdx)} className="gap-2 text-xs text-muted-foreground">
                      <Plus className="w-3.5 h-3.5" /> Thêm bài giảng
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Sub-component: LessonRow
// ──────────────────────────────────────────────────────────
interface LessonRowProps {
  lesson: ILesson;
  sectionIndex: number;
  lessonIndex: number;
  onUpdateField: (field: string, value: any) => void;
  onChangeType: (newType: string) => void;
  onRemove: () => void;
}

const LessonRow: React.FC<LessonRowProps> = ({
  lesson,
  onUpdateField,
  onChangeType,
  onRemove,
}) => {
  const isVideo = lesson.type === 'VIDEO';
  const status = lesson.processingStatus;

  return (
    <div className={`rounded-xl border transition-colors overflow-hidden ${
      isVideo && status === 'DONE'
        ? 'border-green-200 dark:border-green-500/20'
        : isVideo && (status === 'PENDING' || status === 'PROCESSING')
        ? 'border-indigo-200 dark:border-indigo-500/20'
        : 'border-zinc-200 dark:border-zinc-800/60'
    }`}>
      {/* Lesson Header */}
      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950">
        <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />

        {/* Type icon */}
        {isVideo ? (
          <div className={`w-5 h-5 shrink-0 ${
            status === 'DONE' ? 'text-green-500'
            : status === 'PROCESSING' || status === 'PENDING' ? 'text-indigo-500'
            : status === 'FAILED' ? 'text-red-500'
            : 'text-blue-400'
          }`}>
            <Video className="w-4 h-4" />
          </div>
        ) : lesson.type === 'DOCUMENT' ? (
          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
        )}

        <Input
          value={lesson.title}
          onChange={(e) => onUpdateField('title', e.target.value)}
          className="h-8 text-sm border-none bg-transparent p-0 focus-visible:ring-0 flex-1"
          placeholder="Tên bài giảng..."
        />

        {/* Video status badge (compact) */}
        {isVideo && status && status !== 'NONE' && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline-block ${
            status === 'DONE' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
            : status === 'FAILED' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
          }`}>
            {status === 'DONE' ? '✓ Sẵn sàng'
              : status === 'FAILED' ? '✗ Lỗi'
              : status === 'PROCESSING' ? '⟳ Mã hóa...'
              : '↑ Đang tải...'}
          </span>
        )}

        <select
          value={lesson.type}
          onChange={(e) => onChangeType(e.target.value)}
          className="h-8 px-2 text-xs rounded-lg bg-background border border-zinc-200 dark:border-zinc-800 shrink-0"
        >
          <option value="VIDEO">Video</option>
          <option value="DOCUMENT">Tài liệu</option>
          <option value="QUIZ">Quiz</option>
        </select>

        <button onClick={onRemove} className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Video upload zone — chỉ hiển thị khi type = VIDEO */}
      {isVideo && (
        <div className="px-4 pb-4 pt-1 bg-white dark:bg-zinc-900/50">
          <LessonVideoUploader
            lesson={lesson}
            onUpdate={(field, value) => onUpdateField(field as string, value)}
          />
        </div>
      )}
    </div>
  );
};

// ─── Helper: status badge ───
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 text-xs">Đã xuất bản</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-xs">Bản nháp</Badge>;
    default:
      return null;
  }
};
