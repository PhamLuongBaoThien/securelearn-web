// ========================
// Subscription Catalog Page
// Mục đích:
// - hiển thị toàn bộ khóa học nằm trong catalog thuê bao
// - cho user mua gói hoặc mở khóa học trực tiếp tùy trạng thái thuê bao hiện tại
// ========================
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2 } from 'lucide-react';
import { CourseCard } from '@/components/ui/CourseCard';
import { buttonVariants } from '@/components/ui/button';
import { getSubscriptionCatalog } from '@/services/courseApi';
import { useMySubscription } from '@/hooks/useMySubscription';

export function SubscriptionCatalog() {
  const { data: subscription } = useMySubscription();
  const catalogQuery = useQuery({
    queryKey: ['courses', 'subscription-catalog'],
    queryFn: async () => {
      const response = await getSubscriptionCatalog();
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tải danh sách khóa học trong gói.');
      }
      return response.data || [];
    },
  });

  return (
    <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Khóa học trong gói</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold font-serif">Toàn bộ khóa học bạn có thể học bằng thuê bao</h1>
          <p className="mt-2 text-muted-foreground">
            {subscription?.current
              ? `Gói của bạn còn hiệu lực đến ngày ${new Date(subscription.current.endsAt).toLocaleDateString('vi-VN')}.`
              : 'Mua gói để học tất cả các khóa học đang có trong danh sách này.'}
          </p>
        </div>
        {!subscription?.current && (
          <Link to="/pricing" className={buttonVariants({ variant: 'outline', className: 'rounded-sm font-bold' })}>
            Xem gói học
          </Link>
        )}
      </div>

      {catalogQuery.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : catalogQuery.data && catalogQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
          {catalogQuery.data.map((course) => (
            <CourseCard key={course._id} course={course} mode="subscription" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-semibold">Hiện chưa có khóa học nào trong gói</p>
          <p className="text-sm text-muted-foreground">Danh sách này sẽ được cập nhật khi giảng viên đăng ký tham gia và quản trị viên phê duyệt thêm khóa học.</p>
        </div>
      )}
    </div>
  );
}
