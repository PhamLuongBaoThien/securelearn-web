// File: CourseInstructor.tsx
// Hiển thị thông tin giảng viên của khóa học.
// Dùng instructorProfile nếu public course response có avatar/bio,
// fallback về chữ viết tắt khi giảng viên chưa cập nhật ảnh.

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, Users, UserRoundCheck } from 'lucide-react';
import { getPublicInstructorProfile } from '@/services/authApi';
import { useInstructorRatingStats } from '@/hooks/useCourseReviews';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface Props {
  instructorId: string;
  instructorName: string;   // Tên giảng viên lấy từ ICourse.instructorName
  enrollmentCount: number;  // Tổng số học viên của khóa học (dùng làm thống kê)
  avatarUrl?: string;
  bio?: string;
}

export function CourseInstructor({ instructorId, instructorName, enrollmentCount, avatarUrl, bio }: Props) {
  const shouldFetchProfile = Boolean(instructorId);
  const { data: ratingStats } = useInstructorRatingStats(instructorId);
  const { data: publicProfile } = useQuery({
    queryKey: ['public-instructor-profile', instructorId],
    queryFn: async () => {
      const response = await getPublicInstructorProfile(instructorId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải profile giảng viên.');
      }
      return response.data;
    },
    enabled: shouldFetchProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const displayedAvatarUrl = avatarUrl || publicProfile?.profile?.avatarUrl || '';
  const displayedBio = bio || publicProfile?.profile?.bio || '';
  const displayedName = publicProfile?.fullName || instructorName;
  const instructorStudentCount = ratingStats?.studentCount ?? enrollmentCount;
  const instructorReviewCount = ratingStats?.reviewCount ?? 0;
  const instructorRating = ratingStats?.averageRating ?? 0;

  return (
    <section className="rounded-lg border border-border bg-card p-6 lg:p-7 shadow-sm">
      <h2 className="text-2xl font-bold font-serif mb-6">Giảng viên</h2>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <UserAvatar
          user={{ fullName: displayedName, avatarUrl: displayedAvatarUrl }}
          className="h-20 w-20 text-xl"
        />

        {/* Thông tin giảng viên */}
        <div className="min-w-0 flex-1">
          {publicProfile?.publicSlug ? (
            <Link to={'/users/' + publicProfile.publicSlug} className="text-xl font-bold text-foreground underline-offset-4 hover:text-primary hover:underline">{displayedName}</Link>
          ) : <h3 className="text-xl font-bold text-foreground">{displayedName}</h3>}
          <p className="text-sm text-muted-foreground mb-4">Giảng viên khóa học</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <UserRoundCheck className="w-4 h-4 text-primary" />
              Giảng viên được xác minh
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              {instructorStudentCount.toLocaleString('vi-VN')} học viên
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {instructorReviewCount > 0
                ? `${instructorRating.toFixed(1)} (${instructorReviewCount.toLocaleString('vi-VN')} đánh giá)`
                : 'Chưa có đánh giá'}
            </span>
          </div>
          {displayedBio && (
            <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {displayedBio}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
