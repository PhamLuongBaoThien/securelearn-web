import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { SlideUp } from '@/components/animations/SlideUp';
import { FadeIn } from '@/components/animations/FadeIn';
import { buttonVariants } from '@/components/ui/button';
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
             toast.success('Chào mừng bạn đến với trang Giảng viên!');
             navigate('/instructor/dashboard');
          },
          onError: (error: unknown) => {
             toast.error((error as Error).message || 'Có lỗi xảy ra khi chuyển sang Giảng viên');
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
      <section className="relative -mt-[88px] flex min-h-[520px] w-full items-center justify-center bg-gradient-to-br from-sky-50 via-blue-100 to-blue-200 px-6 pb-20 pt-36 text-slate-950 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 dark:text-white">
        <div className="relative z-10 max-w-3xl text-center">
          <SlideUp>
            <h1 className="mb-6 font-serif text-4xl font-bold md:text-6xl">
              Đến lúc truyền cảm hứng
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl leading-snug text-slate-700 md:text-2xl dark:text-white/85">
              Trở thành giảng viên trên SecureLearn và tiếp cận hàng triệu học viên toàn thế giới. Nền tảng của chúng tôi cung cấp hệ thống bảo mật bảo vệ triệt để chất xám của bạn.
            </p>
            <button onClick={handleStartTeaching} disabled={switchToInstructorMutation.isPending} className={buttonVariants({ variant: 'default', className: 'h-14 px-8 text-lg font-bold rounded-none bg-blue-600 text-white hover:bg-blue-700 border-0 dark:bg-white dark:text-blue-700 dark:hover:bg-white/90' })}>
              {switchToInstructorMutation.isPending ? 'Đang chuyển...' : 'Bắt đầu giảng dạy'}
            </button>
          </SlideUp>
        </div>
      </section>

      {/* Reasons to teach */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="text-3xl font-bold font-serif mb-16">Vì sao nên giảng dạy trên SecureLearn?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <FadeIn delay={0.1}>
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
               <img src="https://cdn-icons-png.flaticon.com/512/3214/3214746.png" alt="Inspire" className="w-12 h-12 opacity-80 dark:invert" />
            </div>
            <h3 className="text-xl font-bold mb-4">Giảng dạy theo cách của bạn</h3>
            <p className="text-muted-foreground leading-relaxed">Tự do kiểm soát nội dung và xuất bản các khóa học theo phong cách riêng của bạn. Đội ngũ kỹ thuật hỗ trợ tận tình phía sau lưng.</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
               <img src="https://cdn-icons-png.flaticon.com/512/2933/2933116.png" alt="Security" className="w-12 h-12 opacity-80 dark:invert" />
            </div>
            <h3 className="text-xl font-bold mb-4">Bảo mật bằng DRM mạnh mẽ</h3>
            <p className="text-muted-foreground leading-relaxed">Khóa học của bạn được bảo vệ tuyệt đối bằng mã hóa AES-128 HLS, chặn chia sẻ tài khoản, và chặn tính năng quay-chụp màn hình trái phép.</p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
               <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Earn" className="w-12 h-12 opacity-80 dark:invert" />
            </div>
            <h3 className="text-xl font-bold mb-4">Tạo thu nhập thụ động</h3>
            <p className="text-muted-foreground leading-relaxed">Gia tăng thu nhập từ mỗi lượt mua. Mạng lưới Affiliate tự động giúp khóa học của bạn mở rộng mạng lưới với các học viên tiềm năng.</p>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary/40 px-6 py-20 text-center border-t border-border">
        <h2 className="text-3xl font-bold font-serif mb-6">Bạn đã sẵn sàng bước lên bục giảng?</h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">Tham gia cùng hàng ngàn giảng viên uy tín trên mạng lưới của SecureLearn để truyền đạt kiến thức ngay hôm nay.</p>
        <button onClick={handleStartTeaching} disabled={switchToInstructorMutation.isPending} className={buttonVariants({ variant: 'udemy_dark', className: 'h-14 px-12 text-lg font-bold rounded-none' })}>
          {switchToInstructorMutation.isPending ? 'Đang xử lý...' : 'Bắt đầu ngay bây giờ'}
        </button>
      </section>
    </div>
  );
};
