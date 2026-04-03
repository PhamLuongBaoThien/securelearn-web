import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { CourseCard } from '../../components/common/CourseCard';
import { SlideUp } from '../../components/animations/SlideUp';
import { useCourses } from '../../hooks/useCourses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T2', hours: 2 },
  { name: 'T3', hours: 4 },
  { name: 'T4', hours: 1.5 },
  { name: 'T5', hours: 5 },
  { name: 'T6', hours: 3 },
  { name: 'T7', hours: 7 },
  { name: 'CN', hours: 6 },
];

export const StudentDashboard = () => {
  const { data: courses = [], isLoading } = useCourses();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        <SlideUp delay={0}>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-between">
            <span>Chào mừng trở lại, Nam!</span>
          </h1>
          <p className="text-muted-foreground text-lg">Dưới đây là tổng quan về tiến độ học tập của bạn.</p>
        </SlideUp>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SlideUp delay={0.1}>
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-muted-foreground mb-1">Khóa học đang học</p>
              <h2 className="text-4xl font-bold text-primary">4</h2>
            </div>
          </SlideUp>
          <SlideUp delay={0.2}>
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-muted-foreground mb-1">Khóa học hoàn thành</p>
              <h2 className="text-4xl font-bold">12</h2>
            </div>
          </SlideUp>
          <SlideUp delay={0.3}>
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-muted-foreground mb-1">Chứng chỉ đạt được</p>
              <h2 className="text-4xl font-bold text-amber-500">3</h2>
            </div>
          </SlideUp>
        </div>

        {/* Chart Section */}
        <SlideUp delay={0.4}>
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm w-full h-[350px] flex flex-col">
            <h3 className="text-lg font-semibold mb-6">Số giờ học tập (Tuần này)</h3>
            <div className="flex-1 w-full h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13 }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--secondary))', radius: 4 }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SlideUp>

        {/* Featured Courses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold tracking-tight">Tiếp tục học / Khóa học của tôi</h3>
            <span className="text-sm font-medium text-primary cursor-pointer hover:underline underline-offset-4">Xem tất cả</span>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[320px] rounded-2xl bg-secondary/50 animate-pulse border border-border/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course, idx) => (
                <CourseCard key={course.id} course={course} delay={0.1 * idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
