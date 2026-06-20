// ========================
// Instructor Dashboard: Tổng quan
// Snapshot nhanh: KPI, việc cần xử lý và hiệu quả nổi bật.
// ========================
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CircleHelp,
  Clock,
  DollarSign,
  Edit3,
  Loader2,
  Plus,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';
import { useInstructorRatingStats } from '@/hooks/useCourseReviews';
import { getInstructorRevenueStats, getInstructorSubscriptionFinance } from '@/services/paymentApi';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const compactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
};

const shortenText = (value: string, max = 22) => (value.length > max ? `${value.slice(0, max - 1)}...` : value);

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

const revenueChartConfig = {
  totalRevenue: {
    label: 'Tổng doanh thu',
    color: 'var(--chart-1)',
  },
  courseRevenue: {
    label: 'Mua đứt',
    color: 'var(--chart-2)',
  },
  subRevenue: {
    label: 'Thuê bao',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const topRevenueChartConfig = {
  revenue: {
    label: 'Doanh thu',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const studentsChartConfig = {
  students: {
    label: 'Học viên',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const StatusPill: React.FC<{ tone: 'green' | 'amber' | 'orange' | 'red'; children: React.ReactNode }> = ({ tone, children }) => {
  const toneClass = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300',
    red: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  }[tone];

  return (
    <Badge variant="outline" className={`inline-flex items-center px-2 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </Badge>
  );
};

const KpiCard: React.FC<{ label: string; value: string; sub: string; icon: React.ReactNode }> = ({ label, value, sub, icon }) => (
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

const EmptyPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={`${cardClass} p-8 text-center`}>
      <BookOpen className="mx-auto h-10 w-10 text-zinc-400" />
      <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Bắt đầu bằng khóa học đầu tiên</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
        Khi bạn tạo khóa học, trang này sẽ tổng hợp doanh thu, học viên, đánh giá và các việc cần xử lý.
      </p>
      <Button
        onClick={() => navigate('/instructor/courses')}
        className="mt-5 gap-2"
      >
        <Plus className="h-4 w-4" />
        Tạo khóa học
      </Button>
    </div>
  );
};

const EmptyChartPanel: React.FC<{ icon: React.ReactNode; message: string }> = ({ icon, message }) => (
  <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
    <div className="mb-3 text-zinc-400">{icon}</div>
    <p className="text-sm">{message}</p>
  </div>
);

export const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: courses = [], isLoading: coursesLoading } = useGetMyCourses();
  const { data: ratingStats, isLoading: ratingLoading } = useInstructorRatingStats(user?._id || '', Boolean(user?._id));

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['instructor', 'finance', 'revenue', 'overview'],
    queryFn: async () => {
      const response = await getInstructorRevenueStats();
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải dữ liệu doanh thu.');
      }
      return response.data;
    },
  });

  const { data: subscriptionFinance, isLoading: subLoading } = useQuery({
    queryKey: ['instructor', 'finance', 'subscriptions', 'overview'],
    queryFn: async () => {
      const response = await getInstructorSubscriptionFinance();
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải doanh thu thuê bao.');
      }
      return response.data;
    },
  });

  const courseStats = useMemo(() => {
    const publishedCourses = courses.filter((course) => course.status === 'PUBLISHED');
    const newDraftCourses = courses.filter((course) => course.status === 'DRAFT');
    const newPendingCourses = courses.filter((course) => course.status === 'PENDING');
    const newRejectedCourses = courses.filter((course) => course.status === 'REJECTED');

    const revisionDraftCourses = publishedCourses.filter((course) => course.activeRevision?.status === 'DRAFT');
    const revisionPendingCourses = publishedCourses.filter((course) => course.activeRevision?.status === 'PENDING');
    const revisionRejectedCourses = publishedCourses.filter((course) => course.activeRevision?.status === 'REJECTED');

    return {
      total: courses.length,
      published: publishedCourses.length,
      totalStudents: courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0),
      newCourse: {
        draft: newDraftCourses.length,
        pending: newPendingCourses.length,
        rejected: newRejectedCourses.length,
        byStatus: {
          DRAFT: newDraftCourses,
          PENDING: newPendingCourses,
          REJECTED: newRejectedCourses,
        },
      },
      revision: {
        draft: revisionDraftCourses.length,
        pending: revisionPendingCourses.length,
        rejected: revisionRejectedCourses.length,
        total: revisionDraftCourses.length + revisionPendingCourses.length + revisionRejectedCourses.length,
        byStatus: {
          DRAFT: revisionDraftCourses,
          PENDING: revisionPendingCourses,
          REJECTED: revisionRejectedCourses,
        },
      },
    };
  }, [courses]);

  const subRevenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    (subscriptionFinance?.settlements || []).forEach((item) => {
      const current = map.get(item.period) || 0;
      map.set(item.period, current + (item.amount || 0));
    });
    return map;
  }, [subscriptionFinance]);

  const monthlyChartData = useMemo(() => {
    return (revenue?.monthlyData ?? []).slice(-6).map((month) => {
      const courseRev = month.instructorRevenue || 0;
      const subRev = subRevenueByMonth.get(month.month) || 0;
      return {
        name: month.month,
        courseRevenue: courseRev,
        subRevenue: subRev,
        totalRevenue: courseRev + subRev,
      };
    });
  }, [revenue, subRevenueByMonth]);

  const latestMonthRevenue = monthlyChartData.length ? monthlyChartData[monthlyChartData.length - 1].totalRevenue : 0;
  const topRevenueCourses = (revenue?.courseBreakdown ?? []).slice(0, 3);
  const topStudentCourses = useMemo(
    () => [...courses].filter((course) => course.status === 'PUBLISHED').sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0)).slice(0, 3),
    [courses],
  );
  const topRevenueChartData = topRevenueCourses.map((course) => ({
    course: course.courseTitle,
    shortTitle: shortenText(course.courseTitle),
    revenue: course.instructorRevenue,
    transactions: course.transactions,
  }));
  const topStudentsChartData = topStudentCourses.map((course) => ({
    course: course.title,
    shortTitle: shortenText(course.title),
    students: course.enrollmentCount || 0,
    lessons: course.totalLessons,
  }));

  const actionCourses = useMemo(() => {
    const revisionRejectedItems = courseStats.revision.byStatus.REJECTED.slice(0, 3).map((course) => ({
      course,
      to: '/instructor/courses',
      icon: <XCircle className="h-4 w-4" />,
      label: 'Bản cập nhật bị từ chối',
      detail: course.activeRevision?.rejectionReason || 'Mở trang Khóa học để chỉnh sửa bản cập nhật.',
      tone: 'red' as const,
    }));
    const rejectedItems = courseStats.newCourse.byStatus.REJECTED.slice(0, 3).map((course) => ({
      course,
      to: `/instructor/courses/${course._id}/edit`,
      icon: <XCircle className="h-4 w-4" />,
      label: 'Khóa mới bị từ chối',
      detail: course.rejectionReason || 'Xem ghi chú duyệt trong editor.',
      tone: 'red' as const,
    }));
    const revisionDraftItems = courseStats.revision.byStatus.DRAFT.slice(0, 2).map((course) => ({
      course,
      to: '/instructor/courses',
      icon: <Edit3 className="h-4 w-4" />,
      label: 'Bản cập nhật nháp',
      detail: 'Khóa học đang hoạt động; bản cập nhật chưa gửi duyệt.',
      tone: 'amber' as const,
    }));
    const draftItems = courseStats.newCourse.byStatus.DRAFT.slice(0, 2).map((course) => ({
      course,
      to: `/instructor/courses/${course._id}/edit`,
      icon: <Edit3 className="h-4 w-4" />,
      label: 'Khóa mới nháp',
      detail: 'Bổ sung nội dung rồi gửi duyệt.',
      tone: 'amber' as const,
    }));

    return [...revisionRejectedItems, ...rejectedItems, ...revisionDraftItems, ...draftItems].slice(0, 5);
  }, [courseStats.newCourse.byStatus, courseStats.revision.byStatus]);

  const isLoading = coursesLoading || revenueLoading || ratingLoading || subLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Tổng quan</h1>
          <p className="mt-1 text-muted-foreground">Xin chào {user?.fullName || 'Giảng viên'}, hãy tạo khóa học đầu tiên của bạn.</p>
        </div>
        <EmptyPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Tổng quan</h1>
          <p className="mt-1 text-muted-foreground">Tổng quan nhanh về khóa học, doanh thu và những việc cần xử lý.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/instructor/courses')} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo khóa học
          </Button>
          <Button variant="outline" onClick={() => navigate('/instructor/performance')} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Xem phân tích
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Doanh thu thực nhận" value={formatCurrency(revenue?.totalInstructorRevenue ?? 0)} sub={`Tháng gần nhất: ${formatCurrency(latestMonthRevenue)}`} icon={<DollarSign className="h-5 w-5" />} />
        <KpiCard label="Tổng học viên" value={courseStats.totalStudents.toLocaleString('vi-VN')} sub="Tổng số lượt học viên ghi danh trên tất cả khóa học của bạn" icon={<Users className="h-5 w-5" />} />
        <KpiCard label="Đánh giá" value={ratingStats?.reviewCount ? ratingStats.averageRating.toFixed(1) : '—'} sub="Điểm số trung bình từ các khóa học đang hoạt động" icon={<Star className="h-5 w-5" />} />
        <KpiCard label="Trạng thái khóa học" value={`${courseStats.published}/${courseStats.total}`} sub="Khóa học đã xuất bản / Tổng số khóa học của bạn" icon={<BookOpen className="h-5 w-5" />} />
      </div>

      <section className={`${cardClass} p-5`}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Trạng thái kiểm duyệt</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Tách khóa mới khỏi bản cập nhật của khóa đã xuất bản để bạn kiểm soát rõ hơn.</p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Khóa học mới</h3>
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-950 dark:hover:text-white"
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64 rounded-xl">
                    Khóa học bạn đang biên soạn mới hoàn toàn và chưa từng được xuất bản trên hệ thống.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatusCountCard label="Bản nháp" value={courseStats.newCourse.draft} tone="amber" icon={<Edit3 className="h-4 w-4" />} />
              <StatusCountCard label="Chờ duyệt" value={courseStats.newCourse.pending} tone="orange" icon={<Clock className="h-4 w-4" />} />
              <StatusCountCard label="Bị từ chối" value={courseStats.newCourse.rejected} tone="red" icon={<XCircle className="h-4 w-4" />} />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Bản cập nhật khóa đã xuất bản</h3>
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-950 dark:hover:text-white"
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64 rounded-xl">
                    Các chỉnh sửa đối với khóa học đã được xuất bản. Bản cập nhật này được duyệt riêng mà không ảnh hưởng đến phiên bản hiện tại học viên đang học.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatusCountCard label="Nháp cập nhật" value={courseStats.revision.draft} tone="amber" icon={<Edit3 className="h-4 w-4" />} />
              <StatusCountCard label="Chờ duyệt" value={courseStats.revision.pending} tone="orange" icon={<Clock className="h-4 w-4" />} />
              <StatusCountCard label="Bị từ chối" value={courseStats.revision.rejected} tone="red" icon={<XCircle className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <section className={`${cardClass} p-5`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Doanh thu 6 tháng gần nhất</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">So sánh doanh thu từ bán khóa học lẻ (mua đứt) và gói thuê bao.</p>
            </div>
            <Link to="/instructor/performance" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80">
              Chi tiết <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {monthlyChartData.length > 0 ? (
            <ChartContainer config={revenueChartConfig} className="h-64 w-full">
              <ComposedChart data={monthlyChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-totalRevenue)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-totalRevenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={8} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={compactCurrency}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="var(--color-totalRevenue)"
                  strokeWidth={3}
                  fill="url(#totalRevenueGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="courseRevenue"
                  stroke="var(--color-courseRevenue)"
                  strokeWidth={1.75}
                  strokeOpacity={0.95}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="subRevenue"
                  stroke="var(--color-subRevenue)"
                  strokeWidth={1.75}
                  strokeOpacity={0.95}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ChartContainer>
          ) : (
            <EmptyChartPanel icon={<TrendingUp className="h-8 w-8" />} message="Chưa có dữ liệu doanh thu." />
          )}
        </section>

        <section className={`${cardClass} p-5`}>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Cần xử lý</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Ưu tiên bản cập nhật bị từ chối, khóa mới bị từ chối và các bản nháp cần hoàn thiện.</p>
          <div className="mt-4 space-y-3">
            {actionCourses.length > 0 ? actionCourses.map((item) => (
              <Link key={`${item.course._id}-${item.label}`} to={item.to} className="block rounded-lg border border-zinc-100 p-3 transition-colors hover:border-primary/30 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-primary">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{item.course.title}</p>
                      <StatusPill tone={item.tone}>{item.label}</StatusPill>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{item.detail}</p>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="rounded-lg border border-dashed border-zinc-200 p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Không có khóa học cần xử lý ngay.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${cardClass} p-5`}>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Top doanh thu</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">3 khóa có doanh thu thực nhận cao nhất.</p>
          <div className="mt-4">
            {topRevenueChartData.length > 0 ? (
              <ChartContainer config={topRevenueChartConfig} className="h-[220px] w-full">
                <BarChart data={topRevenueChartData} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 6 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="shortTitle" type="category" axisLine={false} tickLine={false} tickMargin={8} width={120} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel={false}
                        labelFormatter={(label) => String(topRevenueChartData.find((item) => item.shortTitle === label)?.course || label || '')}
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="var(--color-revenue)" barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartPanel icon={<DollarSign className="h-8 w-8" />} message="Chưa có giao dịch nào." />
            )}
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Top học viên</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">3 khóa học đã xuất bản có nhiều học viên nhất.</p>
          <div className="mt-4">
            {topStudentsChartData.length > 0 ? (
              <ChartContainer config={studentsChartConfig} className="h-[220px] w-full">
                <BarChart data={topStudentsChartData} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 6 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="shortTitle" type="category" axisLine={false} tickLine={false} tickMargin={8} width={120} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel={false}
                        labelFormatter={(label) => String(topStudentsChartData.find((item) => item.shortTitle === label)?.course || label || '')}
                        formatter={(value) => Number(value ?? 0).toLocaleString('vi-VN')}
                      />
                    }
                  />
                  <Bar dataKey="students" radius={[0, 6, 6, 0]} fill="var(--color-students)" barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartPanel icon={<Users className="h-8 w-8" />} message="Chưa có khóa học nào được xuất bản." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatusCountCard: React.FC<{ label: string; value: number; tone: 'amber' | 'orange' | 'red'; icon: React.ReactNode }> = ({ label, value, tone, icon }) => (
  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
    <StatusPill tone={tone}>
      <span className="mr-1">{icon}</span>
      {label}
    </StatusPill>
    <p className="mt-3 text-2xl font-extrabold text-zinc-900 dark:text-white">{value}</p>
  </div>
);








