// ========================
// Instructor Courses Page
// Mục đích:
// - hiển thị danh sách khóa học của giảng viên và các action editor/review
// - thêm entry để instructor gửi course published vào catalog thuê bao
// ========================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Edit, Trash2, Upload, Loader2, Clock, AlertCircle, ArrowRightLeft, WalletCards } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import {
  useGetMyCourses,
  useCreateCourse,
  useDeleteCourse,
  useSubmitCourseForReview,
  useCreateOrGetCourseRevision,
  useOptInCourseSubscription,
  useWithdrawCourseSubscription,
} from '@/hooks/useInstructorCourses';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">Đã xuất bản</Badge>;
    case 'PENDING':
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">Chờ duyệt</Badge>;
    case 'REJECTED':
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">Cần chỉnh sửa</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Bản nháp</Badge>;
    case 'ARCHIVED':
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">Đã lưu trữ</Badge>;
    default:
      return null;
  }
};

const formatCurrency = (amount: number) => {
  if (amount === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}p`;
  return `${minutes} phút`;
};

export const InstructorCourses: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null); // state dùng để lưu thông tin course cần xóa (tên và id) và mở dialog confirm xóa.

  // React Query Hooks
  const { data: courses = [], isLoading, error } = useGetMyCourses();
  const createCourseMutation = useCreateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const submitReviewMutation = useSubmitCourseForReview();
  const revisionMutation = useCreateOrGetCourseRevision();
  const subscriptionMutation = useOptInCourseSubscription();
  const withdrawSubscriptionMutation = useWithdrawCourseSubscription();

  // Filter logic
  const filteredCourses = courses.filter((course) => {
    const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || course.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const approvedSubscriptionCourses = courses.filter((course) => course.subscriptionStatus === 'APPROVED').length;
  const pendingSubscriptionCourses = courses.filter((course) => course.subscriptionStatus === 'PENDING').length;

  const handleCreateCourse = () => {
    createCourseMutation.mutate(
      { title: 'Khóa học mới (chưa đặt tên)' },
      {
        onSuccess: (newCourse) => {
          toast.success('Đã tạo khóa học mới!');
          navigate(`/instructor/courses/${newCourse._id}/edit`);
        },
        onError: (err: unknown) => {
          toast.error((err as Error).message || 'Không thể tạo khóa học.');
        },
      }
    );
  };

  const handleDeleteCourse = () => {
    if (!deleteTarget) return;
    deleteCourseMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Đã xóa khóa học "${deleteTarget.title}".`);
        setDeleteTarget(null);
      },
      onError: (err: unknown) => {
        toast.error((err as Error).message || 'Không thể xóa khóa học.');
        setDeleteTarget(null);
      },
    });
  };

  const handleSubmitReview = (courseId: string) => {
    submitReviewMutation.mutate(courseId, {
      onSuccess: () => {
        toast.success('Khóa học đã được gửi duyệt!');
      },
      onError: (err: unknown) => {
        toast.error((err as Error).message || 'Không thể gửi duyệt khóa học.');
      },
    });
  };

  const handleEditCourse = (course: typeof courses[number]) => {
    if (course.status !== 'PUBLISHED') {
      navigate(`/instructor/courses/${course._id}/edit`);
      return;
    }

    revisionMutation.mutate(course._id, {
      onSuccess: (revision) => {
        navigate(`/instructor/courses/${revision._id}/edit`);
      },
      onError: (err: unknown) => {
        toast.error((err as Error).message || 'Không thể mở bản cập nhật.');
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Khóa học của tôi
          </h1>
          <p className="text-muted-foreground mt-2">Quản lý các khóa học đang có và tạo khóa học mới.</p>
        </div>
        
        <Button 
          onClick={handleCreateCourse}
          disabled={createCourseMutation.isPending}
          className="shrink-0 h-11 px-6 rounded-xl font-medium gap-2"
        >
          {createCourseMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Tạo khóa học mới
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center text-primary">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-white">Đưa khóa học vào gói thuê bao</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Khi đưa khóa học vào gói này, bạn có cơ hội tiếp cận thêm nhiều học viên mới và nhận doanh thu dựa trên thời gian học thực tế. Nếu đổi ý, bạn vẫn có thể rút khóa học ra; học viên mới sẽ không thể mở khóa nữa, còn những người đã bắt đầu học vẫn tiếp tục đến hết kỳ hiện tại.
              </p>
              <Link to="/instructor/performance" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Xem doanh thu thuê bao
                <ArrowRightLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Đã tham gia gói thuê bao</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{approvedSubscriptionCourses}</p>
          <p className="mt-1 text-xs text-zinc-400">Học viên dùng gói có thể vào học ngay.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Đang chờ quản trị viên duyệt</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{pendingSubscriptionCourses}</p>
          <p className="mt-1 text-xs text-zinc-400">Bạn có thể rút lại bất cứ lúc nào trước khi được duyệt.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input 
            placeholder="Tìm kiếm khóa học..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
           <Button 
             variant={statusFilter === 'ALL' ? 'default' : 'outline'}
             onClick={() => setStatusFilter('ALL')}
             className="h-11 rounded-xl text-sm"
           >
             Tất cả ({courses.length})
           </Button>
           <Button 
             variant={statusFilter === 'PUBLISHED' ? 'default' : 'outline'}
             onClick={() => setStatusFilter('PUBLISHED')}
             className="h-11 rounded-xl text-sm"
           >
             Đã xuất bản
           </Button>
           <Button 
             variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
             onClick={() => setStatusFilter('DRAFT')}
             className="h-11 rounded-xl text-sm"
           >
             Bản nháp
           </Button>
           <Button
             variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
             onClick={() => setStatusFilter('PENDING')}
             className="h-11 rounded-xl text-sm"
           >
             Chờ duyệt
           </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-destructive font-medium">Lỗi tải dữ liệu: {(error as Error).message}</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Edit className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">
            {courses.length === 0 ? 'Chưa có khóa học nào' : 'Không tìm thấy kết quả'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {courses.length === 0 
              ? 'Bắt đầu tạo khóa học đầu tiên của bạn ngay bây giờ!' 
              : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'}
          </p>
          {courses.length === 0 && (
            <Button onClick={handleCreateCourse} disabled={createCourseMutation.isPending} className="gap-2">
              <Plus className="w-4 h-4" /> Tạo khóa học
            </Button>
          )}
        </div>
      ) : (
        /* Course Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course._id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                    <Edit className="w-10 h-10 text-zinc-400" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  {getStatusBadge(course.status)}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/90 text-zinc-700 backdrop-blur-sm hover:bg-white dark:bg-black/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit className="w-4 h-4" /> {course.status === 'PUBLISHED' ? 'Tạo bản cập nhật' : 'Chỉnh sửa'}
                      </DropdownMenuItem>

                      {(course.status === 'DRAFT' || course.status === 'REJECTED') && (
                        <>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => handleSubmitReview(course._id)}
                          >
                            <Upload className="w-4 h-4" /> Gửi duyệt
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
                            onClick={() => setDeleteTarget({ id: course._id, title: course.title })}
                          >
                            <Trash2 className="w-4 h-4" /> Xóa
                          </DropdownMenuItem>
                        </>
                      )}
                      {course.status === 'PUBLISHED' && ['NOT_OPTED_IN', 'REJECTED', 'REMOVED', undefined].includes(course.subscriptionStatus) && (
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => subscriptionMutation.mutate(course._id)}
                        >
                          <Upload className="w-4 h-4" /> Đưa vào gói thuê bao
                        </DropdownMenuItem>
                      )}
                      {course.status === 'PUBLISHED' && ['APPROVED', 'PENDING'].includes(course.subscriptionStatus || '') && (
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
                          onClick={() => withdrawSubscriptionMutation.mutate(course._id)}
                        >
                          <ArrowRightLeft className="w-4 h-4" /> Rút khỏi gói thuê bao
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content */}
              <div 
                className="p-5 flex flex-col flex-1 cursor-pointer"
                onClick={() => handleEditCourse(course)}
              >
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                {course.status === 'PENDING' && !course.activeRevision && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Khóa học đang chờ duyệt</span>
                  </div>
                )}
                {course.status === 'REJECTED' && !course.activeRevision && course.rejectionReason && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Yêu cầu chỉnh sửa: {course.rejectionReason}</span>
                  </div>
                )}
                {course.activeRevision && (
                  <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                    course.activeRevision.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      : course.activeRevision.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                  }`}>
                    {course.activeRevision.status === 'PENDING' ? <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span>
                      {course.activeRevision.status === 'PENDING'
                        ? 'Bản cập nhật đang chờ duyệt'
                        : course.activeRevision.status === 'REJECTED'
                        ? `Bản cập nhật cần chỉnh sửa${course.activeRevision.rejectionReason ? `: ${course.activeRevision.rejectionReason}` : ''}`
                          : 'Có bản nháp cập nhật'}
                    </span>
                  </div>
                )}
                {course.status === 'PUBLISHED' && (
                  <div className="mt-3">
                    <Badge variant="outline">
                      Thuê bao: {course.subscriptionStatus === 'APPROVED' ? 'Đã duyệt' : course.subscriptionStatus === 'PENDING' ? 'Chờ duyệt' : course.subscriptionStatus === 'REJECTED' ? 'Bị từ chối' : course.subscriptionStatus === 'REMOVED' ? 'Đã rút' : 'Chưa đăng ký'}
                    </Badge>
                    {course.subscriptionStatus === 'APPROVED' && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Học viên đang dùng gói có thể mở khóa học này ngay. Nếu muốn dừng học viên mới vào học theo gói, bạn có thể rút khóa học ra bất cứ lúc nào.
                      </p>
                    )}
                    {course.subscriptionStatus === 'PENDING' && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Khóa học đang chờ quản trị viên duyệt vào gói. Nếu đổi ý, bạn có thể rút lại trước khi được duyệt.
                      </p>
                    )}
                    {['REJECTED', 'REMOVED'].includes(course.subscriptionStatus || '') && course.subscriptionReviewReason && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Lý do: {course.subscriptionReviewReason}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Giá bán</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {formatCurrency(course.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Nội dung</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {course.totalLessons || 0} bài • {formatDuration(course.totalDuration || 0)}
                    </span>
                  </div>

                  {course.status === 'PUBLISHED' && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-zinc-500 dark:text-zinc-400">Học viên</span>
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {course.enrollmentCount || 0} đã ghi danh
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Cập nhật {new Date(course.updatedAt).toLocaleDateString('vi-VN')}</span>
                <span className="capitalize text-zinc-400">{course.level?.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa khóa học?"
        description={`Bạn có chắc muốn xóa khóa học "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        onConfirm={handleDeleteCourse}
        variant="destructive"
      />
    </div>
  );
};
