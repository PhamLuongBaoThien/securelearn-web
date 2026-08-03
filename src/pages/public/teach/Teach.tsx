import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { SlideUp } from '@/components/animations/SlideUp';
import { FadeIn } from '@/components/animations/FadeIn';
import { Button } from '@/components/ui/button';
import { useSwitchToInstructor } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const Teach = () => {
  const { user, isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const switchToInstructorMutation = useSwitchToInstructor();

  const handleStartTeaching = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!authResolved) {
      toast.message('Đang xác minh phiên đăng nhập, vui lòng thử lại sau vài giây.');
      return;
    }
    if (isAuthenticated && user) {
      if (user.role !== 'INSTRUCTOR') {
        switchToInstructorMutation.mutate(undefined, {
          onSuccess: () => {
             toast.success('Chào mừng bạn đến với khu vực giảng dạy!');
             navigate('/instructor/dashboard');
          },
          onError: (error: unknown) => {
             toast.error((error as Error).message || 'Có lỗi xảy ra khi chuyển sang vai trò người giảng dạy');
          }
        });
      } else {
        navigate('/instructor/dashboard');
      }
    } else {
      navigate('/auth/signup');
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative -mt-[88px] flex min-h-[480px] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background px-6 pt-[120px] pb-16 lg:pt-[140px] lg:pb-20 text-foreground antialiased">
        {/* Họa tiết chấm trang trí nhẹ ở background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-3xl text-center">
          <SlideUp>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Giảng dạy cùng SecureLearn
            </p>
            <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Chia sẻ kiến thức của bạn
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              SecureLearn cung cấp công cụ xây dựng khóa học, tổ chức bài giảng và quản lý học viên. Khóa học được gửi kiểm duyệt trước khi xuất bản và học liệu được áp dụng các cơ chế kiểm soát truy cập.
            </p>
            <Button
              onClick={handleStartTeaching}
              disabled={switchToInstructorMutation.isPending}
              size="lg"
              className="h-12 px-8 text-base font-bold rounded-xl shadow-md cursor-pointer"
            >
              {switchToInstructorMutation.isPending
                ? 'Đang xử lý...'
                : user?.role === 'INSTRUCTOR'
                  ? 'Đi đến khu vực giảng dạy'
                  : isAuthenticated
                    ? 'Trở thành người giảng dạy'
                    : 'Đăng ký để giảng dạy'}
            </Button>
          </SlideUp>
        </div>

        {/* Đường gạch chia nhẹ ở dưới hero banner */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </section>

      {/* Reasons to teach */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="text-3xl font-bold font-serif mb-16">Vì sao nên giảng dạy trên SecureLearn?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <FadeIn delay={0.1}>
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
               <img src="https://cdn-icons-png.flaticon.com/512/3214/3214746.png" alt="Inspire" className="w-12 h-12 opacity-80 dark:invert" />
            </div>
            <h3 className="text-xl font-bold mb-4">Xây dựng khóa học có tổ chức</h3>
            <p className="text-muted-foreground leading-relaxed">Tạo khóa học, sắp xếp chương và bài học, bổ sung video, tài liệu hoặc bài kiểm tra trước khi gửi quản trị viên kiểm duyệt.</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
               <img src="https://cdn-icons-png.flaticon.com/512/2933/2933116.png" alt="Security" className="w-12 h-12 opacity-80 dark:invert" />
            </div>
            <h3 className="text-xl font-bold mb-4">Hỗ trợ bảo vệ học liệu</h3>
            <p className="text-muted-foreground leading-relaxed">Video được chuyển sang HLS, mã hóa AES-128 và kiểm tra quyền xem. Hệ thống kết hợp phiên học, liên kết có thời hạn và watermark để hạn chế khai thác trái phép.</p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
               <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Earn" className="w-12 h-12 opacity-80 dark:invert" />
            </div>
            <h3 className="text-xl font-bold mb-4">Quản lý hoạt động giảng dạy</h3>
            <p className="text-muted-foreground leading-relaxed">Theo dõi học viên, trao đổi trong bài học, gửi thông báo khóa học và xem kết quả hoạt động cùng doanh thu được hệ thống ghi nhận.</p>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary/40 px-6 py-16 md:py-20 text-center border-t border-border">
        <h2 className="text-2xl md:text-3xl font-bold font-serif mb-4 text-foreground">Bắt đầu xây dựng khóa học của bạn</h2>
        <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">Đăng ký tài khoản hoặc chuyển sang khu vực giảng dạy, hoàn thiện hồ sơ và bắt đầu tạo khóa học đầu tiên trên SecureLearn.</p>
        <Button
          onClick={handleStartTeaching}
          disabled={switchToInstructorMutation.isPending}
          size="lg"
          className="h-12 px-8 text-base font-bold rounded-xl shadow-md cursor-pointer"
        >
          {switchToInstructorMutation.isPending
            ? 'Đang xử lý...'
            : user?.role === 'INSTRUCTOR'
              ? 'Đi đến khu vực giảng dạy'
              : isAuthenticated
                ? 'Trở thành người giảng dạy'
                : 'Đăng ký để giảng dạy'}
        </Button>
      </section>
    </div>
  );
};
