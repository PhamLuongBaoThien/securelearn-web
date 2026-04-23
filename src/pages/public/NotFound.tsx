import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { FadeIn } from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Float3D } from '@/components/animations/Float3D';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const NotFound: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbfbf9_0%,#f4f2ed_100%)] text-zinc-900">
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-black/6" />
        <div className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-black/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16 sm:px-10">
        <StaggerContainer className="flex w-full flex-col items-center text-center">
          <StaggerItem className="mb-10">
            <Float3D>
              <div className="relative mx-auto w-fit transform-gpu [perspective:1200px] [transform-style:preserve-3d]">
                <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white px-7 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.07)] sm:px-10">
                  <div className="absolute inset-x-0 top-0 h-px bg-black/5" />
                  <div className="flex items-center justify-center gap-3 text-[4.75rem] font-semibold leading-[0.9] text-zinc-900 sm:gap-4 sm:text-[7rem]">
                    <span className="block">4</span>
                    <span className="block rounded-full border border-black/10 bg-zinc-50 px-[0.16em] pb-[0.08em] pt-[0.02em] shadow-inner">
                      0
                    </span>
                    <span className="block">4</span>
                  </div>
                </div>
                <div className="absolute inset-x-12 -bottom-4 h-8 rounded-full bg-black/10 blur-2xl" />
              </div>
            </Float3D>
          </StaggerItem>

          <StaggerItem className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-zinc-500">
              SecureLearn
            </p>
          </StaggerItem>

          <StaggerItem className="mt-6 max-w-2xl">
            <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.05em] text-zinc-900 sm:text-[3.5rem]">
              Trang bạn tìm kiếm không tồn tại.
            </h1>
          </StaggerItem>

          <StaggerItem className="mt-5 max-w-lg">
            <p className="text-base leading-7 text-zinc-600 sm:text-[17px]">
              Có thể liên kết đã cũ, đường dẫn bị sai, hoặc nội dung đã được chuyển sang vị trí khác.
            </p>
          </StaggerItem>

          <StaggerItem className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className={cn(buttonVariants({ variant: 'udemy_dark', size: 'xl' }), 'rounded-full px-7')}
            >
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'rounded-full border-black/10 bg-white/80 px-7 hover:bg-white')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </button>
          </StaggerItem>

          <FadeIn delay={0.25} direction="up" className="mt-14">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="h-px w-8 bg-black/10" />
              404 / Not Found
              <span className="h-px w-8 bg-black/10" />
            </div>
          </FadeIn>
        </StaggerContainer>
      </div>
    </div>
  );
};
