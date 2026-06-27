// File này là màn hình editor chính cho instructor.
// Nó đang ghép 3 lớp logic:
// - metadata khóa học
// - curriculum dạng section/lesson
// - content theo từng loại lesson: video, quiz và tài liệu đính kèm
// Lưu ý:
// - editor hiện dùng CRUD item-level thật
// - publish bị chặn nếu còn video pending/processing hoặc validate backend không pass
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleHelp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Loader2,
  Plus,
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
  useGetPublishedCourseForManage,
  useSubmitCourseForReview,
  useReorderCourseLessons,
  useReorderCourseSections,
  useUpdateCourse,
  useUpdateCourseLesson,
  useUpdateCourseSection,
  useValidatePublishCourse,
  instructorKeys,
} from "@/hooks/useInstructorCourses";
import { useDebounce } from "@/hooks/useDebounce";
import { usePublicCourseCategories } from "@/hooks/usePublicCourseCategories";
import {
  type CourseProgressionMode,
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
import { LessonAttachmentManager, type AttachmentOperation } from "./LessonAttachmentManager";
import { LessonQuizBuilder } from "./LessonQuizBuilder";
import { LessonVideoUploader } from "./LessonVideoUploader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


type Tab = "info" | "curriculum";
type VersionViewMode = "draft" | "published";

interface BulletListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
}

const BulletListEditor: React.FC<BulletListEditorProps> = ({ items, onChange, placeholder = "Nhập nội dung...", addLabel = "Thêm mục", disabled = false }) => {
  const update = (i: number, v: string) => {
    if (disabled) return;
    const next = [...items];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
          <Input value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} className="h-9 rounded-lg flex-1" disabled={disabled} />
          <Button type="button" variant="ghost" size="icon" onClick={() => !disabled && onChange(items.filter((_, idx) => idx !== i))} className="h-8 w-8 p-1.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0" disabled={disabled}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => !disabled && onChange([...items, ""])} className="gap-2 text-xs text-muted-foreground mt-1" disabled={disabled}>
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
  categoryResolutionStatus: NonNullable<ICourse["categoryResolutionStatus"]>;
  suggestedCategoryName: string;
  suggestedCategoryNote: string;
  level: ICourse["level"];
  progressionMode: CourseProgressionMode;
  price: number;
};

const PROGRESSION_MODE_OPTIONS: Array<{
  value: CourseProgressionMode;
  label: string;
  description: string;
}> = [
  {
    value: "FREE",
    label: "Học tự do",
    description: "Học viên được mở toàn bộ bài học và bài quiz ngay từ đầu.",
  },
  {
    value: "SEQUENTIAL",
    label: "Học tuần tự",
    description: "Học viên phải hoàn thành bài trước thì bài kế tiếp mới được mở.",
  },
  {
    value: "QUIZ_REQUIRES_PREVIOUS_LESSONS",
    label: "Chặn quiz đến khi học xong",
    description: "Video vẫn có thể mở, nhưng quiz chỉ mở khi các bài trước trong cùng phần đã hoàn thành.",
  },
];

const flattenCategoryOptions = (categories: ICourseCategoryNode[], parentTrail = ""): CategoryOption[] =>
  categories.flatMap((category) => {
    const label = parentTrail ? `${parentTrail} > ${category.name}` : category.name;
    return [
      { value: category._id, label },
      ...flattenCategoryOptions(category.children || [], label),
    ];
  });

const CATEGORY_STATUS_NONE = "NONE";
const CATEGORY_STATUS_NEEDS_ADMIN_CLASSIFICATION = "NEEDS_ADMIN_CLASSIFICATION";

interface CategoryDropdownProps {
  categories: ICourseCategoryNode[];
  value: string;
  isNeedsClassification: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onSelectCategory: (categoryId: string) => void;
  onSelectNeedsClassification: () => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  value,
  isNeedsClassification,
  isLoading,
  disabled,
  onSelectCategory,
  onSelectNeedsClassification,
}) => {
  const options = React.useMemo(() => flattenCategoryOptions(categories), [categories]);
  const selectedLabel = isNeedsClassification
    ? "Không tìm thấy danh mục phù hợp"
    : options.find((option) => option.value === value)?.label;

  const renderCategoryItems = (items: ICourseCategoryNode[]) =>
    items.map((category) => {
      const hasChildren = Boolean(category.children?.length);
      const isSelected = !isNeedsClassification && value === category._id;
      const labelContent = (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate">{category.name}</span>
          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </span>
      );

      if (hasChildren) {
        return (
          <DropdownMenuSub key={category._id}>
            <DropdownMenuSubTrigger
              className="min-w-56 cursor-pointer rounded-lg px-3 py-2"
              onClick={() => onSelectCategory(category._id)}
            >
              {labelContent}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-56 rounded-xl p-1">
              {renderCategoryItems(category.children || [])}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      return (
        <DropdownMenuItem
          key={category._id}
          className="min-w-56 cursor-pointer rounded-lg px-3 py-2"
          onClick={() => onSelectCategory(category._id)}
        >
          {labelContent}
        </DropdownMenuItem>
      );
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isLoading}>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between rounded-xl border-zinc-200 bg-background px-3 text-left text-sm font-normal dark:border-zinc-800"
          disabled={disabled || isLoading}
        >
          <span className={selectedLabel ? "truncate text-zinc-900 dark:text-zinc-100" : "truncate text-zinc-400"}>
            {isLoading ? "Đang tải..." : selectedLabel || "Chọn danh mục"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[420px] min-w-[280px] overflow-y-auto rounded-xl p-1">
        {categories.length > 0 ? renderCategoryItems(categories) : (
          <DropdownMenuItem disabled className="rounded-lg px-3 py-2 text-sm text-zinc-400">
            Chưa có danh mục
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="mt-1 cursor-pointer rounded-lg border-t border-zinc-100 px-3 py-2 text-amber-600 focus:text-amber-700 dark:border-zinc-800 dark:text-amber-300"
          onClick={onSelectNeedsClassification}
        >
          <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="truncate">Không tìm thấy danh mục phù hợp</span>
            {isNeedsClassification && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const getInitialCourseEditorValues = (course: ICourse): CourseEditorValues => ({
  title: course.title,
  shortDescription: course.shortDescription || "",
  description: course.description || "",
  thumbnail: course.thumbnail || "",
  whatYouWillLearn: course.whatYouWillLearn?.length ? course.whatYouWillLearn : [""],
  requirements: course.requirements?.length ? course.requirements : [""],
  categoryId: course.categoryId || "",
  categoryResolutionStatus: course.categoryResolutionStatus || CATEGORY_STATUS_NONE,
  suggestedCategoryName: course.suggestedCategoryName || "",
  suggestedCategoryNote: course.suggestedCategoryNote || "",
  level: course.level,
  progressionMode: course.progressionMode || "FREE",
  price: course.price,
});

const normalizeStringList = (items: string[]) => items.map((item) => item || "");
const normalizeRichText = (value: string) =>
  value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() ? value : "";

const areCourseEditorValuesEqual = (a: CourseEditorValues, b: CourseEditorValues) =>
  a.title === b.title &&
  a.shortDescription === b.shortDescription &&
  normalizeRichText(a.description) === normalizeRichText(b.description) &&
  a.thumbnail === b.thumbnail &&
  a.categoryId === b.categoryId &&
  a.categoryResolutionStatus === b.categoryResolutionStatus &&
  a.suggestedCategoryName === b.suggestedCategoryName &&
  a.suggestedCategoryNote === b.suggestedCategoryNote &&
  a.level === b.level &&
  a.progressionMode === b.progressionMode &&
  Number(a.price) === Number(b.price) &&
  JSON.stringify(normalizeStringList(a.whatYouWillLearn)) === JSON.stringify(normalizeStringList(b.whatYouWillLearn)) &&
  JSON.stringify(normalizeStringList(a.requirements)) === JSON.stringify(normalizeStringList(b.requirements));

const getVideoDisplayStatus = (lesson: ILesson) => {
  if (lesson.processingStatus) return lesson.processingStatus;
  if (!lesson.videoAssetId) return "NONE";
  if (lesson.status === "READY") return "DONE";
  if (lesson.status === "FAILED") return "FAILED";
  if (lesson.status === "PROCESSING") return "PROCESSING";
  return "NONE";
};

const getAttachmentOperationLabel = (operation?: AttachmentOperation) => {
  if (!operation) return "";
  if (operation.phase === "uploading") return "Đang tải tài liệu";
  if (operation.phase === "binding") return "Đang gắn tài liệu";
  return "Đang gỡ tài liệu";
};

export const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading, error, refetch } = useGetCourseForManage(courseId!);
  const hasPublishedVersion = Boolean(course?.isRevision);
  const { data: publishedCourse, isLoading: isPublishedLoading } = useGetPublishedCourseForManage(courseId!, hasPublishedVersion);
  const { data: categories = [], isLoading: isCategoriesLoading } = usePublicCourseCategories();
  const updateMutation = useUpdateCourse();
  const submitReviewMutation = useSubmitCourseForReview();
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
  const [viewMode, setViewMode] = useState<VersionViewMode>("draft");
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState<string>("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [categoryId, setCategoryId] = useState("");
  const [categoryResolutionStatus, setCategoryResolutionStatus] = useState<NonNullable<ICourse["categoryResolutionStatus"]>>(CATEGORY_STATUS_NONE);
  const [suggestedCategoryName, setSuggestedCategoryName] = useState("");
  const [suggestedCategoryNote, setSuggestedCategoryNote] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [progressionMode, setProgressionMode] = useState<CourseProgressionMode>("FREE");
  const debouncedProgressionMode = useDebounce(progressionMode, 600);
  const [price, setPrice] = useState(0);
  const [sections, setSections] = useState<ISection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [isMutatingCurriculum, setIsMutatingCurriculum] = useState(false);
  const [attachmentOperations, setAttachmentOperations] = useState<Record<string, AttachmentOperation>>({});

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasEditedInSession, setHasEditedInSession] = useState(false);
  // Lưu snapshot giá trị đã lưu thành công để so sánh khi cần Discard
  const savedSnapshotRef = React.useRef<ReturnType<typeof getInitialCourseEditorValues> | null>(null);
  const metadataSaveSeqRef = React.useRef(0);
  const progressionModeSaveSeqRef = React.useRef(0);
  // Giữ nội dung bài học đang gõ để các refetch nền (ví dụ video READY) không ghi đè draft trước khi blur lưu DB.
  const lessonContentDraftsRef = React.useRef<Map<string, string>>(new Map());

  // "idle" | "saving" | "saved" | "error" — chỉ dùng cho tab Nội dung khóa học
  const [curriculumSaveStatus, setCurriculumSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const curriculumSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [metadataSaveStatus, setMetadataSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const metadataSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const needsAdminClassification = categoryResolutionStatus === CATEGORY_STATUS_NEEDS_ADMIN_CLASSIFICATION;
  const metadataDraft = React.useMemo<CourseEditorValues>(() => ({
    title,
    shortDescription,
    description,
    thumbnail,
    whatYouWillLearn,
    requirements,
    categoryId: needsAdminClassification ? "" : categoryId,
    categoryResolutionStatus,
    suggestedCategoryName: needsAdminClassification ? suggestedCategoryName : "",
    suggestedCategoryNote: needsAdminClassification ? suggestedCategoryNote : "",
    level: level as ICourse["level"],
    progressionMode: savedSnapshotRef.current?.progressionMode || progressionMode,
    price,
  }), [
    title,
    shortDescription,
    description,
    thumbnail,
    whatYouWillLearn,
    requirements,
    categoryId,
    categoryResolutionStatus,
    suggestedCategoryName,
    suggestedCategoryNote,
    needsAdminClassification,
    level,
    progressionMode,
    price,
  ]);
  const debouncedMetadataDraft = useDebounce(metadataDraft, 900);

  // Wrapper: thiết lập trạng thái lưu im lặng cho mọi thao tác CRUD giáo trình
  const withCurriculumSave = async (fn: () => Promise<void>) => {
    if (curriculumSaveTimerRef.current) clearTimeout(curriculumSaveTimerRef.current);
    setCurriculumSaveStatus("saving");
    try {
      void await fn();
      setHasEditedInSession(true);
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
    setHasEditedInSession(false);
    setViewMode("draft");
    lessonContentDraftsRef.current.clear();
  }, [courseId]);

  useEffect(() => {
    if (!hasPublishedVersion) setViewMode("draft");
  }, [hasPublishedVersion]);

  useEffect(() => {
    if (!course) return;

    // Luôn bám sát dữ liệu giáo trình, nhưng giữ lại content draft đang gõ để refetch nền không làm mất chữ.
    const nextSections = (course.sections || []).map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => {
        if (!lesson._id) return lesson;
        const draft = lessonContentDraftsRef.current.get(lesson._id);
        return draft === undefined ? lesson : { ...lesson, content: draft };
      }),
    }));
    setSections(nextSections);

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
      setCategoryResolutionStatus(initialValues.categoryResolutionStatus);
      setSuggestedCategoryName(initialValues.suggestedCategoryName);
      setSuggestedCategoryNote(initialValues.suggestedCategoryNote);
      setLevel(initialValues.level);
      setProgressionMode(initialValues.progressionMode);
      setPrice(initialValues.price);
      setExpandedSections(new Set(course.sections?.map((_, i) => i) || []));
      setIsInitialized(true);
      setHasUnsavedChanges(false);
      setHasEditedInSession(false);
      savedSnapshotRef.current = initialValues;
    }
  }, [course, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !savedSnapshotRef.current) return;
    const currentValues: CourseEditorValues = {
      title,
      shortDescription,
      description,
      thumbnail,
      whatYouWillLearn,
      requirements,
      categoryId,
      categoryResolutionStatus,
      suggestedCategoryName,
      suggestedCategoryNote,
      level: level as ICourse["level"],
      progressionMode,
      price,
    };
    setHasUnsavedChanges(!areCourseEditorValuesEqual(currentValues, savedSnapshotRef.current));
  }, [isInitialized, title, shortDescription, description, thumbnail, whatYouWillLearn, requirements, categoryId, categoryResolutionStatus, suggestedCategoryName, suggestedCategoryNote, level, progressionMode, price]);

  const pendingVideos = sections.flatMap((section) => section.lessons).filter((lesson) => {
    const videoStatus = getVideoDisplayStatus(lesson);
    return lesson.type === "VIDEO" && (videoStatus === "PENDING" || videoStatus === "PROCESSING");
  });
  const hasBlockingVideos = pendingVideos.length > 0;
  const activeAttachmentOperations = Object.entries(attachmentOperations);
  const activeAttachmentCount = activeAttachmentOperations.length;
  const primaryAttachmentOperation = activeAttachmentOperations[0]?.[1];
  const hasAnySavedContent =
    sections.length > 0 ||
    Boolean(thumbnail?.trim()) ||
    Boolean(categoryId) ||
    needsAdminClassification ||
    Boolean(description?.replace(/<[^>]*>/g, "").trim()) ||
    whatYouWillLearn.some((item) => item.trim()) ||
    requirements.some((item) => item.trim());

  // Refetch course detail + invalidate danh sách khóa học để duration/thông tin mới nhất
  // hiển thị đúng cả ở trang editor lẫn trang danh sách.
  const refreshCourse = async () => {
    await refetch();
    // Invalidate cache myCourses để trang danh sách hiển thị totalDuration mới nhất
    void queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses }); // queryClient.invalidateQueries là hàm trong React Query dùng để làm mới lại cache
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

  const buildCourseMetadataPayload = (values: CourseEditorValues, file: File | null) => {
    const payload = new FormData();
    payload.append("title", values.title);
    payload.append("shortDescription", values.shortDescription);
    payload.append("description", values.description);
    payload.append("thumbnail", file ?? values.thumbnail);
    payload.append("categoryId", values.categoryId);
    payload.append("categoryResolutionStatus", values.categoryResolutionStatus);
    payload.append("suggestedCategoryName", values.suggestedCategoryName);
    payload.append("suggestedCategoryNote", values.suggestedCategoryNote);
    payload.append("level", values.level);
    payload.append("progressionMode", values.progressionMode);
    payload.append("price", String(values.price));
    values.whatYouWillLearn.filter(Boolean).forEach((item) => payload.append("whatYouWillLearn", item));
    values.requirements.filter(Boolean).forEach((item) => payload.append("requirements", item));
    return payload;
  };

  const handleThumbnailChange = (previewUrl: string, file: File | null) => {
    setThumbnail(previewUrl);
    setThumbnailFile(file);
    setHasUnsavedChanges(true);
  };

  // Gửi duyệt có 2 lớp chặn:
  // - frontend chặn nếu còn video đang xử lý
  // - backend validate toàn bộ rule publish
  const handleSubmitReview = () => {
    if (!hasAnySavedContent) {
      toast.error("Hãy thêm nội dung khóa học trước khi gửi duyệt.");
      return;
    }

    if (hasUnsavedChanges) {
      toast.error("Vui lòng lưu thay đổi trước khi gửi duyệt.");
      return;
    }

    if (isRevisionDraft && !hasEditedInSession && !hasRealChangesFromPublished) {
      toast.error("Bản cập nhật chưa có thay đổi so với khóa học đang xuất bản.");
      return;
    }

    if (hasBlockingVideos) {
      toast.error(`Còn ${pendingVideos.length} video đang xử lý.`);
      return;
    }

    if (needsAdminClassification && !suggestedCategoryName.trim()) {
      toast.error("Vui lòng nhập chủ đề khóa học để người kiểm duyệt phân loại.");
      return;
    }

    validatePublishMutation.mutate(courseId!, {
      onSuccess: (result) => {
        if (!result.ok) {
          toast.error(
            <div className="whitespace-pre-line text-left text-xs md:text-sm">
              {result.message || "Khóa học chưa thể gửi duyệt."}
            </div>,
            { duration: 6000 }
          );
          return;
        }

        submitReviewMutation.mutate(courseId!, {
          onSuccess: () => {
            toast.success("Khóa học đã được gửi duyệt!");
            navigate("/instructor/courses");
          },
          onError: (err: Error) => toast.error(err.message, err.message.includes('Hồ sơ giảng viên') ? { action: { label: 'Cập nhật hồ sơ', onClick: () => navigate('/profile') } } : undefined),
        });
      },
      onError: (err: Error) => toast.error(err.message || "Không thể kiểm tra điều kiện xuất bản."),
    });
  };

  // CRUD section theo từng item thay vì update nguyên mảng curriculum.
  const handleAddSection = async () => {
    const nextSectionIndex = sections.length;
    await withCurriculumSave(async () => {
      setIsMutatingCurriculum(true);
      try {
        await createSectionMutation.mutateAsync({
          courseId: courseId!,
          payload: { title: `Chương ${sections.length + 1}: Chưa đặt tên`, order: sections.length + 1 },
        });
        setExpandedSections((prev) => {
          const next = new Set(prev);
          next.add(nextSectionIndex);
          return next;
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
    const lessonId = sections[sectionIndex]?.lessons[lessonIndex]?._id;
    if (field === "content" && lessonId) {
      lessonContentDraftsRef.current.set(lessonId, String(value ?? ""));
    }
    setSections((prev) => {
      const next = [...prev];
      const lessons = [...next[sectionIndex].lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
      next[sectionIndex] = { ...next[sectionIndex], lessons };
      return next;
    });
  };

  const handleLessonAttachmentsChange = (sectionIndex: number, lessonIndex: number, attachments: string[]) => {
    handleLessonFieldChange(sectionIndex, lessonIndex, "attachments", attachments);
    setHasEditedInSession(true);
  };

  const handleAttachmentOperationChange = (lessonId: string | undefined, operation: AttachmentOperation | null) => {
    if (!lessonId) return;
    setAttachmentOperations((prev) => {
      const next = { ...prev };
      if (operation) {
        next[lessonId] = operation;
      } else {
        delete next[lessonId];
      }
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

  const handleLessonContentBlur = async (sectionIndex: number, lessonIndex: number) => {
    const lesson = sections[sectionIndex]?.lessons[lessonIndex];
    if (!lesson?._id) return;
    const lessonId = lesson._id; // capture trước closure
    await withCurriculumSave(async () => {
      await updateLessonMutation.mutateAsync({
        courseId: courseId!,
        lessonId,
        payload: { content: lesson.content || "" },
      });
      lessonContentDraftsRef.current.delete(lessonId);
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

  const isReadOnly = course?.status === "PENDING" || course?.status === "PUBLISHED";
  const isViewingPublished = viewMode === "published" && Boolean(publishedCourse);
  const effectiveReadOnly = Boolean(isReadOnly || isViewingPublished);

  const buildCurrentEditorValues = (nextProgressionMode = progressionMode): CourseEditorValues => ({
    title,
    shortDescription,
    description,
    thumbnail,
    whatYouWillLearn,
    requirements,
    categoryId: needsAdminClassification ? "" : categoryId,
    categoryResolutionStatus,
    suggestedCategoryName: needsAdminClassification ? suggestedCategoryName : "",
    suggestedCategoryNote: needsAdminClassification ? suggestedCategoryNote : "",
    level: level as ICourse["level"],
    progressionMode: nextProgressionMode,
    price,
  });

  useEffect(() => {
    if (!isInitialized || effectiveReadOnly || !savedSnapshotRef.current) return;
    if (!areCourseEditorValuesEqual(debouncedMetadataDraft, metadataDraft)) return;
    if (!debouncedMetadataDraft.title.trim()) return;
    if (areCourseEditorValuesEqual(debouncedMetadataDraft, savedSnapshotRef.current)) return;

    let cancelled = false;
    const saveSeq = metadataSaveSeqRef.current + 1;
    metadataSaveSeqRef.current = saveSeq;
    if (metadataSaveTimerRef.current) clearTimeout(metadataSaveTimerRef.current);
    setMetadataSaveStatus("saving");

    void updateMutation.mutateAsync({
      courseId: courseId!,
      payload: buildCourseMetadataPayload(debouncedMetadataDraft, thumbnailFile),
    }).then((updatedCourse) => {
      if (cancelled || metadataSaveSeqRef.current !== saveSeq) return;

      const nextSnapshot = {
        ...debouncedMetadataDraft,
        thumbnail: updatedCourse.thumbnail || debouncedMetadataDraft.thumbnail,
        progressionMode: savedSnapshotRef.current?.progressionMode || debouncedMetadataDraft.progressionMode,
      };
      savedSnapshotRef.current = nextSnapshot;
      setThumbnail(nextSnapshot.thumbnail);
      setThumbnailFile(null);
      setHasEditedInSession(true);
      setHasUnsavedChanges(!areCourseEditorValuesEqual(buildCurrentEditorValues(), nextSnapshot));
      setMetadataSaveStatus("saved");
      metadataSaveTimerRef.current = setTimeout(() => setMetadataSaveStatus("idle"), 2000);
    }).catch((error) => {
      if (cancelled || metadataSaveSeqRef.current !== saveSeq) return;
      setMetadataSaveStatus("error");
      metadataSaveTimerRef.current = setTimeout(() => setMetadataSaveStatus("idle"), 3000);
      toast.error(error instanceof Error ? error.message : "Không thể tự lưu thông tin khóa học.");
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedMetadataDraft, effectiveReadOnly, isInitialized]);

  useEffect(() => {
    if (!isInitialized || effectiveReadOnly || !savedSnapshotRef.current) return;
    if (debouncedProgressionMode === savedSnapshotRef.current.progressionMode) return;

    let cancelled = false;
    const saveSeq = progressionModeSaveSeqRef.current + 1;
    progressionModeSaveSeqRef.current = saveSeq;

    void withCurriculumSave(async () => {
      const payload = new FormData();
      payload.append("progressionMode", debouncedProgressionMode);
      const updatedCourse = await updateMutation.mutateAsync({
        courseId: courseId!,
        payload,
      });
      if (cancelled || progressionModeSaveSeqRef.current !== saveSeq) return;

      const nextSnapshot = savedSnapshotRef.current
        ? { ...savedSnapshotRef.current, progressionMode: updatedCourse.progressionMode || debouncedProgressionMode }
        : getInitialCourseEditorValues(updatedCourse);
      savedSnapshotRef.current = nextSnapshot;
      setHasUnsavedChanges(!areCourseEditorValuesEqual(buildCurrentEditorValues(debouncedProgressionMode), nextSnapshot));
    }).catch(() => {
      if (cancelled || progressionModeSaveSeqRef.current !== saveSeq) return;
      setProgressionMode(savedSnapshotRef.current?.progressionMode || "FREE");
      setHasUnsavedChanges(savedSnapshotRef.current
        ? !areCourseEditorValuesEqual(buildCurrentEditorValues(savedSnapshotRef.current.progressionMode), savedSnapshotRef.current)
        : false);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedProgressionMode, effectiveReadOnly, isInitialized]);

  const handleProgressionModeChange = (nextProgressionMode: CourseProgressionMode) => {
    if (nextProgressionMode === progressionMode || effectiveReadOnly) return;
    setProgressionMode(nextProgressionMode);
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

  const displayCourse = isViewingPublished ? publishedCourse! : course;
  const isRevisionDraft = Boolean(course?.isRevision);
  const displayCategoryId = isViewingPublished ? (displayCourse.categoryId || "") : categoryId;
  const displayNeedsAdminClassification = isViewingPublished
    ? displayCourse.categoryResolutionStatus === CATEGORY_STATUS_NEEDS_ADMIN_CLASSIFICATION
    : needsAdminClassification;
  const displaySections = isViewingPublished ? (displayCourse.sections || []) : sections;
  const displayWhatYouWillLearn = isViewingPublished ? (displayCourse.whatYouWillLearn?.length ? displayCourse.whatYouWillLearn : [""]) : whatYouWillLearn;
  const displayRequirements = isViewingPublished ? (displayCourse.requirements?.length ? displayCourse.requirements : [""]) : requirements;
  const displayProgressionMode = isViewingPublished ? displayCourse.progressionMode || "FREE" : progressionMode;
  const selectedProgressionMode = PROGRESSION_MODE_OPTIONS.find((option) => option.value === displayProgressionMode) || PROGRESSION_MODE_OPTIONS[0];
  const publishedProgressionMode = publishedCourse?.progressionMode || 'FREE';
  const publishedProgressionModeOption = PROGRESSION_MODE_OPTIONS.find((option) => option.value === publishedProgressionMode) || PROGRESSION_MODE_OPTIONS[0];
  const draftProgressionModeChanged = Boolean(hasPublishedVersion && course.progressionMode && course.progressionMode !== publishedProgressionMode);

  // Tự động kiểm tra xem bản nháp có thực sự khác biệt so với bản đã xuất bản không.
  // Dùng hàm chạy ngay lập tức (IIFE) thay vì React.useMemo để tránh vi phạm "Rules of Hooks" do phía trên có lệnh return sớm (early return)
  const hasRealChangesFromPublished = (() => {
    // 1. Chống nháy nút (Anti-Flickering): Nếu đang tải bản published, tạm coi như không có thay đổi để nút gửi duyệt giữ trạng thái vô hiệu hoá tạm thời
    if (!isRevisionDraft || isPublishedLoading || !publishedCourse) return false;

    // 2. Gom nhóm các thông tin cơ bản để so sánh
    const draftValues = {
      title: course.title || "",
      shortDescription: course.shortDescription || "",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      categoryId: course.categoryId || "",
      categoryResolutionStatus: course.categoryResolutionStatus || CATEGORY_STATUS_NONE,
      suggestedCategoryName: course.suggestedCategoryName || "",
      suggestedCategoryNote: course.suggestedCategoryNote || "",
      level: course.level,
      progressionMode: course.progressionMode || "FREE",
      price: course.price,
      whatYouWillLearn: course.whatYouWillLearn || [],
      requirements: course.requirements || [],
    };

    const publishedValues = {
      title: publishedCourse.title || "",
      shortDescription: publishedCourse.shortDescription || "",
      description: publishedCourse.description || "",
      thumbnail: publishedCourse.thumbnail || "",
      categoryId: publishedCourse.categoryId || "",
      categoryResolutionStatus: publishedCourse.categoryResolutionStatus || CATEGORY_STATUS_NONE,
      suggestedCategoryName: publishedCourse.suggestedCategoryName || "",
      suggestedCategoryNote: publishedCourse.suggestedCategoryNote || "",
      level: publishedCourse.level,
      progressionMode: publishedCourse.progressionMode || "FREE",
      price: publishedCourse.price,
      whatYouWillLearn: publishedCourse.whatYouWillLearn || [],
      requirements: publishedCourse.requirements || [],
    };

    // Nếu thông tin cơ bản khác nhau -> có thay đổi
    if (!areCourseEditorValuesEqual(draftValues, publishedValues)) return true;

    // 3. So sánh cấu trúc Giáo trình (Sections & Lessons)
    const draftSecs = course.sections || [];
    const pubSecs = publishedCourse.sections || [];
    
    // Khác số lượng chương -> có thay đổi
    if (draftSecs.length !== pubSecs.length) return true;

    for (let i = 0; i < draftSecs.length; i++) {
      const ds = draftSecs[i];
      const ps = pubSecs[i];
      // Khác tên chương -> có thay đổi
      if (ds.title !== ps.title) return true;

      const dLessons = ds.lessons || [];
      const pLessons = ps.lessons || [];
      
      // Khác số lượng bài học -> có thay đổi
      if (dLessons.length !== pLessons.length) return true;

      for (let j = 0; j < dLessons.length; j++) {
        const dl = dLessons[j];
        const pl = pLessons[j];
        // So sánh chi tiết từng bài học (tên, loại, nội dung text, id video, tài liệu)
        if (dl.title !== pl.title) return true;
        if (dl.type !== pl.type) return true;
        if (normalizeRichText(dl.content || "") !== normalizeRichText(pl.content || "")) return true;
        if (dl.videoAssetId !== pl.videoAssetId) return true;
        if (JSON.stringify(dl.attachments || []) !== JSON.stringify(pl.attachments || [])) return true;
      }
    }

    return false;
  })();

  // Cho phép Gửi duyệt nếu: Khóa học tạo mới (!isRevisionDraft) HOẶC vừa có thao tác sửa trong phiên này (hasEditedInSession) HOẶC bản nháp thực sự khác bản đã xuất bản
  const hasReviewChanges = !isRevisionDraft || hasEditedInSession || hasRealChangesFromPublished;
  const submitDisabledReason = isReadOnly // isReadOnly true khi status PENDING hoặc PUBLISHED
    ? "Khóa học hiện không thể gửi duyệt."
    : hasBlockingVideos // hasBlockingVideos true khi có video đang xử lý
      ? `Còn ${pendingVideos.length} video đang xử lý.`
      : hasUnsavedChanges // hasUnsavedChanges true khi có thay đổi chưa lưu
        ? "Vui lòng lưu thay đổi trước khi gửi duyệt."
      : !hasAnySavedContent // hasAnySavedContent true khi có nội dung
        ? "Hãy thêm nội dung khóa học trước khi gửi duyệt."
      : !hasReviewChanges // hasReviewChanges true khi có thay đổi so với bản phát hành
        ? "Bản cập nhật chưa có thay đổi so với khóa học đang xuất bản."
          : undefined;
  const isSubmitDisabled =
    isReadOnly ||
    hasBlockingVideos ||
    hasUnsavedChanges ||
    !hasAnySavedContent ||
    !hasReviewChanges ||
    submitReviewMutation.isPending ||
    validatePublishMutation.isPending;

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-6 pb-12">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/instructor/courses")} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Chỉnh sửa khóa học</h1>
              {getStatusBadge(displayCourse.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">ID: {courseId}</p>
            {hasPublishedVersion && (
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <Tabs
                  value={viewMode}
                  onValueChange={(val) => setViewMode(val as VersionViewMode)}
                >
                  <TabsList className="grid w-[260px] grid-cols-2 h-8 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <TabsTrigger
                      value="draft"
                      className="rounded-lg text-xs font-medium py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800"
                    >
                      Bản nháp
                    </TabsTrigger>
                    <TabsTrigger
                      value="published"
                      disabled={isPublishedLoading}
                      className="rounded-lg text-xs font-medium py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800"
                    >
                      {isPublishedLoading ? "Đang tải..." : "Bản đã xuất bản"}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {isViewingPublished && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 animate-in fade-in slide-in-from-left-1 duration-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Chế độ chỉ xem (Không thể chỉnh sửa)
                  </span>
                )}
              </div>
            )}
            {isReadOnly && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {course.status === "PENDING" ? "Khóa học đang chờ người kiểm duyệt xét duyệt, tạm khóa chỉnh sửa." : "Khóa học đã xuất bản. Hãy tạo bản cập nhật từ danh sách khóa học để chỉnh sửa."}
              </p>
            )}
            {hasPublishedVersion && !isReadOnly && (
              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/90 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                <p className="font-semibold">Bạn đang chỉnh sửa bản nháp của khóa học.</p>
                <p className="mt-1 leading-6 text-blue-700/90 dark:text-blue-100/90">
                  Mọi thay đổi, bao gồm cả luật mở bài, chỉ áp dụng cho học viên sau khi bạn gửi duyệt và admin phê duyệt bản cập nhật này.
                </p>
                <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-100/80">
                  Bản đang public hiện dùng <span className="font-semibold">{publishedProgressionModeOption.label}</span>
                  {draftProgressionModeChanged ? `, còn bản nháp hiện tại dùng ${selectedProgressionMode.label}.` : '.'}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap flex-shrink-0 sm:self-start">
          {hasBlockingVideos && !isViewingPublished && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-pulse" />{pendingVideos.length} video đang xử lý
            </div>
          )}
          {(course.status === "DRAFT" || course.status === "REJECTED") && !isViewingPublished && (
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitDisabled}
              title={submitDisabledReason}
              className={`gap-2 rounded-xl ${hasBlockingVideos ? "opacity-60" : ""}`}
            >
              {(submitReviewMutation.isPending || validatePublishMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Gửi duyệt
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
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Thông tin khóa học</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {metadataSaveStatus === "saving" && (
                <span className="inline-flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang lưu...
                </span>
              )}
              {metadataSaveStatus === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đã lưu
                </span>
              )}
              {metadataSaveStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 text-red-500">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Lưu thất bại
                </span>
              )}
              {metadataSaveStatus === "idle" && (
                <span className="inline-flex items-center gap-1.5 text-zinc-400 dark:text-zinc-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tự động lưu
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Thông tin cơ bản + Thumbnail */}
          <div className="space-y-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Tên khóa học</label>
                  <Input value={isViewingPublished ? displayCourse.title : title} onChange={(e) => { setTitle(e.target.value); setHasUnsavedChanges(true); }} className="h-11 rounded-xl" placeholder="Nhập tên khóa học..." disabled={effectiveReadOnly} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Mô tả ngắn</span>
                    <span className={`text-xs ${(isViewingPublished ? displayCourse.shortDescription || "" : shortDescription).length > 200 ? "text-red-500" : "text-zinc-400"}`}>{(isViewingPublished ? displayCourse.shortDescription || "" : shortDescription).length}/200</span>
                  </label>
                  <textarea value={isViewingPublished ? displayCourse.shortDescription || "" : shortDescription} onChange={(e) => { setShortDescription(e.target.value); setHasUnsavedChanges(true); }} maxLength={220} rows={3}
                    disabled={effectiveReadOnly}
                    className="w-full p-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Một câu giới thiệu ngắn, sẽ hiển thị ngay dưới tên khóa học..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Giá (VND)</label>
                  <Input type="number" value={isViewingPublished ? displayCourse.price : price} onChange={(e) => { setPrice(Number(e.target.value)); setHasUnsavedChanges(true); }} className="h-11 rounded-xl" min={0} step={1000} disabled={effectiveReadOnly} />
                </div>
                  
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Trình độ</label>
                    <Select value={isViewingPublished ? displayCourse.level : level} onChange={(e) => { setLevel(e.target.value); setHasUnsavedChanges(true); }}
                      className="w-full h-11 px-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm" disabled={effectiveReadOnly}>
                      <option value="BEGINNER">Cơ bản</option>
                      <option value="INTERMEDIATE">Trung cấp</option>
                      <option value="ADVANCED">Nâng cao</option>
                    </Select>
                  </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Danh mục</label>
                    <CategoryDropdown
                      categories={categories}
                      value={displayCategoryId}
                      isNeedsClassification={displayNeedsAdminClassification}
                      isLoading={isCategoriesLoading}
                      disabled={effectiveReadOnly}
                      onSelectCategory={(nextCategoryId) => {
                        setCategoryId(nextCategoryId);
                        setCategoryResolutionStatus(CATEGORY_STATUS_NONE);
                        setSuggestedCategoryName("");
                        setSuggestedCategoryNote("");
                        setHasUnsavedChanges(true);
                      }}
                      onSelectNeedsClassification={() => {
                        setCategoryId("");
                        setCategoryResolutionStatus(CATEGORY_STATUS_NEEDS_ADMIN_CLASSIFICATION);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                {displayNeedsAdminClassification && (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <div>
                      <label className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1.5 block">Chủ đề khóa học</label>
                      <Input
                        value={isViewingPublished ? displayCourse.suggestedCategoryName || "" : suggestedCategoryName}
                        onChange={(e) => { setSuggestedCategoryName(e.target.value); setHasUnsavedChanges(true); }}
                        className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                        placeholder="VD: Lập trình SvelteKit"
                        disabled={effectiveReadOnly}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1.5 block">Ghi chú cho người kiểm duyệt</label>
                      <textarea
                        value={isViewingPublished ? displayCourse.suggestedCategoryNote || "" : suggestedCategoryNote}
                        onChange={(e) => { setSuggestedCategoryNote(e.target.value); setHasUnsavedChanges(true); }}
                        className="w-full min-h-[82px] rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/40 dark:border-zinc-800 dark:bg-zinc-950"
                        placeholder="Mô tả ngắn vì sao chủ đề này phù hợp..."
                        disabled={effectiveReadOnly}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Ảnh quảng cáo khóa học</label>
                <ThumbnailUploader value={isViewingPublished ? displayCourse.thumbnail || "" : thumbnail} onChange={handleThumbnailChange} disabled={updateMutation.isPending || effectiveReadOnly} />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">Khuyến nghị tỉ lệ 16:9, tối thiểu 1280×720px. Muốn có 1080p, hãy dùng nguồn 1920×1080px trở lên</p>
              </div>
            </div>
          </div>

          {/* Section 2: Nội dung chi tiết */}
          <div className="mt-6 space-y-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nội dung chi tiết</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Học viên sẽ học được gì</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Liệt kê những kỹ năng, kiến thức đạt được sau khóa học</p>
                  <BulletListEditor items={displayWhatYouWillLearn} onChange={(v) => { setWhatYouWillLearn(v); setHasUnsavedChanges(true); }} placeholder="Ví dụ: Xây dựng REST API với Node.js..." addLabel="Thêm mục tiêu" disabled={effectiveReadOnly} />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Yêu cầu trước khi học</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Những kiến thức hoặc công cụ cần có trước khi học</p>
                  <BulletListEditor items={displayRequirements} onChange={(v) => { setRequirements(v); setHasUnsavedChanges(true); }} placeholder="Ví dụ: Biết cơ bản về HTML/CSS..." addLabel="Thêm yêu cầu" disabled={effectiveReadOnly} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Mô tả chi tiết</h3>
              <RichTextEditor value={isViewingPublished ? displayCourse.description || "" : description} onChange={(v) => { setDescription(v); setHasUnsavedChanges(true); }} placeholder="Viết mô tả chi tiết về khóa học..." minHeight="280px" disabled={effectiveReadOnly} />
            </div>
          </div>

        </div>
      )}

      {/* ===== TAB: Nội dung khóa học ===== */}
      {activeTab === "curriculum" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nội dung khóa học</h2>
              {hasBlockingVideos && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{pendingVideos.length} video đang xử lý nền
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {activeAttachmentCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {activeAttachmentCount > 1
                      ? `${activeAttachmentCount} tài liệu đang xử lý`
                      : getAttachmentOperationLabel(primaryAttachmentOperation)}
                  </span>
                </div>
              )}
              {activeAttachmentCount === 0 && curriculumSaveStatus === "saving" && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </div>
              )}
              {activeAttachmentCount === 0 && curriculumSaveStatus === "saved" && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400" style={{ animation: "fadeIn 0.2s ease" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã lưu</span>
                </div>
              )}
              {activeAttachmentCount === 0 && curriculumSaveStatus === "error" && (
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Lưu thất bại</span>
                </div>
              )}
              {activeAttachmentCount === 0 && curriculumSaveStatus === "idle" && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tự động lưu</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-center">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Luật mở bài</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Chọn cách học viên đi qua giáo trình để tránh học nhảy cóc nếu khóa học cần theo thứ tự.
                </p>
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={effectiveReadOnly}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full justify-between rounded-xl border-zinc-200 bg-background px-3 text-left text-sm font-normal dark:border-zinc-800"
                      disabled={effectiveReadOnly}
                    >
                      <span>{selectedProgressionMode.label}</span>
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[min(92vw,30rem)] rounded-xl p-1">
                    {PROGRESSION_MODE_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        className="flex items-center gap-3 rounded-lg px-3 py-2"
                        onClick={() => void handleProgressionModeChange(option.value)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{option.label}</p>
                        </div>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
                                onClick={(event) => event.preventDefault()}
                              >
                                <CircleHelp className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-64 text-pretty leading-5">
                              {option.description}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {selectedProgressionMode.description}
                </p>
                <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                  <p>
                    Luật này được lưu trên <span className="font-semibold text-zinc-900 dark:text-white">bản nháp</span>. Học viên chỉ nhận thay đổi sau khi bạn gửi duyệt và admin phê duyệt bản cập nhật.
                  </p>
                  {hasPublishedVersion && !isViewingPublished && (
                    <p>
                      Bản đang public hiện dùng <span className="font-semibold text-zinc-900 dark:text-white">{publishedProgressionModeOption.label}</span>{draftProgressionModeChanged ? `, còn bản nháp bạn đang sửa dùng ${selectedProgressionMode.label}.` : '.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {displaySections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><p>Chưa có chương nào. Hãy thêm chương đầu tiên!</p></div>
          ) : (
            <div className="space-y-4">
              {displaySections.map((section, sectionIndex) => (
                <div key={section._id || sectionIndex} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 transition-colors">
                    <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                    <Input
                      value={section.title}
                      onChange={(e) => handleSectionTitleChange(sectionIndex, e.target.value)}
                      onBlur={() => void handleSectionTitleBlur(sectionIndex)}
                      disabled={effectiveReadOnly}
                      className="h-8 text-sm font-medium border-none bg-transparent p-0 focus-visible:ring-0"
                    />
                    <Badge variant="secondary" className="shrink-0 text-xs">{section.lessons.length} bài học</Badge>
                    {section.lessons.some((lesson) => Boolean(lesson._id && attachmentOperations[lesson._id])) && (
                      <Badge className="shrink-0 gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 border-blue-500/20 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {section.lessons.filter((lesson) => Boolean(lesson._id && attachmentOperations[lesson._id])).length} tài liệu
                      </Badge>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); void handleMoveSection(sectionIndex, "up"); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={isMutatingCurriculum || effectiveReadOnly || sectionIndex === 0}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Di chuyển lên</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); void handleMoveSection(sectionIndex, "down"); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={isMutatingCurriculum || effectiveReadOnly || sectionIndex === displaySections.length - 1}>
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
                            description={`Toàn bộ ${section.lessons.length} bài học (bao gồm video, quiz và tài liệu đính kèm) bên trong sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`}
                            confirmText="Xóa chương"
                            cancelText="Giữ lại"
                            isDestructive
                            onConfirm={() => void handleRemoveSection(section._id)}
                            triggerButton={
                              <Button type="button" variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-7 w-7 p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0" disabled={isMutatingCurriculum || effectiveReadOnly}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Xóa chương</TooltipContent>
                    </Tooltip>
                    <Button type="button" variant="ghost" size="icon" onClick={() => toggleSection(sectionIndex)} className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shrink-0 focus-visible:ring-0">
                      {expandedSections.has(sectionIndex) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                  {expandedSections.has(sectionIndex) && (
                    <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <LessonRow
                          key={`${viewMode}-${lesson._id || lessonIndex}-${lesson.type}`}
                          courseId={courseId!}
                          lesson={lesson}
                          canMoveUp={lessonIndex > 0}
                          canMoveDown={lessonIndex < section.lessons.length - 1}
                          attachmentOperation={lesson._id ? attachmentOperations[lesson._id] : undefined}
                          onRefresh={refreshCourse}
                          isReadOnly={effectiveReadOnly}
                          onUpdateField={(field, value) => {
                            if (isViewingPublished) return;
                            if (field === "attachments") {
                              handleLessonAttachmentsChange(sectionIndex, lessonIndex, value as string[]);
                              return;
                            }
                            handleLessonFieldChange(sectionIndex, lessonIndex, field, value);
                          }}
                          onTitleBlur={() => void handleLessonTitleBlur(sectionIndex, lessonIndex)}
                          onContentBlur={() => void handleLessonContentBlur(sectionIndex, lessonIndex)}
                          onAttachmentOperationChange={(operation) => handleAttachmentOperationChange(lesson._id, operation)}
                          onChangeType={(type) => void handleLessonTypeChange(sectionIndex, lessonIndex, type)}
                          onMoveUp={() => void handleMoveLesson(sectionIndex, lessonIndex, "up")}
                          onMoveDown={() => void handleMoveLesson(sectionIndex, lessonIndex, "down")}
                          onRemove={() => void handleRemoveLesson(lesson._id)}
                        />
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => void handleAddLesson(sectionIndex)} className="gap-2 text-xs text-muted-foreground" disabled={isMutatingCurriculum || effectiveReadOnly}>
                        <Plus className="w-3.5 h-3.5" /> Thêm bài học
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleAddSection()}
            className="gap-2 text-xs text-muted-foreground"
            disabled={isMutatingCurriculum || effectiveReadOnly}
          >
            <Plus className="w-3.5 h-3.5" /> Thêm chương
          </Button>
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
  attachmentOperation?: AttachmentOperation;
  isReadOnly?: boolean;
  onRefresh: () => Promise<void>;
  onUpdateField: (field: keyof ILesson, value: ILesson[keyof ILesson]) => void;
  onTitleBlur: () => void;
  onContentBlur: () => void;
  onAttachmentOperationChange: (operation: AttachmentOperation | null) => void;
  onChangeType: (type: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

const LessonRow: React.FC<LessonRowProps> = ({ courseId, lesson, canMoveUp, canMoveDown, attachmentOperation, isReadOnly = false, onRefresh, onUpdateField, onTitleBlur, onContentBlur, onAttachmentOperationChange, onChangeType, onMoveUp, onMoveDown, onRemove }) => {
  const isVideo = lesson.type === "VIDEO";
  const isQuiz = lesson.type === "QUIZ";
  const status = getVideoDisplayStatus(lesson);

  // Mặc định luôn mở để người dùng thấy trạng thái video và tài liệu đính kèm ngay khi vào trang.
  // Trước đây collapse nếu đã có asset → ẩn mất trạng thái đang xử lý khi reload trang.
  const [isExpanded, setIsExpanded] = useState(true);
  const [pendingType, setPendingType] = useState<string | null>(null);

  return (
    <div className={`rounded-xl border transition-colors overflow-hidden ${isVideo && status === "DONE" ? "border-green-200 dark:border-green-500/20" : isVideo && (status === "PENDING" || status === "PROCESSING") ? "border-indigo-200 dark:border-indigo-500/20" : "border-zinc-200 dark:border-zinc-800/60"}`}>
      <div 
        className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 transition-colors"
      >
        <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
        {isVideo ? <div className={`w-5 h-5 shrink-0 ${status === "DONE" ? "text-green-500" : status === "PROCESSING" || status === "PENDING" ? "text-indigo-500" : status === "FAILED" ? "text-red-500" : "text-blue-400"}`}><Video className="w-4 h-4" /></div> : <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />}
        <Input 
          value={lesson.title} 
          onChange={(e) => onUpdateField("title", e.target.value)} 
          onBlur={onTitleBlur} 
          onClick={(e) => e.stopPropagation()}
          disabled={isReadOnly}
          className="h-8 text-sm border-none bg-transparent p-0 focus-visible:ring-0 flex-1" 
          placeholder="Tên bài học..." 
        />
        {isVideo && status && status !== "NONE" && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline-block ${status === "DONE" ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" : status === "FAILED" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"}`}>
            {status === "DONE" ? "✓ Sẵn sàng" : status === "FAILED" ? "✗ Lỗi" : status === "PROCESSING" ? "Đang xử lý" : "Đang tải video"}
          </span>
        )}
        {attachmentOperation && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            {getAttachmentOperationLabel(attachmentOperation)}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={!canMoveUp || isReadOnly}>
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Di chuyển lên</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="h-7 w-7 p-1 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0" disabled={!canMoveDown || isReadOnly}>
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Di chuyển xuống</TooltipContent>
        </Tooltip>
        <div className="w-[120px] shrink-0" onClick={(e) => e.stopPropagation()}>
          <Select value={lesson.type} onChange={(e) => setPendingType(e.target.value)} className="h-8 w-full px-2 text-xs rounded-lg bg-background border border-zinc-200 dark:border-zinc-800" disabled={isReadOnly}>
            <option value="VIDEO">Video</option>
            <option value="QUIZ">Quiz</option>
          </Select>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ConfirmDialog
                title="Xóa bài học này?"
                description="Video, quiz và tài liệu đính kèm của bài học sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
                confirmText="Xóa bài học"
                cancelText="Giữ lại"
                isDestructive
                onConfirm={onRemove}
                triggerButton={
                  <Button type="button" variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-7 w-7 p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0" disabled={isReadOnly}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>Xóa bài học</TooltipContent>
        </Tooltip>
        {/* ConfirmDialog đổi loại bài học (controlled) */}
        <ConfirmDialog
          title="Đổi loại bài học?"
          description="Video hoặc quiz hiện tại sẽ bị xóa khi chuyển sang loại khác. Tài liệu đính kèm vẫn được giữ lại."
          confirmText="Đổi loại"
          cancelText="Hủy"
          isDestructive
          open={pendingType !== null}
          onOpenChange={(open) => { if (!open) setPendingType(null); }}
          onConfirm={() => { if (pendingType) { onChangeType(pendingType); setPendingType(null); } }}
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shrink-0 focus-visible:ring-0">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <>
          {isVideo && (
            <div className="px-4 pb-4 pt-4 bg-white dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/60">
              <LessonVideoUploader courseId={courseId} lessonId={lesson._id} lesson={lesson} onUpdate={(field, value) => onUpdateField(field as keyof ILesson, value)} onRefresh={onRefresh} isReadOnly={isReadOnly} />
            </div>
          )}
          {isQuiz && (
            <div className="px-4 pb-1 pt-4 bg-white dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/60">
              {isReadOnly ? <p className="text-xs text-muted-foreground">Quiz đang ở chế độ chỉ xem vì khóa học không mở chỉnh sửa.</p> : <LessonQuizBuilder courseId={courseId} lessonId={lesson._id} />}
            </div>
          )}
          <div className="px-4 py-4 bg-white dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/60">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mô tả tổng quan bài học</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Nội dung giới thiệu, ghi chú hoặc hướng dẫn trước khi học bài này</p>
            </div>
            <RichTextEditor
              value={lesson.content || ""}
              onChange={(value) => onUpdateField("content", value)}
              onBlur={onContentBlur}
              placeholder="Viết mô tả tổng quan cho bài học..."
              minHeight="180px"
              disabled={isReadOnly}
            />
          </div>
          {/* Tài liệu đính kèm hiển thị cho cả VIDEO lẫn QUIZ */}
          <div className="px-4 pb-4 pt-1 bg-white dark:bg-zinc-900/50">
            <LessonAttachmentManager
              courseId={courseId}
              lessonId={lesson._id}
              lesson={lesson}
              onRefresh={onRefresh}
              onAttachmentsChange={(attachments) => onUpdateField("attachments", attachments)}
              onOperationChange={onAttachmentOperationChange}
              isReadOnly={isReadOnly}
            />
          </div>
        </>
      )}
    </div>
  );
};

const getStatusBadge = (status: string) => {
  if (status === "PUBLISHED") return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 text-xs">Đã xuất bản</Badge>;
  if (status === "PENDING") return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 text-xs">Chờ duyệt</Badge>;
  if (status === "REJECTED") return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 text-xs">Cần chỉnh sửa</Badge>;
  if (status === "DRAFT") return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-xs">Bản nháp</Badge>;
  return null;
};




