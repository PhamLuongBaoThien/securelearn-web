import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, BookOpen, CalendarDays, Loader2, Star, UsersRound, Globe, Linkedin, Share2, ChevronDown, ChevronUp, Github, Facebook, Youtube } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getPublicProfileBySlug } from '@/services/authApi';
import { getPublishedCourses, type ICourse } from '@/services/courseApi';
import { useInstructorRatingStats } from '@/hooks/useCourseReviews';
import { useAppSelector } from '@/app/hooks';
import { CourseCard } from '@/components/ui/CourseCard';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { PublicUserProfileSkeleton } from './PublicUserProfileSkeleton';

function CourseGrid({ courses, emptyText }: { courses: ICourse[]; emptyText: string }) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertCircle size={17} />
      {message}
    </div>
  );
}

export function PublicUserProfile() {
  const { slug = '' } = useParams();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['public-profile', slug],
    queryFn: async () => {
      const response = await getPublicProfileBySlug(slug);
      if (response.status === 'ERR' || !response.data) throw new Error(response.message || 'Không tìm thấy hồ sơ.');
      return response.data;
    },
    retry: 1,
  });

  const profile = profileQuery.data;
  const isInstructor = profile?.role === 'INSTRUCTOR';
  const isOwner = currentUser?._id === profile?._id;

  const authoredQuery = useQuery({
    queryKey: ['public-profile', slug, 'authored-courses', profile?._id],
    queryFn: async () => {
      const response = await getPublishedCourses({ instructorId: profile!._id, page: 1, limit: 12 });
      if (response.status === 'ERR') throw new Error(response.message);
      return response.data?.courses ?? [];
    },
    enabled: Boolean(profile?._id && isInstructor),
  });

  const ratingQuery = useInstructorRatingStats(profile?._id ?? '', Boolean(profile?._id && isInstructor));

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết hồ sơ vào clipboard!');
  };

  if (profileQuery.isLoading) {
    return <PublicUserProfileSkeleton />;
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h1 className="text-2xl font-bold">Không tìm thấy hồ sơ</h1>
        <p className="mt-2 text-muted-foreground">Hồ sơ không tồn tại hoặc không còn khả dụng.</p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (profile.publicSlug !== slug) return <Navigate replace to={'/users/' + profile.publicSlug} />;

  const stats = ratingQuery.data;
  const bioText = profile.profile.bio || '';
  const shouldTruncate = bioText.length > 350;
  const displayedBio = shouldTruncate && !isBioExpanded ? `${bioText.slice(0, 350)}...` : bioText;

  const socialLinks = [
    { icon: Globe, label: 'Website', href: profile.profile.website },
    { icon: Github, label: 'GitHub', href: profile.profile.github },
    { icon: Linkedin, label: 'LinkedIn', href: profile.profile.linkedin },
    { icon: Facebook, label: 'Facebook', href: profile.profile.facebook },
    { icon: Youtube, label: 'YouTube', href: profile.profile.youtube },
  ].filter(link => Boolean(link.href && link.href.trim() !== ''));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Container chính dạng 2 cột */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Cột phụ Sidebar (Bên phải trên Desktop, trên cùng ở Mobile) - lg:col-span-4 */}
        <aside className="lg:col-span-4 lg:order-2">
          <div className="sticky top-6 flex flex-col items-center rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
            {/* Avatar lớn */}
            <div className="relative">
              <UserAvatar 
                user={{ fullName: profile.fullName, avatarUrl: profile.profile.avatarUrl }} 
                className="h-36 w-36 border-4 border-background text-4xl shadow-sm transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>

            {/* Badge Vai trò */}
            <span className="mt-5 inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              {isInstructor ? 'Giảng viên' : 'Học viên'}
            </span>

            {/* Liên kết mạng xã hội */}
            {socialLinks.length > 0 && (
              <TooltipProvider>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  {socialLinks.map(({ icon: Icon, label, href }) => (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                        >
                          <Icon size={18} />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs flex flex-col gap-0.5 text-center">
                        <span className="font-semibold text-xs">{label}</span>
                        <span className="text-[10px] text-muted-foreground break-all">
                          {href ? href.replace(/^(https?:\/\/)?(www\.)?/, '') : ''}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            )}

            {/* Chỉ số giảng dạy (Chỉ hiển thị đối với Instructor) */}
            {isInstructor && (
              <div className="mt-8 w-full space-y-4 rounded-2xl bg-muted/40 border border-border/30 p-5 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Chỉ số giảng dạy</h3>
                
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <UsersRound size={20} />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none text-foreground">
                      {stats?.studentCount?.toLocaleString('vi-VN') ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">Học viên tham gia</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Star size={20} className="fill-current" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none text-foreground flex items-baseline gap-1.5">
                      {stats?.averageRating?.toFixed(1) ?? '0.0'}
                      <span className="text-[11px] font-medium text-muted-foreground">
                        ({stats?.reviewCount ?? 0} đánh giá)
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">Đánh giá trung bình</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none text-foreground">
                      {stats?.courseCount ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">Khóa học xuất bản</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ngày tham gia */}
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={14} />
              Tham gia từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </aside>

        {/* Cột chính Content (Bên trái trên Desktop) - lg:col-span-8 */}
        <main className="lg:col-span-8">
          <div className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            
            {/* Tên & Headline */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {profile.fullName}
              </h1>
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                {profile.profile.headline || (isInstructor ? 'Giảng viên tại SecureLearn' : 'Học viên tại SecureLearn')}
              </p>
              
              {/* Nút hành động */}
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  onClick={handleShare}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <Share2 size={15} />
                  Chia sẻ hồ sơ
                </button>
                {isOwner && (
                  <Link
                    to="/account/settings/profile"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 text-primary px-4 text-sm font-medium transition-colors hover:bg-primary/10"
                  >
                    Chỉnh sửa hồ sơ
                  </Link>
                )}
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Phần Giới thiệu bản thân (Bio) */}
            <div>
              <h2 className="text-xl font-bold text-foreground">Giới thiệu bản thân</h2>
              <div className="mt-4">
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">
                  {bioText ? displayedBio : 'Thành viên này chưa cập nhật phần giới thiệu bản thân.'}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="mt-3.5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {isBioExpanded ? (
                      <>
                        Thu gọn <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        Xem thêm <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách khóa học đang giảng dạy */}
            {isInstructor && (
              <>
                <hr className="border-border/60" />
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Khóa học đang giảng dạy</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Các khóa học chất lượng được thiết kế và xuất bản bởi giảng viên.</p>
                    </div>
                    {stats?.courseCount !== undefined && stats.courseCount > 0 && (
                      <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {stats.courseCount} khóa
                      </span>
                    )}
                  </div>

                  {authoredQuery.isError ? (
                    <SectionError message="Không thể tải danh sách khóa học đang giảng dạy." />
                  ) : authoredQuery.isLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                      <Loader2 className="animate-spin h-5 w-5 text-primary" />
                      Đang tải khóa học...
                    </div>
                  ) : (
                    <CourseGrid 
                      courses={authoredQuery.data ?? []} 
                      emptyText="Giảng viên chưa có khóa học nào được xuất bản trên SecureLearn." 
                    />
                  )}
                </div>
              </>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}
