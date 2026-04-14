import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { SlideUp } from '../../components/animations/SlideUp';
import { FadeIn } from '../../components/animations/FadeIn';
import { buttonVariants } from '../../components/ui/button';
import { useSwitchToInstructor } from '../../hooks/useAuth';
import { toast } from 'sonner';

export const Teach = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const switchToInstructorMutation = useSwitchToInstructor();

  const handleStartTeaching = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated && user) {
      if (user.role !== 'INSTRUCTOR') {
        switchToInstructorMutation.mutate(undefined, {
          onSuccess: () => {
             toast.success('Chào mừng bạn đến với trang Giảng viên!');
             navigate('/instructor/dashboard');
          },
          onError: (error: any) => {
             toast.error(error.message || 'Có lỗi xảy ra khi chuyển sang Giảng viên');
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
      <section className="relative w-full aspect-[21/9] md:aspect-[3/1] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1580828343064-fde4cad202b5?auto=format&fit=crop&q=80&w=2000" alt="Teaching" className="w-full h-full object-cover grayscale-[30%] dark:grayscale-[50%] dark:opacity-80" />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <SlideUp>
            <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-6">Đến lúc truyền cảm hứng</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-8 leading-snug">
              Trở thành giảng viên trên SecureLearn và tiếp cận hàng triệu học viên toàn thế giới. Nền tảng của chúng tôi cung cấp hệ thống bảo mật bảo vệ triệt để chất xám của bạn.
            </p>
            <button onClick={handleStartTeaching} disabled={switchToInstructorMutation.isPending} className={buttonVariants({ variant: 'default', className: 'h-14 px-8 text-lg font-bold rounded-none bg-blue-600 hover:bg-blue-700 text-white border-0' })}>
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
