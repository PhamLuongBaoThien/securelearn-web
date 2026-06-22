import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  Clipboard,
  ChevronDown,
  CreditCard,
  Eye,
  FilePenLine,
  Filter,
  GraduationCap,
  ListChecks,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  RefreshCw,
  Search,
  Star,
  Users,
  CheckCircle2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCategories, getLearningProgress } from '@/services/adminApi';
import { useAdminCourses } from '@/hooks/useAdminCourses';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  CourseLevel,
  IAdminCourseListItem,
  ICategory,
  SubscriptionCatalogStatus,
} from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PAGE_SIZE = 12;

const subscriptionConfig: Record<SubscriptionCatalogStatus, { label: string; cls: string }> = {
  NOT_OPTED_IN: { label: 'Chưa đăng ký', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
  PENDING: { label: 'Chờ duyệt gói', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' },
  APPROVED: { label: 'Trong gói', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  REJECTED: { label: 'Từ chối', cls: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
  REMOVED: { label: 'Đã rút', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
};

const levelLabel: Record<CourseLevel, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

const fmtMoney = (value: number) => value === 0 ? 'Miễn phí' : `${value.toLocaleString('vi-VN')} đ`;
const fmtDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}g ${rest}p` : `${hours} giờ`;
};
const fmtDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

const flattenCategories = (categories: ICategory[], level = 0): Array<ICategory & { depth: number }> =>
  categories.flatMap((category) => [
    { ...category, depth: level },
    ...flattenCategories(category.children || [], level + 1),
  ]);

const subscriptionOptions = [
  { value: '', label: 'Tất cả gói thuê bao' },
  { value: 'NOT_OPTED_IN', label: 'Chưa đăng ký' },
  { value: 'PENDING', label: 'Chờ duyệt gói' },
  { value: 'APPROVED', label: 'Trong gói' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'REMOVED', label: 'Đã rút' },
];

const levelOptions = [
  { value: '', label: 'Tất cả trình độ' },
  { value: 'BEGINNER', label: 'Cơ bản' },
  { value: 'INTERMEDIATE', label: 'Trung cấp' },
  { value: 'ADVANCED', label: 'Nâng cao' },
];

const sortOptions = [
  { value: 'updated', label: 'Cập nhật mới nhất' },
  { value: 'newest', label: 'Tạo mới nhất' },
  { value: 'popular', label: 'Nhiều học viên' },
  { value: 'rating_desc', label: 'Rating cao' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [];
  sortedPages.forEach((pageNumber, index) => {
    const previous = sortedPages[index - 1];
    if (previous && pageNumber - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(pageNumber);
  });

  return items;
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value)?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between rounded-lg border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 shadow-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span className="truncate">{selected}</span>
          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value || 'all'} value={option.value} className="cursor-pointer">
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryFilterDropdown({
  label,
  value,
  categories,
  onChange,
}: {
  label: string;
  value: string;
  categories: ICategory[];
  onChange: (value: string) => void;
}) {
  const findCategoryName = (items: ICategory[], id: string): string | null => {
    for (const item of items) {
      if (item._id === id) return item.name;
      if (item.children) {
        const found = findCategoryName(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedLabel = value ? findCategoryName(categories, value) : null;

  const renderCategoryItems = (items: ICategory[]) =>
    items.map((category) => {
      const hasChildren = Boolean(category.children?.length);
      const isSelected = value === category._id;
      const labelContent = (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3 text-xs">
          <span className="truncate">{category.name}</span>
          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </span>
      );

      if (hasChildren) {
        return (
          <DropdownMenuSub key={category._id}>
            <DropdownMenuSubTrigger
              className="min-w-52 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-800"
              onClick={() => onChange(category._id)}
            >
              {labelContent}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-52 rounded-xl p-1">
              {renderCategoryItems(category.children || [])}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      return (
        <DropdownMenuItem
          key={category._id}
          className="min-w-52 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-800"
          onClick={() => onChange(category._id)}
        >
          {labelContent}
        </DropdownMenuItem>
      );
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between rounded-lg border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 shadow-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span className="truncate">{selectedLabel || label}</span>
          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 min-w-[220px] overflow-y-auto rounded-xl p-1">
        <DropdownMenuItem
          className="min-w-52 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:bg-zinc-100 dark:focus:bg-zinc-800"
          onClick={() => onChange('')}
        >
          <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="truncate">{label}</span>
            {!value && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </span>
        </DropdownMenuItem>
        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
        {categories.length > 0 ? renderCategoryItems(categories) : (
          <DropdownMenuItem disabled className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-400">
            Chưa có danh mục
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </p>
        {sub && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
      </div>
      <div className="shrink-0 self-center text-zinc-300 dark:text-zinc-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    </div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>
);

const getCategoryPath = (
  cat: { _id: string; name: string; parentId: string | null } | null | undefined,
  nodes: ICategory[]
): string => {
  if (!cat) return "Chưa phân loại";
  if (!cat.parentId) return cat.name;

  const findParent = (parentId: string, list: ICategory[]): ICategory | null => {
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
    const getPath = (node: ICategory): string => {
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

const CourseDetailDialog: React.FC<{
  course: IAdminCourseListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ course, open, onOpenChange }) => {
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', 'course-list-filter'],
    enabled: open, // chỉ chạy khi popup mở
  });
  const categories = (categoriesQuery.data || []) as ICategory[];

  if (!course) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Chi tiết quản trị khóa học</DialogTitle>
          <DialogDescription>Tổng quan thông tin vận hành và hệ thống của khóa học.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 md:grid-cols-[260px_1fr] mt-2">
          {/* Cột trái: Thumbnail & Định danh */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 aspect-video shadow-sm">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  <BookOpen className="h-10 w-10" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">{course.title}</h2>
              <div className="text-xs space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <p><span className="font-medium text-zinc-700 dark:text-zinc-300">Giảng viên:</span> {course.instructorName || 'Chưa có tên'}</p>
                <p><span className="font-medium text-zinc-700 dark:text-zinc-300">Danh mục:</span> {getCategoryPath(course.category, categories)}</p>
                <div className="pt-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 block mb-0.5">Đường dẫn slug:</span>
                  <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-[11px] block truncate" title={course.slug}>
                    /{course.slug}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Các thông số chi tiết chia nhóm */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Nhóm 1: Thông số học tập & Doanh số */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Thông số học tập</h3>
              <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/20 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-zinc-500">Giá bán:</span>
                  <span className={`font-bold text-sm ${course.price === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                    {fmtMoney(course.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Trình độ:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{levelLabel[course.level]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Số bài học:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{course.totalLessons} bài học / {course.totalSections} chương</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Thời lượng:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{fmtDuration(course.totalDuration)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-zinc-500">Học viên đăng ký:</span>
                  <span className="font-bold text-zinc-900 dark:text-white inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    {course.enrollmentCount.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Đánh giá trung bình:</span>
                  <span className="font-bold text-zinc-900 dark:text-white inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {course.ratingAverage.toFixed(1)} <span className="text-[10px] text-zinc-400 font-normal">({course.ratingCount})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Trạng thái & Hệ thống */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Quản trị & Hệ thống</h3>
              <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/20 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-zinc-500">Gói thuê bao:</span>
                  <Badge className={subscriptionConfig[course.subscriptionStatus].cls}>
                    {subscriptionConfig[course.subscriptionStatus].label}
                  </Badge>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Mã khóa học (ID):</span>
                  <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded break-all select-all text-zinc-700 dark:text-zinc-300 block font-semibold">
                    {course._id}
                  </code>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-zinc-500">Trạng thái phát hành:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {course.currentVersionId ? 'Đã xuất bản' : 'Chưa xuất bản'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Cập nhật nháp:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {course.draftVersionId ? 'Có bản cập nhật mới' : 'Không có'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-zinc-500">Ngày tạo:</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">{fmtDate(course.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Cập nhật cuối:</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">{fmtDate(course.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


const CourseStudentsDialog: React.FC<{
  course: IAdminCourseListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ course, open, onOpenChange }) => {
  const [studentPage, setStudentPage] = useState(1);
  const STUDENT_PAGE_SIZE = 8;

  const progressQuery = useQuery({
    queryKey: ['admin', 'course-students', course?._id, studentPage],
    queryFn: async () => {
      if (!course?._id) return { progress: [], total: 0 };
      const response = await getLearningProgress({
        courseId: course._id,
        page: studentPage,
        limit: STUDENT_PAGE_SIZE,
      });
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải danh sách học viên.');
      }
      return response.data;
    },
    enabled: !!course?._id && open,
  });

  // Reset page when course changes
  React.useEffect(() => {
    if (open) {
      setStudentPage(1);
    }
  }, [course?._id, open]);

  if (!course) return null;

  const progressList = progressQuery.data?.progress || [];
  const totalStudents = progressQuery.data?.total || 0;
  const totalStudentPages = Math.max(1, Math.ceil(totalStudents / STUDENT_PAGE_SIZE));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Học viên đang tham gia
          </DialogTitle>
          <DialogDescription className="truncate">
            Danh sách học viên và tiến độ học tập của khóa học: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{course.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-150 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Học viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Ngày tham gia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Tiến độ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Bài đã học</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Thời gian xem</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Hoạt động cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {progressList.map((item) => (
                  <tr key={item._id} className="text-xs transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          {item.user.avatarUrl ? (
                            <img src={item.user.avatarUrl} alt={item.user.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-700 text-[10px]">
                              {item.user.fullName.split(' ').pop()?.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">{item.user.fullName}</p>
                          <p className="text-[10px] text-zinc-400 select-all font-mono">{item.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(item.enrolledAt)}</td>
                    <td className="px-4 py-3">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between font-medium text-zinc-700 dark:text-zinc-300">
                          <span>{item.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      {item.completedLessons} / {item.totalLessons} bài học
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {item.totalWatchTime ? `${item.totalWatchTime.toFixed(1)} phút` : '0 phút'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {item.lastActivityAt ? fmtDate(item.lastActivityAt) : 'Chưa bắt đầu'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {progressQuery.isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Loader2 className="mb-2 h-8 w-8 animate-spin" />
              <p className="text-xs">Đang tải danh sách học viên...</p>
            </div>
          )}

          {progressQuery.isError && (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertCircle className="mb-2 h-8 w-8" />
              <p className="text-xs">Không thể tải danh sách học viên.</p>
            </div>
          )}

          {!progressQuery.isLoading && !progressQuery.isError && progressList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Users className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-xs">Khóa học này chưa có học viên nào tham gia.</p>
            </div>
          )}

          {/* Phân trang Dialog */}
          {totalStudentPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50/30 dark:bg-zinc-900/10">
              <span className="text-[11px] text-zinc-500">
                Tổng cộng {totalStudents} học viên · Trang {studentPage}/{totalStudentPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  disabled={studentPage <= 1}
                  onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  disabled={studentPage >= totalStudentPages}
                  onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


export const ResourceManager: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchVal = searchParams.get('search') || '';
  const subscriptionStatus = searchParams.get('status') || '';
  const level = searchParams.get('level') || '';
  const categoryId = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'updated';
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);

  const [selectedCourse, setSelectedCourse] = useState<IAdminCourseListItem | null>(null);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<IAdminCourseListItem | null>(null);

  const debouncedSearch = useDebounce(searchVal.trim(), 300);

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    subscriptionStatus: subscriptionStatus || undefined,
    categoryId: categoryId || undefined,
    level: level || undefined,
    sort,
    page,
    limit: PAGE_SIZE,
  }), [categoryId, level, page, debouncedSearch, sort, subscriptionStatus]);

  const coursesQuery = useAdminCourses(params);
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', 'course-list-filter'],
    queryFn: async () => {
      const response = await getCategories();
      if (response.status === 'ERR' || !response.data) throw new Error(response.message || 'Không tải được danh mục.');
      return response.data;
    },
  });
  const data = coursesQuery.data;
  const courses = data?.courses || [];
  const summary = data?.summary || { total: 0, subscriptionApproved: 0, subscriptionPending: 0, withDraft: 0 };
  const totalPages = Math.max(1, data?.totalPages || 1);

  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);


  const updateFilter = (key: string) => (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(searchVal.trim() || subscriptionStatus || level || categoryId || sort !== 'updated' || page > 1);
  }, [searchVal, subscriptionStatus, level, categoryId, sort, page]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const copyCourse = async (course: IAdminCourseListItem) => {
    const value = `${course._id} | ${course.slug}`;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Đã sao chép ID và slug khóa học.');
    } catch {
      toast.error('Không thể sao chép tự động.');
    }
  };

  const goToReview = (course: IAdminCourseListItem, mode: 'PUBLISH' | 'SUBSCRIPTION' = 'PUBLISH') => {
    navigate('/admin/courses/review', { state: { mode, search: course.title } });
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        <CourseDetailDialog
          course={selectedCourse}
          open={selectedCourse !== null}
          onOpenChange={(open) => { if (!open) setSelectedCourse(null); }}
        />
        <CourseStudentsDialog
          course={selectedCourseForStudents}
          open={selectedCourseForStudents !== null}
          onOpenChange={(open) => { if (!open) setSelectedCourseForStudents(null); }}
        />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Danh sách khóa học</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Theo dõi các khóa học đang hiển thị trên web và trạng thái gói thuê bao.</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={() => coursesQuery.refetch()} disabled={coursesQuery.isFetching} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${coursesQuery.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Làm mới danh sách khóa học</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Khóa học public"
          value={summary.total}
          sub="Tổng khóa học đang phát hành"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <KpiCard
          label="Trong gói thuê bao"
          value={summary.subscriptionApproved}
          sub="Học viên subscription có thể xem"
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <KpiCard
          label="Chờ duyệt gói"
          value={summary.subscriptionPending}
          sub="Yêu cầu tham gia gói thuê bao mới"
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <KpiCard
          label="Có bản cập nhật"
          value={summary.withDraft}
          sub="Đang có phiên bản nháp chỉnh sửa"
          icon={<FilePenLine className="h-5 w-5" />}
        />
      </div>

      <div className={`${cardClass} p-4 space-y-3`}>
        {/* Search */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <Input
              value={searchVal}
              onChange={(event) => {
                const val = event.target.value;
                const nextParams = new URLSearchParams(searchParams);
                if (val) {
                  nextParams.set('search', val);
                } else {
                  nextParams.delete('search');
                }
                nextParams.delete('page');
                setSearchParams(nextParams, { replace: true });
              }}
              placeholder="Tìm tên, slug, giảng viên, ID..."
              className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="h-10 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 rounded-lg border-red-200/50 dark:border-red-900/50 px-3 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <Filter className="h-4 w-4 text-zinc-400 shrink-0 hidden sm:block" />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 flex-1">
            <CategoryFilterDropdown
              label="Tất cả danh mục"
              value={categoryId}
              categories={categoriesQuery.data || []}
              onChange={updateFilter('category')}
            />
            <FilterDropdown
              label="Tất cả gói thuê bao"
              value={subscriptionStatus}
              options={subscriptionOptions}
              onChange={updateFilter('status')}
            />
            <FilterDropdown
              label="Tất cả trình độ"
              value={level}
              options={levelOptions}
              onChange={updateFilter('level')}
            />
            <FilterDropdown
              label="Sắp xếp khóa học"
              value={sort}
              options={sortOptions}
              onChange={updateFilter('sort')}
            />
          </div>
        </div>
      </div>

      <div className={`overflow-hidden ${cardClass}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Filter className="h-4 w-4" />
            {data ? `${data.total.toLocaleString('vi-VN')} kết quả` : 'Đang tải dữ liệu'}
          </div>
          {coursesQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Khóa học', 'Giảng viên', 'Danh mục', 'Thuê bao', 'Giá', 'Học viên', 'Rating', 'Cập nhật', 'Hành động'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {courses.map((course) => (
                <tr key={course._id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-72 items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-400"><BookOpen className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{course.title}</p>
                        <p className="truncate text-xs text-zinc-500">/{course.slug}</p>
                        <p className="mt-1 text-[11px] font-mono text-zinc-400 select-all" title="Mã khóa học">ID: {course._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-300">{course.instructorName || 'Chưa có tên'}</td>
                  <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-300">{course.category?.name || 'Chưa phân loại'}</td>
                  <td className="px-4 py-3.5"><Badge className={subscriptionConfig[course.subscriptionStatus].cls}>{subscriptionConfig[course.subscriptionStatus].label}</Badge></td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{fmtMoney(course.price)}</td>
                  <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-300"><span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-zinc-400" />{course.enrollmentCount.toLocaleString('vi-VN')}</span></td>
                  <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-300"><span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500" />{course.ratingAverage.toFixed(1)} <span className="text-xs text-zinc-400">({course.ratingCount})</span></span></td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500">{fmtDate(course.updatedAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCourse(course)}
                            className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                          >
                            <ListChecks className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Xem thông tin quản trị</p>
                        </TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Hành động khác</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => window.open(`/course/${course.slug}`, '_blank')}
                            className="gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span>Xem trên Website</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => goToReview(course)}
                            className="gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                          >
                            <FilePenLine className="h-4 w-4 text-amber-500" />
                            <span>Đi tới trang kiểm duyệt</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/finance/transactions?q=${encodeURIComponent(course.title)}`)}
                            className="gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                          >
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                            <span>Xem giao dịch mua</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedCourseForStudents(course)}
                            className="gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                          >
                            <Users className="h-4 w-4 text-indigo-500" />
                            <span>Xem danh sách học viên</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyCourse(course)}
                            className="gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                          >
                            <Clipboard className="h-4 w-4 text-zinc-500" />
                            <span>Sao chép ID & Slug</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {coursesQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Loader2 className="mb-3 h-10 w-10 animate-spin" />
            <p className="text-sm">Đang tải danh sách khóa học...</p>
          </div>
        )}
        {coursesQuery.isError && (
          <div className="flex flex-col items-center justify-center py-16 text-red-500">
            <AlertCircle className="mb-3 h-10 w-10" />
            <p className="text-sm">{coursesQuery.error instanceof Error ? coursesQuery.error.message : 'Không thể tải danh sách khóa học.'}</p>
          </div>
        )}
        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <GraduationCap className="mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">Không có khóa học nào phù hợp bộ lọc.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-zinc-500">
            {courses.length} / {summary.total} khóa học · Trang {page}/{totalPages}
          </span>
          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Trước"
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set('page', String(Math.max(1, page - 1)));
                    setSearchParams(nextParams, { replace: true });
                  }}
                />
              </PaginationItem>
              {visiblePages.map((item, idx) => (
                <PaginationItem key={idx}>
                  {typeof item === 'number' ? (
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(event) => {
                        event.preventDefault();
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set('page', String(item));
                        setSearchParams(nextParams, { replace: true });
                      }}
                    >
                      {item}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Sau"
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set('page', String(Math.min(totalPages, page + 1)));
                    setSearchParams(nextParams, { replace: true });
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  </TooltipProvider>
);
};


