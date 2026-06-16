// File: CourseInstructor.tsx
// Hiển thị thông tin giảng viên của khóa học.
// Dùng instructorProfile nếu public course response có avatar/bio,
// fallback về chữ viết tắt khi giảng viên chưa cập nhật ảnh.

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Users, UserRoundCheck } from 'lucide-react';
import { getPublicInstructorProfile } from '@/services/authApi';

interface Props {
  instructorId: string;
  instructorName: string;   // Tên giảng viên lấy từ ICourse.instructorName
  enrollmentCount: number;  // Tổng số học viên của khóa học (dùng làm thống kê)
  avatarUrl?: string;
  bio?: string;
}

export function CourseInstructor({ instructorId, instructorName, enrollmentCount, avatarUrl, bio }: Props) {
  const shouldFetchProfile = Boolean(instructorId && (!avatarUrl || !bio));
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

  // Tạo chữ viết tắt từ tên: lấy ký tự đầu của tối đa 2 từ rồi viết hoa.
  // Ví dụ: "Nguyễn Văn An" → "NV"
  const initials = displayedName
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <section className="rounded-lg border border-border bg-card p-6 lg:p-7 shadow-sm">
      <h2 className="text-2xl font-bold font-serif mb-6">Giảng viên</h2>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* Avatar thật nếu API có profile, fallback về chữ viết tắt */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
          {displayedAvatarUrl ? (
            <img
              src={displayedAvatarUrl}
              alt={displayedName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-primary">{initials}</span>
          )}
        </div>

        {/* Thông tin giảng viên */}
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-foreground">
            {displayedName}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Giảng viên khóa học</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <UserRoundCheck className="w-4 h-4 text-primary" />
              Giảng viên được xác minh
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              {enrollmentCount.toLocaleString('vi-VN')} học viên
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary" />
              Chuyên môn thực chiến
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
