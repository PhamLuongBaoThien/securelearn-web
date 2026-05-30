import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, CheckCircle, XCircle, Clock, Eye,
  ChevronDown, ChevronUp, BookOpen, AlertCircle,
  User, Folder, Tag, DollarSign, Layers, Loader2, GitBranch,
  Video, HelpCircle, Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ICourseReview, CourseStatus } from '@/types/admin.types';
import { approveCourse, getCourseReviewDetail, getCoursesForReview, rejectCourse } from '@/services/adminApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ICourse, ILesson } from '@/services/courseApi';

const statusConfig: Record<CourseStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  PENDING: { label: 'Chờ duyệt', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400' },
  PUBLISHED: { label: 'Đã xuất bản', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' },
  REJECTED: { label: 'Cần chỉnh sửa', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400' },
  DRAFT: { label: 'Nháp', icon: <Eye className="w-3.5 h-3.5" />, cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' },
  ARCHIVED: { label: 'Lưu trữ', icon: <Eye className="w-3.5 h-3.5" />, cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' },
};
const levelLabel: Record<string, string> = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };
const lessonStatusLabel: Record<string, string> = {
  READY: 'Sẵn sàng',
  PROCESSING: 'Đang xử lý',
  DRAFT: 'Nháp',
  FAILED: 'Lỗi',
};

const formatLessonDuration = (seconds?: number) => {
  if (!seconds) return '';
  const minutes = Math.round(seconds / 60);
  return `${minutes} phút`;
};

const getReviewerLabel = (course: Pick<ICourseReview | ICourse, 'reviewedBy' | 'reviewedByAdmin'>) => {
  if (course.reviewedByAdmin?.fullName) return course.reviewedByAdmin.fullName;
  if (course.reviewedByAdmin?.email) return course.reviewedByAdmin.email;
  return course.reviewedBy || 'Không rõ admin';
};

const formatReviewTime = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
};

const getReviewActionLabel = (status: string) => {
  if (status === 'PUBLISHED') return 'Đã duyệt bởi';
  if (status === 'REJECTED') return 'Yêu cầu chỉnh sửa bởi';
  return 'Kiểm duyệt bởi';
};

const hasLessonOverview = (content?: string) => (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length > 0;

const richTextPreviewClassName = 'prose prose-sm dark:prose-invert mt-1 max-w-none';

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

const RejectDialog: React.FC<RejectDialogProps> = ({ open, onOpenChange, onConfirm, isPending }) => {
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleConfirm = () => {
    if (!reason.trim()) { toast.error('Vui lòng nhập góp ý chỉnh sửa.'); return; }
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
            Cung cấp góp ý cụ thể để giảng viên biết cần cải thiện điều gì trước khi nộp lại.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Góp ý chỉnh sửa</label>
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
          <Button onClick={() => onOpenChange(false)} variant="outline" className="rounded-xl" disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isPending} className="gap-2 bg-red-500 text-white rounded-xl hover:bg-red-600">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Gửi yêu cầu chỉnh sửa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LessonTypeIcon: React.FC<{ lesson: ILesson }> = ({ lesson }) => {
  if (lesson.type === 'QUIZ') return <HelpCircle className="h-4 w-4 text-orange-500" />;
  return <Video className="h-4 w-4 text-blue-500" />;
};

const CourseCurriculumPreview: React.FC<{ courseId: string }> = ({ courseId }) => {
  const detailQuery = useQuery({
    queryKey: ['admin', 'courses', 'review-detail', courseId],
    queryFn: async () => {
      const response = await getCourseReviewDetail(courseId);
      if (response.status === 'ERR' || !response.data) throw new Error(response.message || 'Không tải được chi tiết khóa học.');
      return response.data as ICourse;
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải nội dung khóa học...
      </div>
    );
  }

  if (detailQuery.error) {
    return <p className="py-4 text-sm text-red-500">{(detailQuery.error as Error).message}</p>;
  }

  const course = detailQuery.data;
  if (!course) return null;

  return (
    <div className="mt-5 space-y-5">
      {(course.reviewedAt || course.reviewedBy) && course.status !== 'PENDING' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Thông tin kiểm duyệt</h4>
          <div className="space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <p>
              {getReviewActionLabel(course.status)} <span className="font-medium text-zinc-700 dark:text-zinc-200">{getReviewerLabel(course)}</span>
              {course.reviewedAt ? ` ${formatReviewTime(course.reviewedAt)}` : ''}
            </p>
            {course.reviewedByAdmin?.email && <p>Email: {course.reviewedByAdmin.email}</p>}
            {course.status === 'REJECTED' && course.rejectionReason && <p>Lý do: {course.rejectionReason}</p>}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Mô tả ngắn</h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{course.shortDescription || 'Không có'}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Mô tả khóa học</h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{course.description || 'Chưa có mô tả.'}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Nội dung khóa học</h4>
        {course.sections.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-400">Chưa có chương nào.</p>
        ) : (
          <div className="space-y-3">
            {course.sections.map((section, sectionIndex) => (
              <div key={section._id || sectionIndex} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{section.title}</p>
                    <p className="text-xs text-zinc-400">{section.lessons.length} bài học</p>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {section.lessons.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-red-500">Chương này chưa có bài học.</div>
                  ) : section.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson._id || lessonIndex} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <LessonTypeIcon lesson={lesson} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-800 dark:text-zinc-100 truncate">{lesson.title}</p>
                        {hasLessonOverview(lesson.content) ? (
                          <div
                            className={richTextPreviewClassName}
                            dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
                          />
                        ) : (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Chưa có mô tả tổng quan.</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span>{lesson.type === 'QUIZ' ? 'Quiz' : 'Video'}</span>
                          <span>•</span>
                          <span>{lessonStatusLabel[lesson.status || 'DRAFT'] || lesson.status || 'Nháp'}</span>
                          {lesson.type === 'VIDEO' && lesson.duration ? (
                            <>
                              <span>•</span>
                              <span>{formatLessonDuration(lesson.duration)}</span>
                            </>
                          ) : null}
                          {lesson.type === 'QUIZ' ? (
                            <>
                              <span>•</span>
                              <span>{lesson.contentMeta?.questionCount || 0} câu hỏi</span>
                            </>
                          ) : null}
                          {(lesson.attachments?.length || 0) > 0 ? (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{lesson.attachments?.length} tài liệu</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      {lesson.isFreePreview && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                          Xem thử
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CourseReview: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);

  const reviewQuery = useQuery({
    queryKey: ['admin', 'courses', 'review', statusFilter, search],
    queryFn: async () => {
      const response = await getCoursesForReview({ status: statusFilter || undefined, search: search || undefined, page: 1, limit: 50 });
      if (response.status === 'ERR' || !response.data) throw new Error(response.message || 'Không tải được danh sách khóa học.');
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (courseId: string) => approveCourse(courseId),
    onSuccess: (response) => {
      if (response.status === 'ERR') throw new Error(response.message);
      toast.success(response.message || 'Khóa học đã được phê duyệt và xuất bản!');
      setApproveTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'review'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể phê duyệt khóa học.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ courseId, reason }: { courseId: string; reason: string }) => rejectCourse(courseId, reason),
    onSuccess: (response) => {
      if (response.status === 'ERR') throw new Error(response.message);
      toast.success(response.message || 'Đã gửi yêu cầu chỉnh sửa.');
      setRejectTargetId(null);
      setRejectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'review'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể gửi yêu cầu chỉnh sửa.'),
  });

  const courses = reviewQuery.data?.courses || [];
  const pendingCount = statusFilter === 'PENDING' ? reviewQuery.data?.total || courses.length : courses.filter((c) => c.status === 'PENDING').length;
  const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';
  const fmtDuration = (mins?: number) => {
    if (!mins) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? m + 'm' : ''}`;
  };

  return (
    <div className="w-full space-y-6">
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={(o) => { setRejectDialogOpen(o); if (!o) setRejectTargetId(null); }}
        onConfirm={(reason) => rejectTargetId && rejectMutation.mutate({ courseId: rejectTargetId, reason })}
        isPending={rejectMutation.isPending}
      />

      <ConfirmDialog
        open={approveTargetId !== null}
        onOpenChange={(o) => { if (!o) setApproveTargetId(null); }}
        title="Phê duyệt khóa học?"
        description="Khóa học sẽ được xuất bản hoặc bản cập nhật sẽ được áp dụng vào khóa học public hiện tại."
        confirmText="Phê duyệt"
        onConfirm={() => approveTargetId && approveMutation.mutate(approveTargetId)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Kiểm duyệt Khóa học</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Xem xét và phê duyệt khóa học từ giảng viên trước khi xuất bản.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{pendingCount} chờ duyệt</span>
        </div>
      </div>

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
          {(['PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'] as const).map((s) => (
            <Button
              key={s}
              onClick={() => setStatusFilter(s)}
              variant="outline"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/30'}`}
            >
              {statusConfig[s as CourseStatus]?.label || s}
            </Button>
          ))}
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
              <div key={course._id} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 flex gap-4">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                    {course.thumbnailUrl
                      ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-zinc-400" /></div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-snug">{course.title}</h3>
                          <span className={`shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                            {sc.icon}{sc.label}
                          </span>
                          {course.isRevision && (
                            <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                              <GitBranch className="w-3.5 h-3.5" /> Bản cập nhật
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{course.instructor.fullName || course.instructor._id}</span>
                          <span className="flex items-center gap-1"><Folder className="w-3 h-3" />{course.category || 'Chưa phân loại'}</span>
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{levelLabel[course.level]}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmt(course.price)}</span>
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{course.totalChapters} chương · {course.totalLessons} bài · {fmtDuration(course.totalDuration)}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setExpandedId(isExpanded ? null : course._id)}
                        variant="ghost"
                        size="icon"
                        className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>

                    {course.status === 'REJECTED' && course.rejectionReason && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{course.rejectionReason}</span>
                      </div>
                    )}

                    {(course.reviewedAt || course.reviewedBy) && course.status !== 'PENDING' && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                        <span>
                          {getReviewActionLabel(course.status)} <span className="font-medium text-zinc-700 dark:text-zinc-200">{getReviewerLabel(course)}</span>
                          {course.reviewedAt ? ` ${formatReviewTime(course.reviewedAt)}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <CourseCurriculumPreview courseId={course._id} />
                  </div>
                )}

                {course.status === 'PENDING' && (
                  <div className="px-5 pb-5 flex gap-3">
                    <Button
                      onClick={() => setApproveTargetId(course._id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle className="w-4 h-4" /> Phê duyệt
                    </Button>
                    <Button
                      onClick={() => { setRejectTargetId(course._id); setRejectDialogOpen(true); }}
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
