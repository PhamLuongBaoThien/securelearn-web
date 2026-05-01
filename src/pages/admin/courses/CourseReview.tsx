import React, { useState } from 'react';
import {
  Search, CheckCircle, XCircle, Clock, Eye,
  ChevronDown, ChevronUp, BookOpen, AlertCircle,
  User, Folder, Tag, DollarSign, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ICourseReview, CourseStatus } from '@/types/admin.types';
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

const MOCK_COURSES: ICourseReview[] = [
  { _id: 'c1', title: 'Ethical Hacking: Từ Zero đến Chuyên Gia', slug: 'ethical-hacking', description: 'Khóa học toàn diện về kiểm thử bảo mật, bao gồm reconnaissance, exploitation, và reporting. Phù hợp cho người bắt đầu và chuyên gia muốn nâng cao kỹ năng thực chiến.', thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80', instructor: { _id: 'i1', fullName: 'Trần Văn Minh', email: 'minh.instructor@gmail.com' }, category: 'Bảo mật thông tin', level: 'INTERMEDIATE', price: 899000, status: 'PENDING', totalLessons: 45, totalChapters: 8, totalDuration: 1800, submittedAt: '2026-04-20T10:00:00Z', createdAt: '2026-04-01T00:00:00Z' },
  { _id: 'c2', title: 'React & TypeScript Masterclass 2026', slug: 'react-typescript', description: 'Học lập trình React hiện đại với TypeScript, từ cơ bản đến nâng cao. Dự án thực tế: xây dựng ứng dụng ecommerce hoàn chỉnh.', thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80', instructor: { _id: 'i2', fullName: 'Nguyễn Thị Lan', email: 'lan.dev@gmail.com' }, category: 'Lập trình Web', level: 'INTERMEDIATE', price: 699000, status: 'PENDING', totalLessons: 62, totalChapters: 10, totalDuration: 2400, submittedAt: '2026-04-19T14:30:00Z', createdAt: '2026-03-25T00:00:00Z' },
  { _id: 'c3', title: 'Docker & Kubernetes cho Developers', slug: 'docker-k8s', description: 'Container hóa ứng dụng và triển khai trên Kubernetes. Bao gồm CI/CD pipeline với GitHub Actions.', thumbnailUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&q=80', instructor: { _id: 'i3', fullName: 'Phạm Anh Tuấn', email: 'tuan.devops@gmail.com' }, category: 'DevOps & Cloud', level: 'ADVANCED', price: 1199000, status: 'PUBLISHED', totalLessons: 38, totalChapters: 7, totalDuration: 1500, submittedAt: '2026-04-10T09:00:00Z', createdAt: '2026-03-15T00:00:00Z' },
  { _id: 'c4', title: 'Python Cơ Bản Cho Người Mới', slug: 'python-basics', description: 'Giới thiệu Python từ cài đặt đến xử lý file, web scraping và automation cơ bản.', thumbnailUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80', instructor: { _id: 'i2', fullName: 'Nguyễn Thị Lan', email: 'lan.dev@gmail.com' }, category: 'Lập trình', level: 'BEGINNER', price: 299000, status: 'REJECTED', totalLessons: 20, totalChapters: 4, totalDuration: 600, submittedAt: '2026-04-05T11:00:00Z', rejectionReason: 'Nội dung chưa đầy đủ, thiếu phần về OOP và xử lý ngoại lệ.', createdAt: '2026-03-01T00:00:00Z' },
];

const statusConfig: Record<CourseStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  PENDING: { label: 'Chờ duyệt', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400' },
  PUBLISHED: { label: 'Đã xuất bản', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' },
  REJECTED: { label: 'Từ chối', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400' },
  DRAFT: { label: 'Nháp', icon: <Eye className="w-3.5 h-3.5" />, cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' },
};
const levelLabel: Record<string, string> = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };

// ===== Reject Dialog =====
interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

const RejectDialog: React.FC<RejectDialogProps> = ({ open, onOpenChange, onConfirm }) => {
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleConfirm = () => {
    if (!reason.trim()) { toast.error('Vui lòng nhập lý do từ chối.'); return; }
    onConfirm(reason);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Từ chối khóa học
          </DialogTitle>
          <DialogDescription>
            Cung cấp lý do cụ thể để giảng viên biết cần cải thiện điều gì trước khi nộp lại.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Lý do từ chối</label>
          <textarea
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 resize-none h-28 transition-all"
            placeholder="Ví dụ: Nội dung chưa đầy đủ, thiếu phần về..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
          <p className="mt-1.5 text-xs text-zinc-400">{reason.length} ký tự — lý do sẽ được gửi email đến giảng viên.</p>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
          >
            <XCircle className="w-4 h-4" />
            Xác nhận từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== Main Page =====
export const CourseReview: React.FC = () => {
  const [courses, setCourses] = useState<ICourseReview[]>(MOCK_COURSES);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);

  const filtered = courses.filter((c) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.fullName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleApprove = () => {
    if (!approveTargetId) return;
    setCourses((p) => p.map((c) => c._id === approveTargetId ? { ...c, status: 'PUBLISHED' as CourseStatus } : c));
    toast.success('Khóa học đã được phê duyệt và xuất bản!');
    setApproveTargetId(null);
  };

  const handleReject = (reason: string) => {
    if (!rejectTargetId) return;
    setCourses((p) => p.map((c) => c._id === rejectTargetId ? { ...c, status: 'REJECTED', rejectionReason: reason } : c));
    toast.error('Đã từ chối khóa học.');
    setRejectTargetId(null);
  };

  const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';
  const fmtDuration = (mins?: number) => {
    if (!mins) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? m + 'm' : ''}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Reject Dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={(o) => { setRejectDialogOpen(o); if (!o) setRejectTargetId(null); }}
        onConfirm={handleReject}
      />

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        open={approveTargetId !== null}
        onOpenChange={(o) => { if (!o) setApproveTargetId(null); }}
        title="Phê duyệt khóa học?"
        description="Khóa học sẽ được xuất bản ngay lập tức và học viên có thể đăng ký. Bạn có chắc chắn?"
        confirmText="Phê duyệt & Xuất bản"
        onConfirm={handleApprove}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Kiểm duyệt Khóa học</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Xem xét và phê duyệt khóa học từ Giảng viên trước khi xuất bản.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {courses.filter((c) => c.status === 'PENDING').length} chờ duyệt
          </span>
        </div>
      </div>

      {/* Filters */}
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
          {(['', 'PENDING', 'PUBLISHED', 'REJECTED'] as const).map((s) => (
            <Button
              key={s}
              onClick={() => setStatusFilter(s)}
              variant="outline"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/30'}`}
            >
              {s === '' ? 'Tất cả' : statusConfig[s as CourseStatus]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Course Cards */}
      <div className="space-y-4">
        {filtered.map((course) => {
          const sc = statusConfig[course.status];
          const isExpanded = expandedId === course._id;
          return (
            <div key={course._id} className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 flex gap-4">
                {/* Thumbnail */}
                <div className="w-28 h-20 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
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
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{course.instructor.fullName}</span>
                        <span className="flex items-center gap-1"><Folder className="w-3 h-3" />{course.category}</span>
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

                  {/* Rejection reason */}
                  {course.status === 'REJECTED' && course.rejectionReason && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{course.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Mô tả khóa học:</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{course.description}</p>
                </div>
              )}

              {/* Actions */}
              {course.status === 'PENDING' && (
                <div className="px-5 pb-5 flex gap-3">
                  <Button
                    id={`btn-approve-${course._id}`}
                    onClick={() => setApproveTargetId(course._id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle className="w-4 h-4" /> Phê duyệt
                  </Button>
                  <Button
                    id={`btn-reject-${course._id}`}
                    onClick={() => { setRejectTargetId(course._id); setRejectDialogOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Từ chối
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Không có khóa học nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
};
