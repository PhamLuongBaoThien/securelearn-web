// ========================
// Instructor Performance Page
// Mục đích:
// - hiển thị báo cáo doanh thu, học viên và đánh giá cho instructor
// - tách doanh thu mua đứt và doanh thu thuê bao để theo dõi estimated/pending/available rõ ràng
// ========================
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Users, Star,
  BookOpen, Clock, Award, Percent, MessageSquare, GraduationCap, CircleHelp, Calendar, TrendingUp,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  type InstructorRevenueBreakdown,
  type InstructorSubscriptionFinance,
} from '@/services/paymentApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type InstructorRevenueParams, useInstructorRevenueStats, useInstructorSubscriptionFinance } from '@/hooks/useInstructorFinance';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';
import { useAppSelector } from '@/app/hooks';
import { useInstructorCourseAnalytics } from '@/hooks/useLearningProgress';
import { useInstructorRatingStats } from '@/hooks/useCourseReviews';
import { useCourseDetail } from '@/hooks/useCourseDetail';
import type { IInstructorRatingStats } from '@/services/courseApi';

type PerfTab = 'revenue' | 'students' | 'reviews';
type RevenueRange = '7d' | '30d' | '90d' | 'year' | 'custom';

const PERF_TABS: { id: PerfTab; label: string; icon: React.ReactNode }[] = [
  { id: 'revenue',  label: 'Doanh thu',  icon: <DollarSign className="w-4 h-4" /> },
  { id: 'students', label: 'Học viên',   icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'reviews',  label: 'Đánh giá',   icon: <Star className="w-4 h-4" /> },
];

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode }> = ({
  label, value, sub, icon,
}) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{value}</p>
        {sub && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
      </div>
      <div className="shrink-0 self-center text-zinc-300 dark:text-zinc-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    </div>
  </div>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const compactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
};

const shortenText = (value: string, max = 24) => (value.length > max ? `${value.slice(0, max - 1)}...` : value);
const stripSectionPrefix = (value: string) => value.trim().replace(/^chương\s*\d+\s*[:.\-]?\s*/i, '').trim();
const stripLessonPrefix = (value: string) => value.trim().replace(/^bài\s*\d+\s*[:.\-]?\s*/i, '').trim();
const lessonFullLabel = (lesson: { positionLabel: string; title: string }) => (
  lesson.title ? `${lesson.positionLabel}: ${lesson.title}` : lesson.positionLabel
);

const EmptyChartState: React.FC<{ icon?: React.ReactNode; message: string }> = ({ icon, message }) => (
  <div className="flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
    <div className="mb-3 text-zinc-400">{icon || <TrendingUp className="h-8 w-8" />}</div>
    <p className="text-sm">{message}</p>
  </div>
);

const monthlyRevenueChartConfig = {
  totalRevenue: {
    label: 'Tổng doanh thu',
    color: 'var(--chart-1)',
  },
  courseRevenue: {
    label: 'Mua đứt',
    color: 'var(--chart-2)',
  },
  subscriptionRevenue: {
    label: 'Thuê bao',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const topRevenueChartConfig = {
  instructorRevenue: {
    label: 'Thực nhận',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const providerRevenueChartConfig = {
  instructorRevenue: {
    label: 'Thực nhận',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const lessonCompletionChartConfig = {
  completionRate: {
    label: 'Hoàn thành',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const lessonDropOffChartConfig = {
  dropOffRate: {
    label: 'Drop-off',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const lessonContentMetricChartConfig = {
  contentMetric: {
    label: 'Chỉ số nội dung',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const ratingCourseChartConfig = {
  ratingValue: {
    label: 'Điểm đánh giá',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const reviewCoverageChartConfig = {
  reviews: {
    label: 'Đánh giá',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);
const parseDateInput = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};
const formatDateLabel = (value?: string) => {
  const date = parseDateInput(value);
  return date ? date.toLocaleDateString('vi-VN') : 'Chọn ngày';
};

const getRevenueRangeParams = (range: RevenueRange, customDates: InstructorRevenueParams): InstructorRevenueParams => {
  if (range === 'custom') return customDates;

  const today = new Date();
  const endDate = toDateInput(today);
  const start = new Date(today);

  if (range === '7d') start.setDate(today.getDate() - 6);
  if (range === '30d') start.setDate(today.getDate() - 29);
  if (range === '90d') start.setDate(today.getDate() - 89);
  if (range === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return { startDate: toDateInput(start), endDate };
};

const revenueRangeOptions: Array<{ value: RevenueRange; label: string }> = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: 'year', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const RevenueTitleWithTooltip: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="mb-3 flex items-center gap-2">
    <h2 className="text-sm font-bold uppercase text-zinc-500">{title}</h2>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label={`Giải thích ${title.toLowerCase()}`}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs rounded-xl text-left leading-5">
        {content}
      </TooltipContent>
    </Tooltip>
  </div>
);

/* ─── Tab: Doanh thu ─── */
const RevenueTab = ({ range, revenue, subscription }: {
  range: RevenueRange;
  revenue: InstructorRevenueBreakdown | undefined;
  subscription: InstructorSubscriptionFinance | undefined;
}) => {
  const providerBreakdown = revenue?.providerBreakdown ?? [];
  const topCourses = revenue?.courseBreakdown ?? [];

  const subscriptionRevenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    (subscription?.settlements ?? []).forEach((settlement) => {
      map.set(settlement.period, (map.get(settlement.period) || 0) + (settlement.amount || 0));
    });
    return map;
  }, [subscription]);

  const monthlyRevenueChartData = useMemo(() => {
    const useDailyData = range !== 'year';
    const source = useDailyData && revenue?.dailyData?.length ? revenue.dailyData : (revenue?.monthlyData ?? []);

    return source.map((entry) => {
      const bucketKey = 'date' in entry ? entry.date : entry.month;
      const courseRevenue = entry.instructorRevenue || 0;
      const subscriptionRevenue = subscriptionRevenueByMonth.get(bucketKey) || 0;

      return {
        label: bucketKey,
        courseRevenue,
        subscriptionRevenue,
        totalRevenue: courseRevenue + subscriptionRevenue,
      };
    });
  }, [range, revenue, subscriptionRevenueByMonth]);

  const topRevenueCourseChartData = topCourses.slice(0, 5).map((course) => ({
    ...course,
    fullLabel: course.courseTitle,
    shortLabel: shortenText(course.courseTitle, 28),
  }));

  const providerRevenueChartData = providerBreakdown.map((provider) => ({
    ...provider,
    fullLabel: provider.provider,
    shortLabel: provider.provider,
  }));

  return (
    <TooltipProvider delayDuration={250}>
      <div className="space-y-6">
        <div>
          <RevenueTitleWithTooltip
            title="Doanh thu thuê bao"
            content="Doanh thu từ gói học được chia theo mức độ học thực tế của học viên trong các khóa học của bạn. Khi học viên học nhiều hơn và thời gian học hợp lệ nhiều hơn, phần doanh thu bạn được ghi nhận cũng tăng theo."
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Tạm tính" value={formatCurrency(subscription?.estimated ?? 0)} sub="hệ thống đang tiếp tục cộng dồn" icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Chờ ghi nhận" value={formatCurrency(subscription?.pending ?? 0)} sub="đã chốt kỳ, đang chờ chuyển sang khả dụng" icon={<Award className="h-4 w-4" />} />
            <StatCard label="Có thể nhận" value={formatCurrency(subscription?.available ?? 0)} sub="số tiền hiện hệ thống đang ghi nhận cho bạn" icon={<DollarSign className="h-4 w-4" />} />
            <StatCard label="Phút học hợp lệ" value={Math.floor((subscription?.qualifiedSeconds ?? 0) / 60).toLocaleString('vi-VN')} sub="căn cứ để chia doanh thu từ gói học" icon={<Percent className="h-4 w-4" />} />
          </div>
        </div>

        <RevenueTitleWithTooltip
          title="Doanh thu mua đứt"
          content="Đây là doanh thu từ các khóa học được học viên mua riêng từng khóa. Số tiền bạn nhận được sẽ bám theo tỷ lệ chia doanh thu tại đúng thời điểm học viên thanh toán."
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Tổng doanh thu" value={formatCurrency(revenue?.totalGrossRevenue ?? 0)} sub="trước chia" icon={<DollarSign className="w-4 h-4" />} />
          <StatCard label="Doanh thu thực nhận" value={formatCurrency(revenue?.totalInstructorRevenue ?? 0)} sub="số tiền bạn nhận được" icon={<Award className="w-4 h-4" />} />
          <StatCard label="Giao dịch thành công" value={`${(revenue?.totalTransactions ?? 0).toLocaleString('vi-VN')}`} sub="số lượt thanh toán hoàn tất trong kỳ đã chọn" icon={<Users className="w-4 h-4" />} />
          <StatCard label="Tỷ lệ chia" value={`${revenue?.instructorPercent ?? 0}%`} sub={`QTV nhận ${revenue?.adminPercent ?? 0}%`} icon={<Percent className="w-4 h-4" />} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
          <div className={`${cardClass} p-5`}>
            <h3 className="mb-1 font-bold text-zinc-900 dark:text-white">Doanh thu theo tháng</h3>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Tổng doanh thu là xu hướng chính; mua đứt và thuê bao là hai nguồn thành phần.</p>
            {monthlyRevenueChartData.length > 0 ? (
              <ChartContainer config={monthlyRevenueChartConfig} className="h-80 w-full">
                <ComposedChart data={monthlyRevenueChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="performanceTotalRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-totalRevenue)" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="var(--color-totalRevenue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} />
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} tickFormatter={compactCurrency} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" formatter={(value) => formatCurrency(Number(value ?? 0))} />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="totalRevenue" stroke="var(--color-totalRevenue)" strokeWidth={3} fill="url(#performanceTotalRevenue)" />
                  <Line type="monotone" dataKey="courseRevenue" stroke="var(--color-courseRevenue)" strokeWidth={1.75} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="subscriptionRevenue" stroke="var(--color-subscriptionRevenue)" strokeWidth={1.75} dot={false} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="Chưa có dữ liệu doanh thu." />
            )}
          </div>

          <div className={`${cardClass} p-5`}>
            <h3 className="mb-1 font-bold text-zinc-900 dark:text-white">Top khóa theo doanh thu</h3>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">5 khóa có doanh thu thực nhận cao nhất trong kỳ lọc.</p>
            {topRevenueCourseChartData.length > 0 ? (
              <ChartContainer config={topRevenueChartConfig} className="h-[240px] w-full">
                <BarChart data={topRevenueCourseChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="shortLabel" type="category" axisLine={false} tickLine={false} width={116} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="fullLabel" formatter={(value) => formatCurrency(Number(value ?? 0))} />} />
                  <Bar dataKey="instructorRevenue" fill="var(--color-instructorRevenue)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartState icon={<BookOpen className="h-8 w-8" />} message="Chưa có dữ liệu doanh thu theo khóa học." />
            )}
          </div>
        </div>

        {providerRevenueChartData.length > 0 && (
          <div className={`${cardClass} p-5`}>
            <h3 className="mb-1 font-bold text-zinc-900 dark:text-white">Doanh thu theo cổng thanh toán</h3>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">So sánh doanh thu thực nhận và số giao dịch theo từng provider.</p>
            <ChartContainer config={providerRevenueChartConfig} className="h-[240px] w-full">
              <BarChart data={providerRevenueChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="shortLabel" type="category" axisLine={false} tickLine={false} width={100} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="fullLabel" formatter={(value) => formatCurrency(Number(value ?? 0))} />} />
                <Bar dataKey="instructorRevenue" fill="var(--color-instructorRevenue)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        <div className={`${cardClass} p-5`}>
          <h3 className="mb-4 font-bold text-zinc-900 dark:text-white">Chi tiết doanh thu theo khóa học</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-400 dark:border-zinc-800">
                  <th className="pb-3 font-medium">Khóa học</th>
                  <th className="pb-3 font-medium text-right">Giao dịch</th>
                  <th className="pb-3 font-medium text-right">Tổng thu</th>
                  <th className="pb-3 font-medium text-right">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(revenue?.courseBreakdown ?? []).map((r) => (
                  <tr key={r.courseId}>
                    <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200">{r.courseTitle}</td>
                    <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{r.transactions}</td>
                    <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(r.grossRevenue)}</td>
                    <td className="py-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(r.instructorRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(revenue?.courseBreakdown ?? []).length === 0 && <p className="mt-4 text-sm text-zinc-500">Chưa có dữ liệu doanh thu.</p>}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

/* ─── Tab: Học viên / Progress Analytics ─── */
const StudentsTab = ({
  courses,
  selectedCourseId,
  onSelectCourse,
}: {
  courses: Array<{ _id: string; title: string; slug: string; sections?: Array<{ title: string; order: number; lessons: Array<{ _id?: string; title: string; type: "VIDEO" | "QUIZ"; order: number }> }> }>;
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
}) => {
  const analyticsQuery = useInstructorCourseAnalytics(selectedCourseId);
  const selectedCourse = courses.find((course) => course._id === selectedCourseId);
  const hasInlineCurriculum = Boolean(selectedCourse?.sections?.some((section) => (section.lessons || []).length > 0));
  const courseDetailQuery = useCourseDetail(!hasInlineCurriculum ? selectedCourse?.slug : undefined);
  const courseForMeta = hasInlineCurriculum ? selectedCourse : (courseDetailQuery.data ?? selectedCourse);
  const lessonMeta = new Map<string, { title: string; type: "VIDEO" | "QUIZ"; positionLabel: string; axisLabel: string }>(
    (courseForMeta?.sections || []).flatMap((section, sectionIndex) =>
      (section.lessons || []).map((lesson, lessonIndex) => {
        const sectionOrder = section.order || sectionIndex + 1;
        const lessonOrder = lesson.order || lessonIndex + 1;
        const sectionTitle = stripSectionPrefix(section.title || '');
        const lessonTitle = stripLessonPrefix(lesson.title || '');
        const sectionPrefix = sectionTitle ? `Chương ${sectionOrder}: ${sectionTitle}` : `Chương ${sectionOrder}`;

        return [lesson._id || '', {
          title: lessonTitle,
          type: lesson.type,
          positionLabel: `${sectionPrefix} · Bài ${lessonOrder}`,
          axisLabel: `C${sectionOrder} · B${lessonOrder}`,
        }] as const;
      }),
    ),
  );

  const analytics = analyticsQuery.data;
  const lessons = (analytics?.lessons || []).map((lesson, index) => {
    const meta = lessonMeta.get(lesson.lessonId);
    return {
      ...lesson,
      title: meta?.title || `Bài học ${index + 1}`,
      positionLabel: meta?.positionLabel || `Bài học ${index + 1}`,
      axisLabel: meta?.axisLabel || `B${index + 1}`,
      lessonType: meta?.type || lesson.lessonType,
      dropOffRate: Math.max(0, 100 - lesson.completionRate),
    };
  });
  const dropOffLessons = [...lessons]
    .filter((lesson) => lesson.startedCount > 0 && lesson.dropOffRate > 0)
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .slice(0, 3);
  const topDropOffLesson = dropOffLessons[0];
  const lessonCompletionChartData = lessons.map((lesson) => ({
    ...lesson,
    fullLabel: lessonFullLabel(lesson),
    shortLabel: lesson.axisLabel,
  }));
  const lessonDropOffChartData = dropOffLessons.map((lesson) => ({
    ...lesson,
    fullLabel: lessonFullLabel(lesson),
    shortLabel: lesson.axisLabel,
  }));
  const lessonContentMetricChartData = lessons
    .filter((lesson) => lesson.startedCount > 0)
    .map((lesson) => {
      const isVideo = lesson.lessonType === 'VIDEO';
      const contentMetric = isVideo ? (lesson.averageWatchPercent || 0) : (lesson.quizPassRate || 0);
      return {
        ...lesson,
        contentMetric,
        contentMetricLabel: isVideo ? 'Tỷ lệ xem trung bình' : 'Tỷ lệ đạt quiz',
        fullLabel: lessonFullLabel(lesson),
        shortLabel: lesson.axisLabel,
      };
    });

  if (courses.length === 0) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <GraduationCap className="mx-auto h-10 w-10 text-zinc-400" />
        <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Chưa có khóa học để phân tích</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Hãy xuất bản ít nhất một khóa học để xem dữ liệu tiến độ học tập của học viên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Phân tích học tập theo khóa học</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Theo dõi tỷ lệ hoàn thành, tiến độ xem video và kết quả quiz từ Progress Service.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
            <Select value={selectedCourseId} onChange={(event) => onSelectCourse(event.target.value)} className="h-11 rounded-xl border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </Select>
            <Link
              to={`/instructor/students?courseId=${selectedCourseId}`}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <Users className="h-4 w-4" />
              Danh sách
            </Link>
          </div>
        </div>
      </div>

      {analyticsQuery.isLoading ? (
        <div className={`${cardClass} p-8 text-sm text-zinc-500 dark:text-zinc-400`}>
          Đang tải dữ liệu tiến độ học tập...
        </div>
      ) : analyticsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm text-red-600 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {(analyticsQuery.error as Error)?.message || 'Không thể tải dữ liệu phân tích khóa học.'}
        </div>
      ) : !analytics || analytics.totalLearners === 0 ? (
        <div className={`${cardClass} p-8 text-center`}>
          <Users className="mx-auto h-10 w-10 text-zinc-400" />
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Chưa có dữ liệu học tập</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Khóa học này chưa có học viên hoặc chưa phát sinh tiến độ đủ để hiển thị phân tích.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Tổng học viên" value={analytics.totalLearners.toLocaleString('vi-VN')} sub="số học viên đã phát sinh dữ liệu học tập trong khóa này" icon={<Users className="w-4 h-4" />} />
            <StatCard label="Đã hoàn thành" value={analytics.completedLearners.toLocaleString('vi-VN')} sub="học viên đã hoàn thành toàn bộ nội dung khóa học" icon={<Award className="w-4 h-4" />} />
            <StatCard label="Tỷ lệ hoàn thành" value={`${analytics.completionRate.toFixed(0)}%`} sub="tỷ lệ học viên hoàn thành trọn khóa trong tổng số đã bắt đầu" icon={<Percent className="w-4 h-4" />} />
            <StatCard
              label="Drop-off cao nhất"
              value={topDropOffLesson ? `${topDropOffLesson.dropOffRate.toFixed(0)}%` : '—'}
              sub={topDropOffLesson ? topDropOffLesson.positionLabel : 'chưa có bài học có tỷ lệ rời bỏ đáng chú ý'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
            <div className={`${cardClass} p-5`}>
              <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">Tỷ lệ hoàn thành theo bài học</h3>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">So sánh tỷ lệ hoàn thành từng bài trong khóa đang chọn.</p>
              {lessonCompletionChartData.length > 0 ? (
                <ChartContainer config={lessonCompletionChartConfig} className="h-80 w-full">
                  <BarChart data={lessonCompletionChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} />
                    <YAxis dataKey="shortLabel" type="category" axisLine={false} tickLine={false} width={132} tickMargin={8} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelKey="fullLabel"
                          formatter={(value, _name, item) => {
                            const payload = item.payload || {};
                            return `${Number(value ?? 0).toFixed(0)}% (${Number(payload.completedCount || 0).toLocaleString('vi-VN')} hoàn thành / ${Number(payload.startedCount || 0).toLocaleString('vi-VN')} bắt đầu)`;
                          }}
                        />
                      }
                    />
                    <Bar dataKey="completionRate" fill="var(--color-completionRate)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChartState icon={<GraduationCap className="h-8 w-8" />} message="Chưa có bài học đủ dữ liệu để vẽ tỷ lệ hoàn thành." />
              )}
            </div>

            <div className={`${cardClass} p-5`}>
              <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">Điểm rơi rụng cao</h3>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Chỉ hiện những bài có học viên bắt đầu nhưng chưa hoàn thành.</p>
              {lessonDropOffChartData.length > 0 ? (
                <ChartContainer config={lessonDropOffChartConfig} className="h-[240px] w-full">
                  <BarChart data={lessonDropOffChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} />
                    <YAxis dataKey="shortLabel" type="category" axisLine={false} tickLine={false} width={120} tickMargin={8} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelKey="fullLabel"
                          formatter={(value, _name, item) => {
                            const payload = item.payload || {};
                            return `${Number(value ?? 0).toFixed(0)}% (${Number(payload.startedCount || 0).toLocaleString('vi-VN')} bắt đầu - ${Number(payload.completedCount || 0).toLocaleString('vi-VN')} hoàn thành)`;
                          }}
                        />
                      }
                    />
                    <Bar dataKey="dropOffRate" fill="var(--color-dropOffRate)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChartState icon={<Clock className="h-8 w-8" />} message="Chưa có bài học có tỷ lệ rời bỏ đáng chú ý." />
              )}
            </div>
          </div>

          <div className={`${cardClass} p-5`}>
            <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">Chỉ số nội dung</h3>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Video dùng phần trăm xem trung bình; quiz dùng tỷ lệ đạt.</p>
            {lessonContentMetricChartData.length > 0 ? (
              <ChartContainer config={lessonContentMetricChartConfig} className="h-[280px] w-full">
                <BarChart data={lessonContentMetricChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} />
                  <YAxis dataKey="shortLabel" type="category" axisLine={false} tickLine={false} width={132} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelKey="fullLabel"
                        formatter={(value, _name, item) => `${item.payload?.contentMetricLabel || 'Chỉ số'}: ${Number(value ?? 0).toFixed(0)}%`}
                      />
                    }
                  />
                  <Bar dataKey="contentMetric" fill="var(--color-contentMetric)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartState icon={<Percent className="h-8 w-8" />} message="Chưa có dữ liệu video hoặc quiz để vẽ chỉ số nội dung." />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className={`${cardClass} p-5`}>
              <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Phân tích theo bài học</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-zinc-400 dark:border-zinc-800">
                      <th className="pb-3 font-medium">Bài học</th>
                      <th className="pb-3 font-medium text-right">Bắt đầu</th>
                      <th className="pb-3 font-medium text-right">Hoàn thành</th>
                      <th className="pb-3 font-medium text-right">Tỷ lệ</th>
                      <th className="pb-3 font-medium text-right">Chỉ số chính</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {lessons.map((lesson) => (
                      <tr key={lesson.lessonId}>
                        <td className="py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{lesson.positionLabel}</p>
                          <p className="mt-1 font-medium text-zinc-900 dark:text-white">{lesson.title}</p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{lesson.lessonType === 'VIDEO' ? 'Video' : 'Quiz'}</p>
                        </td>
                        <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{lesson.startedCount.toLocaleString('vi-VN')}</td>
                        <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{lesson.completedCount.toLocaleString('vi-VN')}</td>
                        <td className="py-3 text-right font-semibold text-zinc-900 dark:text-white">{lesson.completionRate.toFixed(0)}%</td>
                        <td className="py-3 text-right text-xs text-zinc-500 dark:text-zinc-400">
                          {lesson.lessonType === 'VIDEO'
                            ? `${(lesson.averageWatchPercent || 0).toFixed(0)}% xem TB`
                            : `${(lesson.quizPassRate || 0).toFixed(0)}% đạt · ${(lesson.averageQuizScore || 0).toFixed(0)} điểm TB`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${cardClass} p-5`}>
                <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Điểm rơi rụng cao</h3>
                <div className="space-y-3">
                  {dropOffLessons.length > 0 ? dropOffLessons.map((lesson) => (
                    <div key={lesson.lessonId} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{lesson.positionLabel}</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{lesson.title}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{lesson.startedCount} bắt đầu · {lesson.completedCount} hoàn thành</p>
                      <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">Drop-off {lesson.dropOffRate.toFixed(0)}%</p>
                    </div>
                  )) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có đủ dữ liệu để xác định bài học có nhiều học viên bỏ dở.</p>
                  )}
                </div>
              </div>

              <div className={`${cardClass} p-5`}>
                <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Tóm tắt nhanh</h3>
                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <p>Khóa học hiện có <span className="font-semibold text-zinc-900 dark:text-white">{analytics.totalLearners.toLocaleString('vi-VN')}</span> học viên đã phát sinh dữ liệu tiến độ.</p>
                  <p><span className="font-semibold text-zinc-900 dark:text-white">{analytics.completedLearners.toLocaleString('vi-VN')}</span> học viên đã hoàn thành trọn khóa.</p>
                  <p>Tỷ lệ hoàn thành tổng thể đang ở mức <span className="font-semibold text-zinc-900 dark:text-white">{analytics.completionRate.toFixed(0)}%</span>.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Tab: Đánh giá ─── */
const ReviewsTab = ({ stats }: { stats: IInstructorRatingStats | undefined }) => {
  const sortedCourses = [...(stats?.courses ?? [])].sort((a, b) => {
    const aNeedsReview = a.reviews === 0 ? 0 : 1;
    const bNeedsReview = b.reviews === 0 ? 0 : 1;
    if (aNeedsReview !== bNeedsReview) return aNeedsReview - bNeedsReview;
    if (a.rating !== b.rating) return a.rating - b.rating;
    return b.enrollmentCount - a.enrollmentCount;
  });
  const ratingCourseChartData = sortedCourses.slice(0, 8).map((course) => ({
    ...course,
    fullLabel: course.title,
    shortLabel: shortenText(course.title, 28),
    ratingValue: course.reviews > 0 ? course.rating : 0,
    hasReview: course.reviews > 0,
  }));
  const reviewCoverageChartData = sortedCourses
    .slice()
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 8)
    .map((course) => ({
      ...course,
      fullLabel: course.title,
      shortLabel: shortenText(course.title, 28),
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Xếp hạng giảng viên"
          value={stats?.reviewCount ? stats.averageRating.toFixed(1) : '—'}
          sub={stats?.reviewCount ? 'trung bình tất cả đánh giá' : 'chưa có đánh giá'}
          icon={<Star className="w-4 h-4" />}
        />
        <StatCard
          label="Tổng đánh giá"
          value={`${(stats?.reviewCount ?? 0).toLocaleString('vi-VN')}`}
          sub="tổng số lượt học viên đã để lại nhận xét và chấm điểm"
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <StatCard
          label="Đánh giá 5 sao"
          value={`${(stats?.fiveStarCount ?? 0).toLocaleString('vi-VN')}`}
          sub="số đánh giá mức độ hài lòng cao nhất cho các khóa học của bạn"
          icon={<Star className="w-4 h-4" />}
        />
        <StatCard
          label="Khóa đã xuất bản"
          value={`${(stats?.courseCount ?? 0).toLocaleString('vi-VN')}`}
          sub="số khóa học đang hoạt động và có thể nhận đánh giá từ học viên"
          icon={<BookOpen className="w-4 h-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${cardClass} p-5`}>
          <h3 className="mb-1 font-bold text-zinc-900 dark:text-white">Điểm đánh giá theo khóa học</h3>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Khóa học chưa có đánh giá được tô màu xám để tránh hiểu nhầm là 0 sao.</p>
          {ratingCourseChartData.length > 0 ? (
            <ChartContainer config={ratingCourseChartConfig} className="h-[280px] w-full">
              <BarChart data={ratingCourseChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 5]} axisLine={false} tickLine={false} />
                <YAxis dataKey="shortLabel" type="category" axisLine={false} tickLine={false} width={132} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelKey="fullLabel"
                      formatter={(value, _name, item) => {
                        const payload = item.payload || {};
                        return payload.hasReview
                          ? `${Number(value ?? 0).toFixed(1)} sao · ${Number(payload.reviews || 0).toLocaleString('vi-VN')} đánh giá · ${Number(payload.enrollmentCount || 0).toLocaleString('vi-VN')} học viên`
                          : `Chưa có đánh giá · ${Number(payload.enrollmentCount || 0).toLocaleString('vi-VN')} học viên`;
                      }}
                    />
                  }
                />
                <Bar dataKey="ratingValue" radius={[0, 4, 4, 0]} barSize={20}>
                  {ratingCourseChartData.map((course) => (
                    <Cell key={course._id} fill={course.hasReview ? 'var(--color-ratingValue)' : '#d4d4d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChartState icon={<Star className="h-8 w-8" />} message="Chưa có khóa học đã xuất bản để vẽ rating." />
          )}
        </div>

        <div className={`${cardClass} p-5`}>
          <h3 className="mb-1 font-bold text-zinc-900 dark:text-white">Độ bao phủ đánh giá</h3>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Nhìn nhanh các khóa học có nhiều học viên nhưng ít đánh giá.</p>
          {reviewCoverageChartData.length > 0 ? (
            <ChartContainer config={reviewCoverageChartConfig} className="h-[280px] w-full">
              <BarChart data={reviewCoverageChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="shortLabel" type="category" axisLine={false} tickLine={false} width={132} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelKey="fullLabel"
                      formatter={(value, _name, item) => {
                        const payload = item.payload || {};
                        return `${Number(value ?? 0).toLocaleString('vi-VN')} đánh giá · ${Number(payload.enrollmentCount || 0).toLocaleString('vi-VN')} học viên`;
                      }}
                    />
                  }
                />
                <Bar dataKey="reviews" fill="var(--color-reviews)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChartState icon={<MessageSquare className="h-8 w-8" />} message="Chưa có dữ liệu đánh giá để hiển thị độ bao phủ." />
          )}
        </div>
      </div>

      <div className={`${cardClass} p-5`}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Đánh giá theo khóa học</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ưu tiên khóa chưa có review, rating thấp hoặc có nhiều học viên.</p>
          </div>
        </div>
        {sortedCourses.length ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedCourses.map((course) => (
              <div key={course._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{course.title}</p>
                  <p className="text-xs text-zinc-500">{course.enrollmentCount.toLocaleString('vi-VN')} học viên</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {course.reviews === 0 && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">Chưa có review</Badge>
                  )}
                  {course.reviews > 0 && course.rating < 4 && (
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">Cần cải thiện</Badge>
                  )}
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {course.reviews > 0 ? course.rating.toFixed(1) : '—'}
                  </span>
                  <span className="text-zinc-500">{course.reviews.toLocaleString('vi-VN')} đánh giá</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Chưa có khóa học đã xuất bản hoặc chưa có đánh giá.</p>
        )}
      </div>
    </div>
  );
};

const DatePickerField: React.FC<{
  disabled?: (date: Date) => boolean;
  label: string;
  onChange: (date: string) => void;
  value?: string;
}> = ({ disabled, label, onChange, value }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className="h-10 min-w-[150px] justify-start gap-2 rounded-lg border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
        aria-label={label}
      >
        <Calendar className="h-4 w-4 text-zinc-400" />
        {formatDateLabel(value)}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-auto p-3">
      <CalendarPicker
        selected={parseDateInput(value)}
        disabled={disabled}
        onSelect={(date) => onChange(toDateInput(date))}
      />
    </PopoverContent>
  </Popover>
);
const RevenueFilter: React.FC<{
  range: RevenueRange;
  customDates: InstructorRevenueParams;
  onRangeChange: (range: RevenueRange) => void;
  onCustomDatesChange: (dates: InstructorRevenueParams) => void;
}> = ({ range, customDates, onRangeChange, onCustomDatesChange }) => (
  <div className={`${cardClass} p-4`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-white">Khoảng thời gian doanh thu</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Áp dụng cho doanh thu mua lẻ, chart và breakdown.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-950">
          {revenueRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onRangeChange(option.value)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition-colors ${range === option.value
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <DatePickerField
              label="Ngày bắt đầu"
              value={customDates.startDate}
              onChange={(date) => onCustomDatesChange({ ...customDates, startDate: date })}
            />
            <DatePickerField
              label="Ngày kết thúc"
              value={customDates.endDate}
              onChange={(date) => onCustomDatesChange({ ...customDates, endDate: date })}
              disabled={(date) => {
                const startDate = parseDateInput(customDates.startDate);
                return Boolean(startDate && date < startDate);
              }}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);

export const InstructorPerformance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PerfTab>('revenue');
  const [revenueRange, setRevenueRange] = useState<RevenueRange>('90d');
  const [customRevenueDates, setCustomRevenueDates] = useState<InstructorRevenueParams>({ startDate: '', endDate: '' });
  const { data: instructorCourses = [] } = useGetMyCourses();
  const publishedCourses = useMemo(
    () => instructorCourses.filter((course) => course.status === 'PUBLISHED'),
    [instructorCourses],
  );
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const { user } = useAppSelector((state) => state.auth);
  const revenueParams = useMemo(() => getRevenueRangeParams(revenueRange, customRevenueDates), [revenueRange, customRevenueDates]);
  const { data: revenue, isLoading } = useInstructorRevenueStats(revenueParams);
  const { data: subscriptionFinance } = useInstructorSubscriptionFinance();
  const { data: ratingStats, isLoading: ratingLoading } = useInstructorRatingStats(user?._id || '', Boolean(user?._id));

  React.useEffect(() => {
    if (publishedCourses.length === 0) {
      if (selectedCourseId) setSelectedCourseId('');
      return;
    }

    const hasSelectedPublishedCourse = publishedCourses.some((course) => course._id === selectedCourseId);
    if (!hasSelectedPublishedCourse) {
      setSelectedCourseId(publishedCourses[0]._id);
    }
  }, [publishedCourses, selectedCourseId]);

  const monthlyTrend = useMemo(() => (revenue?.monthlyData ?? []).map((m) => m.instructorRevenue), [revenue]);
  const latestRevenue = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1] : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Phân tích</h1>
        <p className="text-muted-foreground mt-1">Theo dõi doanh thu, học viên và đánh giá các khóa học của bạn.</p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {PERF_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'revenue' && (
        <RevenueFilter
          range={revenueRange}
          customDates={customRevenueDates}
          onRangeChange={setRevenueRange}
          onCustomDatesChange={setCustomRevenueDates}
        />
      )}

      {isLoading && activeTab === 'revenue' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-sm text-zinc-500">Đang tải dữ liệu doanh thu...</div>
      ) : (
        <>
          {activeTab === 'revenue' && <RevenueTab range={revenueRange} revenue={revenue} subscription={subscriptionFinance} />}
          {activeTab === 'students' && (
            <StudentsTab
              courses={publishedCourses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={setSelectedCourseId}
            />
          )}
          {activeTab === 'reviews' && (ratingLoading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-sm text-zinc-500">Đang tải dữ liệu đánh giá...</div>
          ) : <ReviewsTab stats={ratingStats} />)}
        </>
      )}

      {activeTab === 'revenue' && monthlyTrend.length > 0 && (
        <div className="text-xs text-zinc-400">
          Tháng gần nhất: {formatCurrency(latestRevenue)} thực nhận.
        </div>
      )}
    </div>
  );
};































