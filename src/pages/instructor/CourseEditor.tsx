// ========================
// Instructor Course Editor: Chỉnh sửa chi tiết khóa học + Giáo trình
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetCourseForManage, useUpdateCourse, usePublishCourse } from '@/hooks/useInstructorCourses';
import { toast } from 'sonner';
import type { ICourse, ISection, ILesson } from '@/services/courseApi';

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
      // Mở rộng tất cả sections ban đầu
      setExpandedSections(new Set(course.sections?.map((_, i) => i) || []));
    }
  }, [course]);

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

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-xl">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu
          </Button>
          {course.status === 'DRAFT' && (
            <Button onClick={handlePublish} disabled={publishMutation.isPending} className="gap-2 rounded-xl">
              {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Xuất bản
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
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Giáo trình</h2>
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
                  {expandedSections.has(sIdx) ? <ChevronUp className="w-4 h-4 shrink-0 text-zinc-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />}
                </div>

                {/* Lessons */}
                {expandedSections.has(sIdx) && (
                  <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                    {section.lessons.map((lesson, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                        <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                        {lesson.type === 'VIDEO' ? (
                          <Video className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateLesson(sIdx, lIdx, 'title', e.target.value)}
                          className="h-8 text-sm border-none bg-transparent p-0 focus-visible:ring-0 flex-1"
                          placeholder="Tên bài giảng..."
                        />
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(sIdx, lIdx, 'type', e.target.value)}
                          className="h-8 px-2 text-xs rounded-md bg-background border border-zinc-200 dark:border-zinc-800"
                        >
                          <option value="VIDEO">Video</option>
                          <option value="DOCUMENT">Tài liệu</option>
                          <option value="QUIZ">Quiz</option>
                        </select>
                        <button onClick={() => removeLesson(sIdx, lIdx)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

// Helper inline — reused from Courses.tsx
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
