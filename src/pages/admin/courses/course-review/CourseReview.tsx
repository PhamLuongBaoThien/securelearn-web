import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertCircle,
  User,
  Folder,
  Tag,
  DollarSign,
  Layers,
  Loader2,
  GitBranch,
  Video,
  HelpCircle,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ICourseReview,
  ISubscriptionCourseReview,
  CourseStatus,
  SubscriptionCatalogStatus,
} from "@/types/admin.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { usePublicCourseCategories } from "@/hooks/usePublicCourseCategories";
import { useCreateAdminCategory } from "@/hooks/useAdminCategories";
import type {
  ICourse,
  ICourseCategoryNode,
  ILesson,
} from "@/services/courseApi";
import {
  useApprovePublishedCourse,
  usePublishedCourseReviewDetail,
  usePublishedCourseReviews,
  useRejectPublishedCourse,
  useReviewCourseSubscription,
  useSubscriptionCourseReviewDetail,
  useSubscriptionCourseReviews,
} from "@/hooks/useAdminCourseReview";

type CategoryOption = {
  value: string;
  label: string;
  slug: string;
};

const flattenCategoryOptions = (
  categories: ICourseCategoryNode[],
  parentTrail = "",
): CategoryOption[] =>
  categories.flatMap((category) => {
    const label = parentTrail
      ? `${parentTrail} > ${category.name}`
      : category.name;
    return [
      { value: category._id, label, slug: category.slug },
      ...flattenCategoryOptions(category.children || [], label),
    ];
  });

const needsAdminClassification = (item?: {
  categoryResolutionStatus?: string;
}) => item?.categoryResolutionStatus === "NEEDS_ADMIN_CLASSIFICATION";

const statusConfig: Record<
  CourseStatus,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  PENDING: {
    label: "Chờ duyệt",
    icon: <Clock className="w-3.5 h-3.5" />,
    cls: "bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400",
  },
  PUBLISHED: {
    label: "Đã xuất bản",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    cls: "bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Cần chỉnh sửa",
    icon: <XCircle className="w-3.5 h-3.5" />,
    cls: "bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400",
  },
  DRAFT: {
    label: "Nháp",
    icon: <Eye className="w-3.5 h-3.5" />,
    cls: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
  },
  ARCHIVED: {
    label: "Lưu trữ",
    icon: <Eye className="w-3.5 h-3.5" />,
    cls: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
  },
};
const levelLabel: Record<string, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};
const lessonStatusLabel: Record<string, string> = {
  READY: "Sẵn sàng",
  PROCESSING: "Đang xử lý",
  DRAFT: "Nháp",
  FAILED: "Lỗi",
};

const formatLessonDuration = (seconds?: number) => {
  if (!seconds) return "";
  const minutes = Math.round(seconds / 60);
  return `${minutes} phút`;
};

const formatCourseDuration = (seconds?: number) => {
  if (!seconds) return "0 phút";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} giờ ${minutes} phút`;
  if (hours > 0) return `${hours} giờ`;
  return `${minutes} phút`;
};

const getReviewerLabel = (
  course: Pick<ICourseReview | ICourse, "reviewedBy" | "reviewedByAdmin">,
) => {
  if (course.reviewedByAdmin?.fullName) return course.reviewedByAdmin.fullName;
  if (course.reviewedByAdmin?.email) return course.reviewedByAdmin.email;
  return course.reviewedBy || "Không rõ admin";
};

const formatReviewTime = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
};

const getReviewActionLabel = (status: string) => {
  if (status === "PUBLISHED") return "Đã duyệt bởi";
  if (status === "REJECTED") return "Yêu cầu chỉnh sửa bởi";
  return "Kiểm duyệt bởi";
};

const hasLessonOverview = (content?: string) =>
  (content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}) => {
  const [reason, setReason] = useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập góp ý chỉnh sửa.");
      return;
    }
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Yêu cầu chỉnh sửa
          </DialogTitle>
          <DialogDescription>
            Cung cấp góp ý cụ thể để giảng viên biết cần cải thiện điều gì trước
            khi nộp lại.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Góp ý chỉnh sửa
          </label>
          <textarea
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 resize-none h-28 transition-all"
            placeholder="Ví dụ: Bạn vui lòng bổ sung phần..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
          <p className="mt-1.5 text-xs text-zinc-400">{reason.length} ký tự</p>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="gap-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Gửi yêu cầu chỉnh sửa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: ICourseReview | null;
  categories: ICourseCategoryNode[];
  onConfirm: (finalCategoryId?: string) => void;
  isApproving?: boolean;
  onCreateCategory: (payload: {
    name: string;
    description?: string;
    parentId?: string | null;
  }) => Promise<{ _id: string }>;
  isCreatingCategory?: boolean;
}

const ApproveDialog: React.FC<ApproveDialogProps> = ({
  open,
  onOpenChange,
  course,
  categories,
  onConfirm,
  isApproving,
  onCreateCategory,
  isCreatingCategory,
}) => {
  const categoryOptions = React.useMemo(
    () => flattenCategoryOptions(categories),
    [categories],
  );
  const selectableOptions = categoryOptions;
  const needsFinalCategory = Boolean(
    course && needsAdminClassification(course),
  );
  const [finalCategoryId, setFinalCategoryId] = useState("");
  const [finalCategoryError, setFinalCategoryError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  React.useEffect(() => {
    if (!open) {
      setFinalCategoryId("");
      setFinalCategoryError("");
      setNewCategoryName("");
      setNewCategoryParentId("");
      setNewCategoryDescription("");
    }
  }, [open]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setFinalCategoryError("Vui lòng nhập tên danh mục mới.");
      return;
    }

    try {
      const created = await onCreateCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription,
        parentId: newCategoryParentId || null,
      });
      // Auto-select the newly created category
      setFinalCategoryId(created._id);
      setFinalCategoryError("");
      setNewCategoryName("");
      setNewCategoryParentId("");
      setNewCategoryDescription("");
      toast.success("Đã tạo danh mục mới.");
    } catch (error) {
      const msg = (error as Error).message || "Không thể tạo danh mục.";
      setFinalCategoryError(msg);
      toast.error(msg);
    }
  };

  const handleConfirm = () => {
    // Clear previous error
    setFinalCategoryError("");

    if (needsFinalCategory && !finalCategoryId) {
      setFinalCategoryError("Vui lòng chọn danh mục xuất bản trước khi duyệt.");
      return;
    }

    onConfirm(finalCategoryId || undefined);
  };

  // Disable approve until final category is selected when required, or while creating/approving
  const approveDisabled = Boolean(
    isApproving ||
    isCreatingCategory ||
    (needsFinalCategory && !finalCategoryId),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Phê duyệt khóa học</DialogTitle>
          <DialogDescription>
            Xác nhận danh mục xuất bản trước khi đưa khóa học lên catalog.
          </DialogDescription>
        </DialogHeader>

        {course && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="font-semibold text-zinc-900 dark:text-white">
                {course.title}
              </p>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                Danh mục hiện tại: {course.category || "Chưa phân loại"}
              </p>
              {course.suggestedCategoryName && (
                <p className="mt-1 text-amber-600 dark:text-amber-300">
                  Chủ đề đề xuất: {course.suggestedCategoryName}
                </p>
              )}
              {course.suggestedCategoryNote && (
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                  {course.suggestedCategoryNote}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Danh mục xuất bản{" "}
                {needsFinalCategory ? (
                  <span className="text-red-500">*</span>
                ) : null}
              </label>
              <Select
                value={finalCategoryId}
                onChange={(event) => {
                  setFinalCategoryId(event.target.value);
                  if (event.target.value) setFinalCategoryError("");
                }}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-background px-3 text-sm dark:border-zinc-800"
              >
                <option value="">
                  {needsFinalCategory
                    ? "Chọn danh mục xuất bản"
                    : "Giữ nguyên danh mục hiện tại"}
                </option>
                {selectableOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {finalCategoryError && (
                <p className="mt-1 text-sm text-red-600">
                  {finalCategoryError}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Tạo danh mục mới
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Tên danh mục, VD: Lập trình Website"
                  className="h-10 rounded-xl"
                />
                <Select
                  value={newCategoryParentId}
                  onChange={(event) =>
                    setNewCategoryParentId(event.target.value)
                  }
                  className="h-10 rounded-xl border border-zinc-200 bg-background px-3 text-sm dark:border-zinc-800"
                >
                  <option value="">Tạo ở cấp gốc</option>
                  {selectableOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <textarea
                value={newCategoryDescription}
                onChange={(event) =>
                  setNewCategoryDescription(event.target.value)
                }
                className="mt-3 min-h-[72px] w-full rounded-xl border border-zinc-200 bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 dark:border-zinc-800"
                placeholder="Mô tả danh mục..."
              />
              <Button
                type="button"
                variant="outline"
                className="mt-3 rounded-xl"
                onClick={handleCreateCategory}
                disabled={isCreatingCategory}
              >
                {isCreatingCategory && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tạo và chọn danh mục
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={isApproving}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={approveDisabled}
            className="gap-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Phê duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LessonTypeIcon: React.FC<{ lesson: ILesson }> = ({ lesson }) => {
  if (lesson.type === "QUIZ")
    return <HelpCircle className="h-4 w-4 text-orange-500" />;
  return <Video className="h-4 w-4 text-blue-500" />;
};

const getCategoryPath = (
  cat: { _id: string; name: string; parentId: string | null } | null | undefined,
  nodes: ICourseCategoryNode[]
): string => {
  if (!cat) return "Chưa phân loại";
  if (!cat.parentId) return cat.name;

  const findParent = (parentId: string, list: ICourseCategoryNode[]): ICourseCategoryNode | null => {
    for (const node of list) {
      if (node._id === parentId) return node;
      if (node.children) {
        const found = findParent(parentId, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const parent = findParent(cat.parentId, nodes);
  if (parent) {
    const getPath = (node: ICourseCategoryNode): string => {
      if (node.parentId) {
        const p = findParent(node.parentId, nodes);
        if (p) return `${getPath(p)} > ${node.name}`;
      }
      return node.name;
    };
    return `${getPath(parent)} > ${cat.name}`;
  }

  return cat.name;
};

const CourseCurriculumPreview: React.FC<{
  courseId: string;
  mode?: "PUBLISH" | "SUBSCRIPTION";
}> = ({ courseId, mode = "PUBLISH" }) => {
  const { data: categories = [] } = usePublicCourseCategories();
  const publishedDetailQuery = usePublishedCourseReviewDetail(
    courseId,
    mode === "PUBLISH",
  );
  const subscriptionDetailQuery = useSubscriptionCourseReviewDetail(
    courseId,
    mode === "SUBSCRIPTION",
  );
  const detailQuery =
    mode === "SUBSCRIPTION" ? subscriptionDetailQuery : publishedDetailQuery;

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Đang tải nội dung khóa học...
      </div>
    );
  }

  if (detailQuery.error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 py-6 text-center text-sm text-red-500 dark:border-red-950/30 dark:bg-red-950/10">
        {(detailQuery.error as Error).message}
      </div>
    );
  }

  const course = detailQuery.data;
  if (!course) return null;

  const progressionLabel =
    course.progressionMode === "SEQUENTIAL"
      ? "Học tuần tự"
      : course.progressionMode === "QUIZ_REQUIRES_PREVIOUS_LESSONS"
        ? "Chặn quiz đến khi học xong"
        : "Học tự do";
  const progressionDescription =
    course.progressionMode === "SEQUENTIAL"
      ? "Học viên phải hoàn thành bài trước thì bài kế tiếp mới được mở."
      : course.progressionMode === "QUIZ_REQUIRES_PREVIOUS_LESSONS"
        ? "Video vẫn có thể mở, nhưng quiz chỉ mở khi các bài trước trong cùng phần đã hoàn thành."
        : "Học viên được mở toàn bộ bài học và bài quiz ngay từ đầu.";
  const videoLessonCount = Math.max((course.totalLessons || 0) - (course.totalQuizzes || 0), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="aspect-video h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center text-zinc-400">
                <BookOpen className="h-9 w-9" />
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {levelLabel[course.level] || course.level}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[course.status].cls}`}>
                  {statusConfig[course.status].label}
                </span>
                {course.isRevision && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                    Bản cập nhật
                  </span>
                )}
              </div>
              <h4 className="text-xl font-bold leading-snug text-zinc-950 dark:text-white">
                {course.title}
              </h4>
              {course.shortDescription && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {course.shortDescription}
                </p>
              )}
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Danh mục</p>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{getCategoryPath(course.category, categories)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Giá bán</p>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white">
                  {course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")}₫`}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Nội dung</p>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{course.sections.length} chương · {course.totalLessons} bài học</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Thời lượng</p>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{formatCourseDuration(course.totalDuration)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6 min-w-0">
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Học viên sẽ học được gì
              </h5>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.whatYouWillLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Khóa học bao gồm
            </h5>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300">
                <Video className="h-4 w-4 shrink-0 text-primary" />
                <span>{formatCourseDuration(course.totalDuration)} video</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span>{videoLessonCount} bài giảng video</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300">
                <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                <span>{course.totalQuizzes || 0} bài kiểm tra</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300">
                <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                <span>{course.totalDocuments || 0} tài liệu</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Khung chương trình học
                </h5>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {course.sections.length} chương · {course.totalLessons} bài học · {formatCourseDuration(course.totalDuration)}
                </p>
              </div>
            </div>

            {course.sections.length === 0 ? (
              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/60">
                Chưa có chương học nào được tạo.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {course.sections.map((section, sectionIndex) => (
                  <div key={section._id || sectionIndex} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="bg-zinc-50 px-4 py-3 dark:bg-zinc-950/60">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{section.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Chương {sectionIndex + 1} · {section.lessons.length} bài học
                      </p>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {section.lessons.length === 0 ? (
                        <div className="px-4 py-4 text-center text-sm italic text-zinc-400">Chương này chưa có bài học.</div>
                      ) : (
                        section.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson._id || lessonIndex} className="flex items-start gap-3 px-4 py-3">
                            <LessonTypeIcon lesson={lesson} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{lesson.title}</p>
                                {lesson.isFreePreview && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    Học thử
                                  </span>
                                )}
                              </div>
                              {hasLessonOverview(lesson.content) && (
                                <div
                                  className="prose prose-sm dark:prose-invert mt-1.5 max-w-none text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
                                  dangerouslySetInnerHTML={{ __html: lesson.content || "" }}
                                />
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                <span>{lesson.type === "QUIZ" ? "Trắc nghiệm" : "Video"}</span>
                                <span>·</span>
                                <span>{lessonStatusLabel[lesson.status || "DRAFT"] || lesson.status}</span>
                                {lesson.type === "VIDEO" && lesson.duration ? <span>· {formatLessonDuration(lesson.duration)}</span> : null}
                                {lesson.type === "QUIZ" ? <span>· {lesson.contentMeta?.questionCount || 0} câu hỏi</span> : null}
                                {(lesson.attachments?.length || 0) > 0 ? <span>· {lesson.attachments?.length} tài liệu</span> : null}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {course.requirements && course.requirements.length > 0 && (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Yêu cầu / Điều kiện tham gia
              </h5>
              <div className="mt-4 space-y-2.5">
                {course.requirements.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Mô tả khóa học
            </h5>
            {course.description ? (
              <div
                className="prose prose-sm dark:prose-invert mt-4 max-w-none text-zinc-700 dark:text-zinc-300"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            ) : (
              <p className="mt-4 text-sm italic text-zinc-400">Chưa có mô tả chi tiết cho khóa học này.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:order-last order-first">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Thông tin kiểm duyệt
              </h5>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[course.status].cls}`}>
                {statusConfig[course.status].icon}
                {statusConfig[course.status].label}
              </span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Loại bản gửi</p>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white">
                  {course.isRevision ? "Bản cập nhật khóa học" : "Khóa học mới"}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Gửi duyệt lúc</p>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white">
                  {course.submittedAt ? new Date(course.submittedAt).toLocaleString("vi-VN") : "Chưa có"}
                </p>
              </div>
              {(course.reviewedAt || course.reviewedBy) && course.status !== "PENDING" && (
                <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                  <p className="text-xs text-zinc-500">Lịch sử duyệt</p>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-white">
                    {getReviewActionLabel(course.status)} {getReviewerLabel(course)}
                  </p>
                  {course.reviewedAt && (
                    <p className="mt-1 text-xs text-zinc-500">{new Date(course.reviewedAt).toLocaleString("vi-VN")}</p>
                  )}
                  {course.status === "REJECTED" && course.rejectionReason && (
                    <p className="mt-2 rounded-lg border border-red-100 bg-red-50 p-2 text-xs leading-relaxed text-red-700 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-300">
                      {course.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Thiết lập của giảng viên
            </h5>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Luật mở bài</p>
                <p className="mt-1 font-semibold text-indigo-700 dark:text-indigo-300">{progressionLabel}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{progressionDescription}</p>
              </div>
              {/* <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/60">
                <p className="text-xs text-zinc-500">Danh mục xuất bản</p>
                <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{getCategoryPath(course.category, categories)}</p>
              </div> */}
              {needsAdminClassification(course) && course.suggestedCategoryName && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Danh mục đề xuất</p>
                  <p className="mt-1 font-semibold text-amber-800 dark:text-amber-200">{course.suggestedCategoryName}</p>
                  {course.suggestedCategoryNote && (
                    <p className="mt-1 text-xs leading-relaxed text-amber-700/80 dark:text-amber-200/80">{course.suggestedCategoryNote}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Giảng viên
            </h5>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                {course.instructorProfile?.avatarUrl ? (
                  <img src={course.instructorProfile.avatarUrl} alt={course.instructorName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-zinc-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-white">{course.instructorName}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {course.instructorProfile?.bio || "Giảng viên chưa bổ sung giới thiệu cá nhân."}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
const subscriptionStatusConfig: Record<
  Exclude<SubscriptionCatalogStatus, "NOT_OPTED_IN">,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ duyệt",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  APPROVED: {
    label: "Đang trong gói",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  REJECTED: {
    label: "Đã từ chối",
    cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  REMOVED: {
    label: "Đã rút khỏi gói",
    cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    icon: <Eye className="w-3.5 h-3.5" />,
  },
};

const ReviewModeTabs: React.FC<{
  mode: "PUBLISH" | "SUBSCRIPTION";
  onChange: (mode: "PUBLISH" | "SUBSCRIPTION") => void;
}> = ({ mode, onChange }) => (
  <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
    <Button
      variant={mode === "PUBLISH" ? "default" : "ghost"}
      className={mode === "PUBLISH" ? "shadow-sm" : ""}
      onClick={() => onChange("PUBLISH")}
    >
      Duyệt xuất bản
    </Button>
    <Button
      variant={mode === "SUBSCRIPTION" ? "default" : "ghost"}
      className={mode === "SUBSCRIPTION" ? "shadow-sm" : ""}
      onClick={() => onChange("SUBSCRIPTION")}
    >
      Duyệt vào gói thuê bao
    </Button>
  </div>
);

const SubscriptionCourseReviewPage: React.FC<{
  onChangeMode: (mode: "PUBLISH" | "SUBSCRIPTION") => void;
  initialSearch?: string;
}> = ({ onChangeMode, initialSearch = "" }) => {
  const [status, setStatus] =
    useState<Exclude<SubscriptionCatalogStatus, "NOT_OPTED_IN">>("PENDING");
  const [search, setSearch] = useState(initialSearch);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reasonAction, setReasonAction] = useState<{
    courseId: string;
    action: "REJECT" | "REMOVE";
  } | null>(null);
  const [reason, setReason] = useState("");
  const reviewQuery = useSubscriptionCourseReviews(status, search);
  const reviewMutation = useReviewCourseSubscription();
  const courses = reviewQuery.data?.courses || [];

  const submitReasonAction = () => {
    if (!reasonAction || !reason.trim()) {
      toast.error("Vui lòng nhập lý do để giảng viên biết cần xử lý gì.");
      return;
    }
    reviewMutation.mutate(
      { ...reasonAction, reason: reason.trim() },
      {
        onSuccess: () => {
          setReasonAction(null);
          setReason("");
        },
      },
    );
  };

  return (
    <div className="w-full space-y-6">
      <Dialog
        open={reasonAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReasonAction(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reasonAction?.action === "REJECT"
                ? "Từ chối đưa vào gói thuê bao"
                : "Rút khỏi gói thuê bao"}
            </DialogTitle>
            <DialogDescription>
              Lý do sẽ được hiển thị cho giảng viên trong trang quản lý khóa
              học.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-zinc-200 bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 dark:border-zinc-800"
            placeholder="Nhập lý do cụ thể..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonAction(null)}>
              Hủy
            </Button>
            <Button
              onClick={submitReasonAction}
              disabled={reviewMutation.isPending || !reason.trim()}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Kiểm duyệt Khóa học
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Xem xét các khóa học giảng viên đăng ký tham gia gói thuê bao.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {reviewQuery.data?.total || 0} khóa học
            </span>
          </div>
          <Button variant="outline" onClick={() => reviewQuery.refetch()} disabled={reviewQuery.isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${reviewQuery.isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      <ReviewModeTabs mode="SUBSCRIPTION" onChange={onChangeMode} />

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm khóa học hoặc giảng viên..."
            className="bg-transparent text-sm flex-1 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["PENDING", "APPROVED", "REJECTED", "REMOVED"] as const).map(
            (item) => (
              <Button
                key={item}
                onClick={() => setStatus(item)}
                variant="outline"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${status === item ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/30"}`}
              >
                {subscriptionStatusConfig[item].label}
              </Button>
            ),
          )}
        </div>
      </div>

      {reviewQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reviewQuery.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          {(reviewQuery.error as Error).message}
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course: ISubscriptionCourseReview) => {
            const isExpanded = expandedId === course._id;
            const config =
              subscriptionStatusConfig[
                course.subscriptionStatus as Exclude<
                  SubscriptionCatalogStatus,
                  "NOT_OPTED_IN"
                >
              ];
            return (
              <div
                key={course._id}
                className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5 flex gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-snug">
                            {course.title}
                          </h3>
                          <span
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.cls}`}
                          >
                            {config.icon}
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {course.instructor.fullName ||
                              course.instructor._id}
                          </span>
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {course.category || "Chưa phân loại"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {levelLabel[course.level]}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {course.price.toLocaleString("vi-VN")}₫
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {course.totalChapters} chương ·{" "}
                            {course.totalLessons} bài học · {course.totalVideos}{" "}
                            video · {course.totalDuration || 0} phút
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : course._id)
                        }
                        className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {course.subscriptionReviewReason &&
                      course.subscriptionStatus !== "PENDING" && (
                        <div className="mt-2 flex items-start gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Lý do: {course.subscriptionReviewReason}</span>
                        </div>
                      )}
                    {course.subscriptionReviewedAt &&
                      course.subscriptionStatus !== "PENDING" && (
                        <div className="mt-2 flex items-start gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                          <span>
                            Cập nhật bởi{" "}
                            <span className="font-medium text-zinc-700 dark:text-zinc-200">
                              {course.subscriptionReviewedByAdmin?.fullName ||
                                "Admin"}
                            </span>
                            {` ${formatReviewTime(course.subscriptionReviewedAt)}`}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <CourseCurriculumPreview
                      courseId={course._id}
                      mode="SUBSCRIPTION"
                    />
                  </div>
                )}

                {(course.subscriptionStatus === "PENDING" ||
                  course.subscriptionStatus === "APPROVED") && (
                  <div className="px-5 pb-5 flex gap-3">
                    {course.subscriptionStatus === "PENDING" && (
                      <>
                        <Button
                          onClick={() =>
                            reviewMutation.mutate({
                              courseId: course._id,
                              action: "APPROVE",
                            })
                          }
                          disabled={reviewMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle className="w-4 h-4" /> Phê duyệt
                        </Button>
                        <Button
                          onClick={() =>
                            setReasonAction({
                              courseId: course._id,
                              action: "REJECT",
                            })
                          }
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Từ chối
                        </Button>
                      </>
                    )}
                    {course.subscriptionStatus === "APPROVED" && (
                      <Button
                        onClick={() =>
                          setReasonAction({
                            courseId: course._id,
                            action: "REMOVE",
                          })
                        }
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Rút khỏi gói
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <BookOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Không có khóa học nào phù hợp.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CourseReview: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialState = (location.state || {}) as {
    mode?: "PUBLISH" | "SUBSCRIPTION";
    search?: string;
  };
  const [reviewMode, setReviewMode] = useState<"PUBLISH" | "SUBSCRIPTION">(
    initialState.mode === "SUBSCRIPTION" ? "SUBSCRIPTION" : "PUBLISH",
  );
  const { data: categories = [] } = usePublicCourseCategories();
  const createCategoryMutation = useCreateAdminCategory();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState(initialState.search || "");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);

  const reviewQuery = usePublishedCourseReviews(
    statusFilter,
    search,
    reviewMode === "PUBLISH",
  );
  const approveMutation = useApprovePublishedCourse();
  const rejectMutation = useRejectPublishedCourse();

  const courses = reviewQuery.data?.courses || [];
  useEffect(() => {
    const versionId = searchParams.get('versionId');
    if (versionId && courses.some(course => course._id === versionId)) setExpandedId(versionId);
  }, [courses, searchParams]);
  const approveTarget =
    courses.find((course) => course._id === approveTargetId) || null;
  const pendingCount =
    statusFilter === "PENDING"
      ? reviewQuery.data?.total || courses.length
      : courses.filter((c) => c.status === "PENDING").length;
  const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";
  const fmtDuration = (mins?: number) => {
    if (!mins) return "-";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? m + "m" : ""}`;
  };

  if (reviewMode === "SUBSCRIPTION") {
    return <SubscriptionCourseReviewPage onChangeMode={setReviewMode} initialSearch={initialState.search || ""} />;
  }

  return (
    <div className="w-full space-y-6">
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={(o) => {
          setRejectDialogOpen(o);
          if (!o) setRejectTargetId(null);
        }}
        onConfirm={(reason) =>
          rejectTargetId &&
          rejectMutation.mutate(
            { courseId: rejectTargetId, reason },
            {
              onSuccess: () => {
                setRejectTargetId(null);
                setRejectDialogOpen(false);
              },
            },
          )
        }
        isPending={rejectMutation.isPending}
      />

      <ApproveDialog
        open={approveTargetId !== null}
        onOpenChange={(o) => {
          if (!o) setApproveTargetId(null);
        }}
        course={approveTarget}
        categories={categories}
        isApproving={approveMutation.isPending}
        isCreatingCategory={createCategoryMutation.isPending}
        onCreateCategory={(payload) =>
          createCategoryMutation.mutateAsync(payload)
        }
        onConfirm={(finalCategoryId) =>
          approveTargetId &&
          approveMutation.mutate(
            { courseId: approveTargetId, finalCategoryId },
            { onSuccess: () => setApproveTargetId(null) },
          )
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Kiểm duyệt Khóa học
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Xem xét và phê duyệt khóa học từ giảng viên trước khi xuất bản.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {pendingCount} chờ duyệt
            </span>
          </div>
          <Button variant="outline" onClick={() => reviewQuery.refetch()} disabled={reviewQuery.isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${reviewQuery.isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      <ReviewModeTabs mode="PUBLISH" onChange={setReviewMode} />

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <Input
            className="bg-transparent text-sm flex-1 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            placeholder="Tìm khóa học, giảng viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["PENDING", "PUBLISHED", "REJECTED", "ARCHIVED"] as const).map(
            (s) => (
              <Button
                key={s}
                onClick={() => setStatusFilter(s)}
                variant="outline"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/30"}`}
              >
                {statusConfig[s as CourseStatus]?.label || s}
              </Button>
            ),
          )}
        </div>
      </div>

      {reviewQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reviewQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {(reviewQuery.error as Error).message}
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course: ICourseReview) => {
            const sc = statusConfig[course.status];
            const isExpanded = expandedId === course._id;
            return (
              <div
                key={course._id}
                className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5 flex gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-snug">
                            {course.title}
                          </h3>
                          <span
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}
                          >
                            {sc.icon}
                            {sc.label}
                          </span>
                          {course.isRevision && (
                            <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                              <GitBranch className="w-3.5 h-3.5" /> Bản cập nhật
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {course.instructor.fullName ||
                              course.instructor._id}
                          </span>
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {course.category || "Chưa phân loại"}
                          </span>
                          {needsAdminClassification(course) &&
                            course.suggestedCategoryName && (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
                                <AlertCircle className="w-3 h-3" />
                                Đề xuất: {course.suggestedCategoryName}
                              </span>
                            )}
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {levelLabel[course.level]}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {fmt(course.price)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {course.totalChapters} chương ·{" "}
                            {course.totalLessons} bài học ·{" "}
                            {fmtDuration(course.totalDuration)}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : course._id)
                        }
                        variant="ghost"
                        size="icon"
                        className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {course.status === "REJECTED" && course.rejectionReason && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{course.rejectionReason}</span>
                      </div>
                    )}

                    {(course.reviewedAt || course.reviewedBy) &&
                      course.status !== "PENDING" && (
                        <div className="mt-2 flex items-start gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                          <span>
                            {getReviewActionLabel(course.status)}{" "}
                            <span className="font-medium text-zinc-700 dark:text-zinc-200">
                              {getReviewerLabel(course)}
                            </span>
                            {course.reviewedAt
                              ? ` ${formatReviewTime(course.reviewedAt)}`
                              : ""}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <CourseCurriculumPreview courseId={course._id} />
                  </div>
                )}

                {course.status === "PENDING" && (
                  <div className="px-5 pb-5 flex gap-3">
                    <Button
                      onClick={() => setApproveTargetId(course._id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle className="w-4 h-4" /> Phê duyệt
                    </Button>
                    <Button
                      onClick={() => {
                        setRejectTargetId(course._id);
                        setRejectDialogOpen(true);
                      }}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Yêu cầu chỉnh sửa
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <BookOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Không có khóa học nào phù hợp.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};






