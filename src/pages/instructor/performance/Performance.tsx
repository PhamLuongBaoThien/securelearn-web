// ========================
// Instructor Performance Page
// Mục đích:
// - hiển thị báo cáo doanh thu, học viên và đánh giá cho instructor
// - tách doanh thu mua đứt và doanh thu thuê bao để theo dõi estimated/pending/available rõ ràng
// ========================
import React, { useMemo, useState } from 'react';
import {
  DollarSign, Users, Star,
  BookOpen, Clock, Award, Percent, MessageSquare, GraduationCap, CircleHelp,
} from 'lucide-react';
import {
  type InstructorRevenueBreakdown,
  type InstructorSubscriptionFinance,
} from '@/services/paymentApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select } from '@/components/ui/select';
import { useInstructorRevenueStats, useInstructorSubscriptionFinance } from '@/hooks/useInstructorFinance';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';
import { useAppSelector } from '@/app/hooks';
import { useInstructorCourseAnalytics } from '@/hooks/useLearningProgress';
import { useInstructorRatingStats } from '@/hooks/useCourseReviews';
import type { IInstructorRatingStats } from '@/services/courseApi';

type PerfTab = 'revenue' | 'students' | 'reviews';

const PERF_TABS: { id: PerfTab; label: string; icon: React.ReactNode }[] = [
  { id: 'revenue',  label: 'Doanh thu',  icon: <DollarSign className="w-4 h-4" /> },
  { id: 'students', label: 'Học viên',   icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'reviews',  label: 'Đánh giá',   icon: <Star className="w-4 h-4" /> },
];

const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode }> = ({
  label, value, sub, icon,
}) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label}</span>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">{icon}</div>
    </div>
    <div>
      <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const MiniBar: React.FC<{ label: string; value: number; max: number; color?: string }> = ({ label, value, max, color = 'bg-primary' }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-zinc-500 w-20 shrink-0 truncate">{label}</span>
    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
    </div>
    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-14 text-right">{value.toLocaleString()}</span>
  </div>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

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
      <TooltipContent className="max-w-xs text-left leading-5">
        {content}
      </TooltipContent>
    </Tooltip>
  </div>
);

/* ─── Tab: Doanh thu ─── */
const RevenueTab = ({ revenue, subscription }: {
  revenue: InstructorRevenueBreakdown | undefined;
  subscription: InstructorSubscriptionFinance | undefined;
}) => {
  const monthlyData = revenue?.monthlyData ?? [];
  const maxMonthRevenue = Math.max(...monthlyData.map((m) => m.instructorRevenue), 1);
  const providerBreakdown = revenue?.providerBreakdown ?? [];
  const topCourses = revenue?.courseBreakdown ?? [];

  return (
    <TooltipProvider delayDuration={250}>
      <div className="space-y-6">
      <div>
        {/* Gom giải thích vào tooltip để giao diện gọn nhưng instructor vẫn xem được cách tính khi cần. */}
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
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(revenue?.totalGrossRevenue ?? 0)}
          sub="trước chia"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          label="Doanh thu thực nhận"
          value={formatCurrency(revenue?.totalInstructorRevenue ?? 0)}
          sub="số tiền bạn nhận được"
          icon={<Award className="w-4 h-4" />}
        />
        <StatCard
          label="Giao dịch thành công"
          value={`${(revenue?.totalTransactions ?? 0).toLocaleString('vi-VN')}`}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Tỷ lệ chia"
          value={`${revenue?.instructorPercent ?? 0}%`}
          sub={`QTV nhận ${revenue?.adminPercent ?? 0}%`}
          icon={<Percent className="w-4 h-4" />}
        />
      </div>

      {/* Monthly + Top courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Doanh thu theo tháng</h3>
          <div className="space-y-3">
            {monthlyData.length > 0 ? monthlyData.map((m) => (
              <MiniBar key={m.month} label={m.month} value={m.instructorRevenue} max={maxMonthRevenue} />
            )) : (
              <p className="text-sm text-zinc-500">Chưa có dữ liệu doanh thu.</p>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Khóa học nổi bật</h3>
          <div className="space-y-3">
            {topCourses.slice(0, 5).map((c) => (
              <div key={c.courseId} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-primary" /></div>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{c.courseTitle}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
                  <span>{c.transactions} GD</span>
                  <span className="text-emerald-500 font-bold">{formatCurrency(c.instructorRevenue)}</span>
                </div>
              </div>
            ))}
            {topCourses.length === 0 && <p className="text-sm text-zinc-500">Chưa có dữ liệu khóa học.</p>}
          </div>
        </div>
      </div>

      {/* Provider breakdown */}
      {providerBreakdown.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Doanh thu theo cổng thanh toán</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {providerBreakdown.map((p) => (
              <div key={p.provider} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{p.provider}</p>
                  <p className="text-xs text-zinc-500">{p.transactions} giao dịch</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.instructorRevenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course breakdown table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Chi tiết doanh thu theo khóa học</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
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
          {(revenue?.courseBreakdown ?? []).length === 0 && <p className="text-sm text-zinc-500 mt-4">Chưa có dữ liệu doanh thu.</p>}
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
  courses: Array<{ _id: string; title: string; sections?: Array<{ lessons: Array<{ _id?: string; title: string; type: "VIDEO" | "QUIZ" }> }> }>;
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
}) => {
  const analyticsQuery = useInstructorCourseAnalytics(selectedCourseId);
  const selectedCourse = courses.find((course) => course._id === selectedCourseId);
  const lessonMeta = new Map(
    (selectedCourse?.sections || []).flatMap((section) =>
      (section.lessons || []).map((lesson) => [lesson._id || '', { title: lesson.title, type: lesson.type }]),
    ),
  );

  const analytics = analyticsQuery.data;
  const lessons = (analytics?.lessons || []).map((lesson, index) => {
    const meta = lessonMeta.get(lesson.lessonId);
    return {
      ...lesson,
      title: meta?.title || `Bài học ${index + 1}`,
      lessonType: meta?.type || lesson.lessonType,
      dropOffRate: Math.max(0, 100 - lesson.completionRate),
    };
  });
  const dropOffLessons = [...lessons]
    .filter((lesson) => lesson.startedCount > 0)
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .slice(0, 3);

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <GraduationCap className="mx-auto h-10 w-10 text-zinc-400" />
        <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Chưa có khóa học để phân tích</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Hãy xuất bản ít nhất một khóa học để xem dữ liệu tiến độ học tập của học viên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Phân tích học tập theo khóa học</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Theo dõi tỷ lệ hoàn thành, tiến độ xem video và kết quả quiz từ Progress Service.</p>
          </div>
          <div className="w-full max-w-sm">
            <Select value={selectedCourseId} onChange={(event) => onSelectCourse(event.target.value)} className="h-11 rounded-xl border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Đang tải dữ liệu tiến độ học tập...
        </div>
      ) : analyticsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {(analyticsQuery.error as Error)?.message || 'Không thể tải dữ liệu phân tích khóa học.'}
        </div>
      ) : !analytics || analytics.totalLearners === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Users className="mx-auto h-10 w-10 text-zinc-400" />
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Chưa có dữ liệu học tập</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Khóa học này chưa có học viên hoặc chưa phát sinh tiến độ đủ để hiển thị phân tích.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Tổng học viên" value={analytics.totalLearners.toLocaleString('vi-VN')} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Đã hoàn thành" value={analytics.completedLearners.toLocaleString('vi-VN')} icon={<Award className="w-4 h-4" />} />
            <StatCard label="Tỷ lệ hoàn thành" value={`${analytics.completionRate.toFixed(0)}%`} icon={<Percent className="w-4 h-4" />} />
            <StatCard label="Bài có drop-off" value={`${dropOffLessons.length}`} sub="3 bài cao nhất" icon={<Clock className="w-4 h-4" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
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
                          <p className="font-medium text-zinc-900 dark:text-white">{lesson.title}</p>
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
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Điểm rơi rụng cao</h3>
                <div className="space-y-3">
                  {dropOffLessons.length > 0 ? dropOffLessons.map((lesson) => (
                    <div key={lesson.lessonId} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{lesson.title}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{lesson.startedCount} bắt đầu · {lesson.completedCount} hoàn thành</p>
                      <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">Drop-off {lesson.dropOffRate.toFixed(0)}%</p>
                    </div>
                  )) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có đủ dữ liệu để xác định bài học có nhiều học viên bỏ dở.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
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

/* ─── Tab: Đánh giá (placeholder) ─── */
const ReviewsTab = ({ stats }: { stats: IInstructorRatingStats | undefined }) => (
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
        icon={<MessageSquare className="w-4 h-4" />}
      />
      <StatCard
        label="Đánh giá 5 sao"
        value={`${(stats?.fiveStarCount ?? 0).toLocaleString('vi-VN')}`}
        icon={<Star className="w-4 h-4" />}
      />
      <StatCard
        label="Khóa đã xuất bản"
        value={`${(stats?.courseCount ?? 0).toLocaleString('vi-VN')}`}
        icon={<BookOpen className="w-4 h-4" />}
      />
    </div>

    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Đánh giá theo khóa học</h3>
      {stats?.courses.length ? (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {stats.courses.map((course) => (
            <div key={course._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{course.title}</p>
                <p className="text-xs text-zinc-500">{course.enrollmentCount.toLocaleString('vi-VN')} học viên</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
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

export const InstructorPerformance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PerfTab>('revenue');
  const { data: instructorCourses = [] } = useGetMyCourses();
  const publishedCourses = useMemo(
    () => instructorCourses.filter((course) => course.status === 'PUBLISHED'),
    [instructorCourses],
  );
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const { user } = useAppSelector((state) => state.auth);
  const { data: revenue, isLoading } = useInstructorRevenueStats();
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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

      {isLoading && activeTab === 'revenue' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-sm text-zinc-500">Đang tải dữ liệu doanh thu...</div>
      ) : (
        <>
          {activeTab === 'revenue' && <RevenueTab revenue={revenue} subscription={subscriptionFinance} />}
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
