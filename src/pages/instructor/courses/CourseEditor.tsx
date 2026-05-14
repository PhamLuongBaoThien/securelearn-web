// File này là màn hình editor chính cho instructor.
// Nó đang ghép 3 lớp logic:
// - metadata khóa học
// - curriculum dạng section/lesson
// - content theo từng loại lesson: video, document, quiz
// Lưu ý:
// - editor hiện dùng CRUD item-level thật
// - publish bị chặn nếu còn video pending/processing hoặc validate backend không pass
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreateCourseLesson,
  useCreateCourseSection,
  useDeleteCourseLesson,
  useDeleteCourseSection,
  useGetCourseForManage,
  usePublishCourse,
  useReorderCourseLessons,
  useReorderCourseSections,
  useUpdateCourse,
  useUpdateCourseLesson,
  useUpdateCourseSection,
  useValidatePublishCourse,
} from "@/hooks/useInstructorCourses";
import { usePublicCourseCategories } from "@/hooks/usePublicCourseCategories";
import {
  type ICourse,
  type ICourseCategoryNode,
  type ILesson,
  type ISection,
} from "@/services/courseApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ThumbnailUploader } from "@/components/ui/ThumbnailUploader";
import { LessonDocumentUploader } from "./LessonDocumentUploader";
import { LessonQuizBuilder } from "./LessonQuizBuilder";
import { LessonVideoUploader } from "./LessonVideoUploader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type Tab = "info" | "curriculum";

interface BulletListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}

const BulletListEditor: React.FC<BulletListEditorProps> = ({ items, onChange, placeholder = "Nhập nội dung...", addLabel = "Thêm mục" }) => {
  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
          <Input value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} className="h-9 rounded-lg flex-1" />
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="h-8 w-8 p-1.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...items, ""])} className="gap-2 text-xs text-muted-foreground mt-1">
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
};

type CategoryOption = {
  value: string;
  label: string;
};

type CourseEditorValues = {
  title: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  whatYouWillLearn: string[];
  requirements: string[];
  categoryId: string;
  level: ICourse["level"];
  price: number;
};

const flattenCategoryOptions = (categories: ICourseCategoryNode[], parentTrail = ""): CategoryOption[] =>
  categories.flatMap((category) => {
    const label = parentTrail ? `${parentTrail} > ${category.name}` : category.name;
    return [
      { value: category._id, label },
      ...flattenCategoryOptions(category.children || [], label),
    ];
  });

const getInitialCourseEditorValues = (course: ICourse): CourseEditorValues => ({
  title: course.title,
  shortDescription: course.shortDescription || "",
  description: course.description || "",
  thumbnail: course.thumbnail || "",
  whatYouWillLearn: course.whatYouWillLearn?.length ? course.whatYouWillLearn : [""],
  requirements: course.requirements?.length ? course.requirements : [""],
  categoryId: course.categoryId || "",
  level: course.level,
  price: course.price,
});

export const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading, error, refetch } = useGetCourseForManage(courseId!);
  const { data: categories = [], isLoading: isCategoriesLoading } = usePublicCourseCategories();
  const updateMutation = useUpdateCourse();
  const publishMutation = usePublishCourse();
  const validatePublishMutation = useValidatePublishCourse();
  const createSectionMutation = useCreateCourseSection();
  const updateSectionMutation = useUpdateCourseSection();
  const deleteSectionMutation = useDeleteCourseSection();
  const reorderSectionsMutation = useReorderCourseSections();
  const createLessonMutation = useCreateCourseLesson();
  const updateLessonMutation = useUpdateCourseLesson();
  const deleteLessonMutation = useDeleteCourseLesson();
  const reorderLessonsMutation = useReorderCourseLessons();

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState<string>("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [price, setPrice] = useState(0);
  const [sections, setSections] = useState<ISection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [isMutatingCurriculum, setIsMutatingCurriculum] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Lưu snapshot giá trị đã lưu thành công để so sánh khi cần Discard
  const savedSnapshotRef = React.useRef<ReturnType<typeof getInitialCourseEditorValues> | null>(null);

  // "idle" | "saving" | "saved" | "error" — chỉ dùng cho tab Nội dung khóa học
  const [curriculumSaveStatus, setCurriculumSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const curriculumSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wrapper: thiết lập trạng thái lưu im lặng cho mọi thao tác CRUD giáo trình
  const withCurriculumSave = async (fn: () => Promise<void>) => {
    if (curriculumSaveTimerRef.current) clearTimeout(curriculumSaveTimerRef.current);
    setCurriculumSaveStatus("saving");
    try {
      void await fn();
      setCurriculumSaveStatus("saved");
      curriculumSaveTimerRef.current = setTimeout(() => setCurriculumSaveStatus("idle"), 2000);
    } catch (error: unknown) {
      setCurriculumSaveStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Thao tác thất bại.";
      toast.error(errorMessage || "Thao tác thất bại.");
      curriculumSaveTimerRef.current = setTimeout(() => setCurriculumSaveStatus("idle"), 3000);
      throw error;
    }
  };

  // Reset cờ khởi tạo khi chuyển sang khóa học khác
  useEffect(() => {
    setIsInitialized(false);
  }, [courseId]);

  useEffect(() => {
    if (!course) return;

    // Luôn bám sát dữ liệu giáo trình (sections) vì nó được cập nhật qua các màn hình khác nhau
    setSections(course.sections || []);

    // Chỉ gán giá trị mặc định cho form vào lần đầu tiên để tránh ghi đè dữ liệu đang gõ dở
    if (!isInitialized) {
      const initialValues = getInitialCourseEditorValues(course);
      setTitle(initialValues.title);
      setShortDescription(initialValues.shortDescription);
      setDescription(initialValues.description);
      setThumbnail(initialValues.thumbnail);
      setThumbnailFile(null);
      setWhatYouWillLearn(initialValues.whatYouWillLearn);
      setRequirements(initialValues.requirements);
      setCategoryId(initialValues.categoryId);
      setLevel(initialValues.level);
      setPrice(initialValues.price);
      setExpandedSections(new Set(course.sections?.map((_, i) => i) || []));
      setIsInitialized(true);
      setHasUnsavedChanges(false);
      savedSnapshotRef.current = initialValues;
    }
  }, [course, isInitialized]);

  const categoryOptions = flattenCategoryOptions(categories);
  const pendingVideos = sections.flatMap((section) => section.lessons).filter((lesson) => lesson.type === "VIDEO" && (lesson.processingStatus === "PENDING" || lesson.processingStatus === "PROCESSING"));
  const hasBlockingVideos = pendingVideos.length > 0;

  // Refetch course detail sau khi CRUD section/lesson để UI luôn bám state thật của backend.
  const refreshCourse = async () => {
    await refetch();
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const payload = new FormData();
      payload.append("title", title);
      payload.append("shortDescription", shortDescription);
      payload.append("description", description);
      payload.append("thumbnail", thumbnailFile ?? thumbnail);
      payload.append("categoryId", categoryId);
      payload.append("level", level as ICourse["level"]);
      payload.append("price", String(price));
      whatYouWillLearn.filter(Boolean).forEach((item) => payload.append("whatYouWillLearn", item));
      requirements.filter(Boolean).forEach((item) => payload.append("requirements", item));

      const updatedCourse = await updateMutation.mutateAsync({
        courseId: courseId!,
        payload,
      });

      setThumbnail(updatedCourse.thumbnail || "");
      setThumbnailFile(null);
      // Cập nhật snapshot sau khi lưu thành công
      savedSnapshotRef.current = {
        title, shortDescription, description,
        thumbnail: updatedCourse.thumbnail || "",
        whatYouWillLearn, requirements, categoryId, level: level as ICourse["level"], price,
      };
      setHasUnsavedChanges(false);
      toast.success("Đã lưu khóa học!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lưu thất bại.";
      toast.error(errorMessage);
    }
  };

  const handleThumbnailChange = (previewUrl: string, file: File | null) => {
    setThumbnail(previewUrl);
    setThumbnailFile(file);
    setHasUnsavedChanges(true);
  };

  // Hủy thay đổi — khôi phục về dữ liệu đã lưu gần nhất
  const handleDiscard = () => {
    const snap = savedSnapshotRef.current;
    if (!snap) return;
    setTitle(snap.title);
    setShortDescription(snap.shortDescription);
    setDescription(snap.description);
    setThumbnail(snap.thumbnail);
    setThumbnailFile(null);
    setWhatYouWillLearn(snap.whatYouWillLearn);
    setRequirements(snap.requirements);
    setCategoryId(snap.categoryId);
    setLevel(snap.level);
    setPrice(snap.price);
    setHasUnsavedChanges(false);
  };

  // Publish có 2 lớp chặn:
  // - frontend chặn nếu còn video đang xử lý
  // - backend validate toàn bộ rule publish
  const handlePublish = () => {
    if (hasBlockingVideos) {
      toast.error(`Còn ${pendingVideos.length} video đang xử lý.`);
      return;
    }

    validatePublishMutation.mutate(courseId!, {
      onSuccess: (result) => {
        if (!result.ok) {
          toast.error(result.errors[0]?.message || "Khóa học chưa thể xuất bản.");
          return;
        }

        publishMutation.mutate(courseId!, {
          onSuccess: () => {
            toast.success("Khóa học đã được xuất bản!");
            navigate("/instructor/courses");
          },
          onError: (err: Error) => toast.error(err.message),
        });
      },
      onError: (err: Error) => toast.error(err.message || "Không thể kiểm tra điều kiện xuất bản."),
    });
  };

  // CRUD section theo từng item thay vì update nguyên mảng curriculum.
  const handleAddSection = async () => {
    await withCurriculumSave(async () => {
      setIsMutatingCurriculum(true);
      try {
        await createSectionMutation.mutateAsync({
          courseId: courseId!,
          payload: { title: `Chương ${sections.length + 1}: Chưa đặt tên`, order: sections.length + 1 },
        });
        await refreshCourse();
      } finally {
        setIsMutatingCurriculum(false);
      }
    });
  };

  const handleRemoveSection = async (sectionId?: string) => {
    if (!sectionId) return;
    await withCurriculumSave(async () => {
      setIsMutatingCurriculum(true);
      try {
        await deleteSectionMutation.mutateAsync({ courseId: courseId!, sectionId });
        await refreshCourse();
      } finally {
        setIsMutatingCurriculum(false);
      }
    });
  };
  
  const handleSectionTitleChange = (sectionIndex: number, value: string) => {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = { ...next[sectionIndex], title: value };
      return next;
    });
  };
  // sự kiện blur sau khi người dùng edit title của section xong và focus ra ngoài
  const handleSectionTitleBlur = async (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section?._id) return;
    const sectionId = section._id; // capture để tránh lỗi TypeScript trong async closure
    await withCurriculumSave(async () => {
      await updateSectionMutation.mutateAsync({
        courseId: courseId!,
        sectionId,
        payload: { title: section.title },
      });
      await refreshCourse();
    });
  };

  const handleMoveSection = async (sectionIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    [reordered[sectionIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[sectionIndex]];

    const items = reordered
      .filter((section): section is ISection & { _id: string } => Boolean(section._id))
      .map((section, index) => ({ sectionId: section._id!, order: index + 1 }));

    await withCurriculumSave(async () => {
      setIsMutatingCurriculum(true);
      try {
        await reorderSectionsMutation.mutateAsync({ courseId: courseId!, items });
        await refreshCourse();
      } finally {
        setIsMutatingCurriculum(false);
      }
    });
  };

  // Lesson mới mặc định tạo dưới section hiện tại.
  const handleAddLesson = async (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section?._id) return;
    const sectionId = section._id; // capture trước closure
    await withCurriculumSave(async () => {
      setIsMutatingCurriculum(true);
      try {
        await createLessonMutation.mutateAsync({
          courseId: courseId!,
          sectionId,
          payload: {
            title: `Bài ${section.lessons.length + 1}: Chưa đặt tên`,
            type: "VIDEO",
            order: section.lessons.length + 1,
          },
        });
        await refreshCourse();
      } finally {
        setIsMutatingCurriculum(false);
      }
    });
  };

  const handleRemoveLesson = async (lessonId?: string) => {
    if (!lessonId) return;
    await withCurriculumSave(async () => {
      setIsMutatingCurriculum(true);
      try {
        await deleteLessonMutation.mutateAsync({ courseId: courseId!, lessonId });
        await refreshCourse();
      } finally {
        setIsMutatingCurriculum(false);
      }
    });
  };

  const handleLessonFieldChange = (sectionIndex: number, lessonIndex: number, field: keyof ILesson, value: ILesson[keyof ILesson]) => {
    setSections((prev) => {
      const next = [...prev];
      const lessons = [...next[sectionIndex].lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
      next[sectionIndex] = { ...next[sectionIndex], lessons };
      return next;
    });
  };

  const handleLessonTitleBlur = async (sectionIndex: number, lessonIndex: number) => {
    const lesson = sections[sectionIndex]?.lessons[lessonIndex];
    if (!lesson?._id) return;
    const lessonId = lesson._id; // capture trước closure
    await withCurriculumSave(async () => {
      await updateLessonMutation.mutateAsync({
        courseId: courseId!,
        lessonId,
        payload: { title: lesson.title },
      });
      await refreshCourse();
    });
  };

  const handleMoveLesson = async (sectionIndex: number, lessonIndex: number, direction: "up" | "down") => {
    const section = sections[sectionIndex];
    if (!section?._id) return;

    const targetIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= section.lessons.length) return;

    const reorderedLessons = [...section.lessons];
    [reorderedLessons[lessonIndex], reorderedLessons[targetIndex]] = [reorderedLessons[targetIndex], reorderedLessons[lessonIndex]];

    const items = reorderedLessons
      .filter((lesson): lesson is ILesson & { _id: string } => Boolean(lesson._id))
      .map((lesson, index) => ({ lessonId: lesson._id!, order: index + 1 }));

    const sectionId = section._id; // capture trước closure
    await withCurriculumSave(async () => {
      setIsMutatingCurriculum(true);
      try {
        await reorderLessonsMutation.mutateAsync({ courseId: courseId!, sectionId, items });
        await refreshCourse();
      } finally {
        setIsMutatingCurriculum(false);
      }
    });
  };

  // Đổi type lesson là điểm dễ làm mất dữ liệu cũ vì backend sẽ cleanup reference cũ.
  const handleLessonTypeChange = async (sectionIndex: number, lessonIndex: number, type: string) => {
    const lesson = sections[sectionIndex]?.lessons[lessonIndex];
    if (!lesson?._id) return;

    const lessonId = lesson._id; // capture trước closure
    await withCurriculumSave(async () => {
      await updateLessonMutation.mutateAsync({
        courseId: courseId!,
        lessonId,
        payload: { type: type as ILesson["type"] },
      });
      await refreshCourse();
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !course) {
    return (
      <div className="text-center py-32">
        <p className="text-destructive font-medium">{(error as Error)?.message || "Không tìm thấy khóa học."}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/instructor/courses")}>Quay lại</Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-6 pb-12">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/instructor/courses")} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Chỉnh sửa khóa học</h1>
              {getStatusBadge(course.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">ID: {courseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {hasBlockingVideos && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-pulse" />{pendingVideos.length} video đang xử lý
            </div>
          )}
          {course.status === "DRAFT" && (
            <Button onClick={handlePublish} disabled={publishMutation.isPending || validatePublishMutation.isPending} className={`gap-2 rounded-xl ${hasBlockingVideos ? "opacity-60" : ""}`}>
              {(publishMutation.isPending || validatePublishMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Xuất bản
              {hasBlockingVideos && <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
            </Button>
          )}
        </div>
      </div>

      {/* ===== TAB NAV ===== */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {([{id: "info", label: "Thông tin khóa học"}, {id: "curriculum", label: "Nội dung khóa học"}] as {id: Tab; label: string}[]).map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant="ghost"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ===== TAB: THÔNG TIN KHÓA HỌC ===== */}
      {activeTab === "info" && (
        <div className="space-y-6">

          {/* Section 1: Thông tin cơ bản + Thumbnail */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Tên khóa học</label>
                  <Input value={title} onChange={(e) => { setTitle(e.target.value); setHasUnsavedChanges(true); }} className="h-11 rounded-xl" placeholder="Nhập tên khóa học..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Mô tả ngắn</span>
                    <span className={`text-xs ${shortDescription.length > 200 ? "text-red-500" : "text-zinc-400"}`}>{shortDescription.length}/200</span>
                  </label>
                  <textarea value={shortDescription} onChange={(e) => { setShortDescription(e.target.value); setHasUnsavedChanges(true); }} maxLength={220} rows={3}
                    className="w-full p-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Một câu giới thiệu ngắn, sẽ hiển thị ngay dưới tên khóa học..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Danh mục</label>
                    <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setHasUnsavedChanges(true); }}
                      className="w-full h-11 px-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm" disabled={isCategoriesLoading}>
                      <option value="">{isCategoriesLoading ? "Đang tải..." : "Chọn danh mục"}</option>
                      {categoryOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Trình độ</label>
                    <Select value={level} onChange={(e) => { setLevel(e.target.value); setHasUnsavedChanges(true); }}
                      className="w-full h-11 px-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm">
                      <option value="BEGINNER">Cơ bản</option>
                      <option value="INTERMEDIATE">Trung cấp</option>
                      <option value="ADVANCED">Nâng cao</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Giá (VND)</label>
                  <Input type="number" value={price} onChange={(e) => { setPrice(Number(e.target.value)); setHasUnsavedChanges(true); }} className="h-11 rounded-xl" min={0} step={1000} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Ảnh quảng cáo khóa học</label>
                <ThumbnailUploader value={thumbnail} onChange={handleThumbnailChange} disabled={updateMutation.isPending} />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">Khuyến nghị tỉ lệ 16:9, tối thiểu 1280×720px</p>
              </div>
            </div>
          </div>

          {/* Section 2: Nội dung chi tiết */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">Nội dung chi tiết</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Học viên sẽ học được gì</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Liệt kê những kỹ năng, kiến thức đạt được sau khóa học</p>
                  <BulletListEditor items={whatYouWillLearn} onChange={(v) => { setWhatYouWillLearn(v); setHasUnsavedChanges(true); }} placeholder="Ví dụ: Xây dựng REST API với Node.js..." addLabel="Thêm mục tiêu" />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Yêu cầu trước khi học</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Những kiến thức hoặc công cụ cần có trước khi học</p>
                  <BulletListEditor items={requirements} onChange={(v) => { setRequirements(v); setHasUnsavedChanges(true); }} placeholder="Ví dụ: Biết cơ bản về HTML/CSS..." addLabel="Thêm yêu cầu" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Mô tả chi tiết</h3>
              <RichTextEditor value={description} onChange={(v) => { setDescription(v); setHasUnsavedChanges(true); }} placeholder="Viết mô tả chi tiết về khóa học..." minHeight="280px" />
            </div>
          </div>

        </div>
      )}

      {/* ===== TAB: GIÁO TRÌNH ===== */}
      {activeTab === "curriculum" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nội dung khóa học</h2>
              {hasBlockingVideos && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{pendingVideos.length} video đang mã hóa
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {curriculumSaveStatus === "saving" && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </div>
              )}
              {curriculumSaveStatus === "saved" && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400" style={{ animation: "fadeIn 0.2s ease" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã lưu</span>
                </div>
              )}
              {curriculumSaveStatus === "error" && (
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Lưu thất bại</span>
                </div>
              )}
              {curriculumSaveStatus === "idle" && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tự động lưu</span>
                </div>
              )}
              <Button variant="outline" onClick={() => void handleAddSection()} className="gap-2 rounded-xl text-sm" disabled={isMutatingCurriculum}>
                <Plus className="w-4 h-4" /> Thêm chương
              </Button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><p>Chưa có chương nào. Hãy thêm chương đầu tiên!</p></div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, sectionIndex) => (
                <div key={section._id || sectionIndex} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => toggleSection(sectionIndex)}>
                    <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                    <Input
                      value={section.title}
                      onChange={(e) => handleSectionTitleChange(sectionIndex, e.target.value)}
                      onBlur={() => void handleSectionTitleBlur(sectionIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 text-sm font-medium border-none bg-transparent p-0 focus-visible:ring-0"
                    />
                    <Badge variant="secondary" className="shrink-0 text-xs">{section.lessons.length} bài</Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); void handleMoveSection(sectionIndex, "up"); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={isMutatingCurriculum || sectionIndex === 0}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Di chuyển lên</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); void handleMoveSection(sectionIndex, "down"); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={isMutatingCurriculum || sectionIndex === sections.length - 1}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Di chuyển xuống</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <ConfirmDialog
                            title="Xóa chương này?"
                            description={`Toàn bộ ${section.lessons.length} bài giảng (bao gồm video, tài liệu, quiz) bên trong sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`}
                            confirmText="Xóa chương"
                            cancelText="Giữ lại"
                            isDestructive
                            onConfirm={() => void handleRemoveSection(section._id)}
                            triggerButton={
                              <Button type="button" variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-7 w-7 p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Xóa chương</TooltipContent>
                    </Tooltip>
                    {expandedSections.has(sectionIndex) ? <ChevronUp className="w-4 h-4 shrink-0 text-zinc-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />}
                  </div>
                  {expandedSections.has(sectionIndex) && (
                    <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <LessonRow
                          key={lesson._id || lessonIndex}
                          courseId={courseId!}
                          lesson={lesson}
                          canMoveUp={lessonIndex > 0}
                          canMoveDown={lessonIndex < section.lessons.length - 1}
                          onRefresh={refreshCourse}
                          onUpdateField={(field, value) => handleLessonFieldChange(sectionIndex, lessonIndex, field, value)}
                          onTitleBlur={() => void handleLessonTitleBlur(sectionIndex, lessonIndex)}
                          onChangeType={(type) => void handleLessonTypeChange(sectionIndex, lessonIndex, type)}
                          onMoveUp={() => void handleMoveLesson(sectionIndex, lessonIndex, "up")}
                          onMoveDown={() => void handleMoveLesson(sectionIndex, lessonIndex, "down")}
                          onRemove={() => void handleRemoveLesson(lesson._id)}
                        />
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => void handleAddLesson(sectionIndex)} className="gap-2 text-xs text-muted-foreground" disabled={isMutatingCurriculum}>
                        <Plus className="w-3.5 h-3.5" /> Thêm bài giảng
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== FLOATING ACTION BAR ===== */}
      {activeTab === "info" && hasUnsavedChanges && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 50,
            animation: "slideUpFAB 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <style>{`@keyframes slideUpFAB { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 dark:border-zinc-600 rounded-2xl shadow-2xl px-4 py-3">
            <div className="flex items-center gap-2 mr-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-300">Có thay đổi chưa lưu</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={updateMutation.isPending}
              className="h-8 px-3 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending}
              className="h-8 px-4 text-xs bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl font-semibold gap-1.5"
            >
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      )}

    </div>
    </TooltipProvider>
  );
};

interface LessonRowProps {
  courseId: string;
  lesson: ILesson;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRefresh: () => Promise<void>;
  onUpdateField: (field: keyof ILesson, value: ILesson[keyof ILesson]) => void;
  onTitleBlur: () => void;
  onChangeType: (type: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

const LessonRow: React.FC<LessonRowProps> = ({ courseId, lesson, canMoveUp, canMoveDown, onRefresh, onUpdateField, onTitleBlur, onChangeType, onMoveUp, onMoveDown, onRemove }) => {
  const isVideo = lesson.type === "VIDEO";
  const isDocument = lesson.type === "DOCUMENT";
  const isQuiz = lesson.type === "QUIZ";
  const status = lesson.processingStatus;

  // Mở rộng mặc định nếu bài học chưa có nội dung để người dùng dễ thao tác
  const [isExpanded, setIsExpanded] = useState(() => {
    if (isVideo && !lesson.videoAssetId) return true;
    if (isDocument && !lesson.documentAssetId) return true;
    // Đối với quiz, mở mặc định vì thường xuyên phải chỉnh sửa nhiều câu hỏi
    if (isQuiz) return false; 
    return false;
  });
  const [pendingType, setPendingType] = useState<string | null>(null);

  return (
    <div className={`rounded-xl border transition-colors overflow-hidden ${isVideo && status === "DONE" ? "border-green-200 dark:border-green-500/20" : isVideo && (status === "PENDING" || status === "PROCESSING") ? "border-indigo-200 dark:border-indigo-500/20" : "border-zinc-200 dark:border-zinc-800/60"}`}>
      <div 
        className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" onClick={(e) => e.stopPropagation()} />
        {isVideo ? <div className={`w-5 h-5 shrink-0 ${status === "DONE" ? "text-green-500" : status === "PROCESSING" || status === "PENDING" ? "text-indigo-500" : status === "FAILED" ? "text-red-500" : "text-blue-400"}`}><Video className="w-4 h-4" /></div> : isDocument ? <FileText className="w-4 h-4 text-emerald-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />}
        <Input 
          value={lesson.title} 
          onChange={(e) => onUpdateField("title", e.target.value)} 
          onBlur={onTitleBlur} 
          onClick={(e) => e.stopPropagation()}
          className="h-8 text-sm border-none bg-transparent p-0 focus-visible:ring-0 flex-1" 
          placeholder="Tên bài giảng..." 
        />
        {isVideo && status && status !== "NONE" && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline-block ${status === "DONE" ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" : status === "FAILED" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"}`}>
            {status === "DONE" ? "✓ Sẵn sàng" : status === "FAILED" ? "✗ Lỗi" : status === "PROCESSING" ? "⟳ Mã hóa..." : "↑ Đang tải..."}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={!canMoveUp}>
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Di chuyển lên</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={!canMoveDown}>
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Di chuyển xuống</TooltipContent>
        </Tooltip>
        <div className="w-[120px] shrink-0" onClick={(e) => e.stopPropagation()}>
          <Select value={lesson.type} onChange={(e) => setPendingType(e.target.value)} className="h-8 w-full px-2 text-xs rounded-lg bg-background border border-zinc-200 dark:border-zinc-800">
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Tài liệu</option>
            <option value="QUIZ">Quiz</option>
          </Select>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ConfirmDialog
                title="Xóa bài giảng này?"
                description="Video, tài liệu hoặc quiz đã gắn với bài giảng sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
                confirmText="Xóa bài giảng"
                cancelText="Giữ lại"
                isDestructive
                onConfirm={onRemove}
                triggerButton={
                  <Button type="button" variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-7 w-7 p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>Xóa bài giảng</TooltipContent>
        </Tooltip>
        {/* ConfirmDialog đổi loại bài học (controlled) */}
        <ConfirmDialog
          title="Đổi loại bài giảng?"
          description="Nội dung hiện tại (video, tài liệu hoặc quiz) sẽ bị xóa khi chuyển sang loại khác. Hành động này không thể hoàn tác."
          confirmText="Đổi loại"
          cancelText="Hủy"
          isDestructive
          open={pendingType !== null}
          onOpenChange={(open) => { if (!open) setPendingType(null); }}
          onConfirm={() => { if (pendingType) { onChangeType(pendingType); setPendingType(null); } }}
        />
        {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-zinc-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />}
      </div>

      {isExpanded && (
        <>
          {isVideo && (
            <div className="px-4 pb-4 pt-1 bg-white dark:bg-zinc-900/50">
              <LessonVideoUploader courseId={courseId} lessonId={lesson._id} lesson={lesson} onUpdate={(field, value) => onUpdateField(field as keyof ILesson, value)} onRefresh={onRefresh} />
            </div>
          )}
          {isDocument && (
            <div className="px-4 pb-4 pt-1 bg-white dark:bg-zinc-900/50">
              <LessonDocumentUploader courseId={courseId} lessonId={lesson._id} lesson={lesson} onRefresh={onRefresh} onUploaded={(documentAssetId) => onUpdateField("documentAssetId", documentAssetId)} onRemoved={() => {
                onUpdateField("documentAssetId", null);
                onUpdateField("status", "DRAFT");
              }} />
            </div>
          )}
          {isQuiz && (
            <div className="px-4 pb-4 pt-1 bg-white dark:bg-zinc-900/50">
              <LessonQuizBuilder courseId={courseId} lessonId={lesson._id} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const getStatusBadge = (status: string) => {
  if (status === "PUBLISHED") return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 text-xs">Đã xuất bản</Badge>;
  if (status === "DRAFT") return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-xs">Bản nháp</Badge>;
  return null;
};
