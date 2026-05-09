// ========================
// Instructor Courses: Danh sách khóa học
// ========================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useGetMyCourses, useCreateCourse, useDeleteCourse, usePublishCourse } from '@/hooks/useInstructorCourses';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">Đã xuất bản</Badge>;
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
  const publishCourseMutation = usePublishCourse();

  // Filter logic
  const filteredCourses = courses.filter((course) => {
    const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || course.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateCourse = () => {
    createCourseMutation.mutate(
      { title: 'Khóa học mới (chưa đặt tên)' },
      {
        onSuccess: (newCourse) => {
          toast.success('Đã tạo khóa học mới!');
          navigate(`/instructor/courses/${newCourse._id}/edit`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Không thể tạo khóa học.');
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
      onError: (err: any) => {
        toast.error(err.message || 'Không thể xóa khóa học.');
        setDeleteTarget(null);
      },
    });
  };

  const handlePublishCourse = (courseId: string) => {
    publishCourseMutation.mutate(courseId, {
      onSuccess: () => {
        toast.success('Khóa học đã được xuất bản!');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Không thể xuất bản khóa học.');
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
                      <button className="h-8 w-8 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={() => navigate(`/instructor/courses/${course._id}/edit`)}
                      >
                        <Edit className="w-4 h-4" /> Chỉnh sửa
                      </DropdownMenuItem>

                      {course.status === 'DRAFT' && (
                        <>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => handlePublishCourse(course._id)}
                          >
                            <Upload className="w-4 h-4" /> Xuất bản
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
                            onClick={() => setDeleteTarget({ id: course._id, title: course.title })}
                          >
                            <Trash2 className="w-4 h-4" /> Xóa
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content */}
              <div 
                className="p-5 flex flex-col flex-1 cursor-pointer"
                onClick={() => navigate(`/instructor/courses/${course._id}/edit`)}
              >
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                
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
