// ========================
// Instructor Students Page
// Mục đích:
// - quản lý danh sách học viên đã ghi danh vào các khóa của instructor
// - tách workflow tra cứu học viên khỏi tab Phân tích > Học viên
// ========================
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, GraduationCap, Search, Users, WalletCards, CalendarClock, FilterX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useInstructorStudents } from '@/hooks/useInstructorCourses';
import type { IInstructorStudentEnrollment } from '@/services/courseApi';

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

type SourceFilter = 'ALL' | 'PURCHASE' | 'SUBSCRIPTION';
type StatusFilter = 'ALL' | IInstructorStudentEnrollment['status'];


const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
};

const getLearnerDisplayName = (enrollment: IInstructorStudentEnrollment) =>
  enrollment.learnerName?.trim() || 'Chưa có tên học viên';

const getLearnerInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'H';

const sourceLabel: Record<IInstructorStudentEnrollment['source'], string> = {
  PURCHASE: 'Mua khóa',
  SUBSCRIPTION: 'Thuê bao',
};

const statusLabel: Record<IInstructorStudentEnrollment['status'], string> = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const sourceBadgeClass: Record<IInstructorStudentEnrollment['source'], string> = {
  PURCHASE: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  SUBSCRIPTION: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300',
};

const statusBadgeClass: Record<IInstructorStudentEnrollment['status'], string> = {
  ACTIVE: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
  COMPLETED: 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-300',
  CANCELLED: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300',
};

const StatCard = ({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{value}</p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
      </div>
      <div className="shrink-0 self-center text-zinc-300 dark:text-zinc-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    </div>
  </div>
);

export const InstructorStudents: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || 'ALL';
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState(initialCourseId);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const { data, isLoading, isError, error } = useInstructorStudents();

  const enrollments = data?.enrollments ?? [];
  const courses = data?.courses ?? [];
  const summary = data?.summary ?? { total: 0, purchase: 0, subscription: 0, active: 0 };

  const filteredEnrollments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      const courseId = enrollment.course?._id || '';
      const matchesCourse = courseFilter === 'ALL' || courseId === courseFilter;
      const matchesSource = sourceFilter === 'ALL' || enrollment.source === sourceFilter;
      const matchesStatus = statusFilter === 'ALL' || enrollment.status === statusFilter;
      const searchable = [
        enrollment.learnerName,
        enrollment.learnerEmail,
        enrollment.course?.title,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      return matchesCourse && matchesSource && matchesStatus && matchesQuery;
    });
  }, [courseFilter, enrollments, query, sourceFilter, statusFilter]);

  const handleCourseFilterChange = (value: string) => {
    setCourseFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'ALL') next.delete('courseId');
    else next.set('courseId', value);
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setQuery('');
    setSourceFilter('ALL');
    setStatusFilter('ALL');
    handleCourseFilterChange('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Học viên</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi học viên đã ghi danh vào các khóa học của bạn, nguồn truy cập và ngày bắt đầu học.
          </p>
        </div>
        <Link
          to="/instructor/performance"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-bold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground lg:w-auto"
        >
          <BookOpen className="h-4 w-4" />
          Xem phân tích học tập
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng ghi danh" value={summary.total.toLocaleString('vi-VN')} sub="Tất cả học viên trên các khóa của bạn" icon={<Users />} />
        <StatCard label="Mua khóa" value={summary.purchase.toLocaleString('vi-VN')} sub="Học viên mở khóa bằng mua lẻ" icon={<WalletCards />} />
        <StatCard label="Thuê bao" value={summary.subscription.toLocaleString('vi-VN')} sub="Học viên mở khóa qua gói học" icon={<GraduationCap />} />
        <StatCard label="Đang học" value={summary.active.toLocaleString('vi-VN')} sub="Enrollment đang còn hiệu lực" icon={<CalendarClock />} />
      </div>

      <div className={`${cardClass} p-5`}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_180px_180px_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, email hoặc khóa học"
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <Select value={courseFilter} onChange={(event) => handleCourseFilterChange(event.target.value)} className="h-11 rounded-xl">
            <option value="ALL">Tất cả khóa học</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </Select>
          <Select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SourceFilter)} className="h-11 rounded-xl">
            <option value="ALL">Mọi nguồn</option>
            <option value="PURCHASE">Mua khóa</option>
            <option value="SUBSCRIPTION">Thuê bao</option>
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-11 rounded-xl">
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang học</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </Select>
          <Button type="button" variant="ghost" className="h-11 gap-2" onClick={resetFilters}>
            <FilterX className="h-4 w-4" />
            Xóa lọc
          </Button>
        </div>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Danh sách học viên</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Đang hiển thị {filteredEnrollments.length.toLocaleString('vi-VN')} / {enrollments.length.toLocaleString('vi-VN')} ghi danh.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-zinc-500 dark:text-zinc-400">Đang tải danh sách học viên...</div>
        ) : isError ? (
          <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {(error as Error)?.message || 'Không thể tải danh sách học viên.'}
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-zinc-400" />
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Chưa có học viên phù hợp</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Thử đổi bộ lọc hoặc chờ học viên ghi danh vào khóa học đã xuất bản.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Học viên</th>
                  <th className="px-5 py-3 font-semibold">Khóa học</th>
                  <th className="px-5 py-3 font-semibold">Nguồn</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold">Ngày ghi danh</th>
                  <th className="px-5 py-3 font-semibold">Hạn truy cập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredEnrollments.map((enrollment) => {
                  const learnerName = getLearnerDisplayName(enrollment);
                  return (
                    <tr key={enrollment._id} className="align-top hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {enrollment.learnerAvatarUrl ? (
                              <img src={enrollment.learnerAvatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : getLearnerInitial(learnerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-900 dark:text-white">{learnerName}</p>
                            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {enrollment.learnerEmail || 'Chưa có email học viên'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {enrollment.course ? (
                          <div className="max-w-xs">
                            <p className="line-clamp-2 font-medium text-zinc-900 dark:text-white">{enrollment.course.title}</p>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{enrollment.course.enrollmentCount.toLocaleString('vi-VN')} tổng ghi danh</p>
                          </div>
                        ) : (
                          <span className="text-zinc-500">Khóa học không còn tồn tại</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={sourceBadgeClass[enrollment.source]}>{sourceLabel[enrollment.source]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={statusBadgeClass[enrollment.status]}>{statusLabel[enrollment.status]}</Badge>
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">{formatDate(enrollment.enrolledAt)}</td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                        {enrollment.source === 'PURCHASE' ? 'Không giới hạn' : formatDate(enrollment.accessEndsAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};










