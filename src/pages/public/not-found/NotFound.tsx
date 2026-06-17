import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { FadeIn } from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Float3D } from '@/components/animations/Float3D';
import { Button } from '@/components/ui/button';

export const NotFound: React.FC = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[linear-gradient(180deg,#fbfbf9_0%,#f4f2ed_100%)] text-zinc-900 flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-black/6" />
        <div className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-black/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-3xl items-center justify-center px-6 py-6 sm:px-10">
        <StaggerContainer className="flex w-full flex-col items-center text-center justify-center">
          <StaggerItem className="mb-6">
            <Float3D>
              <div className="relative mx-auto w-fit transform-gpu [perspective:1200px] [transform-style:preserve-3d]">
                <div className="flex items-center justify-center">
                  <svg
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-44 w-44 text-zinc-900 sm:h-52 sm:w-52"
                  >
                    {/* Nền tròn phát sáng mờ phía sau */}
                    <circle cx="100" cy="100" r="75" fill="currentColor" className="opacity-[0.02]" />
                    <circle cx="100" cy="100" r="55" fill="currentColor" className="opacity-[0.03]" />

                    {/* Các đường vẽ quỹ đạo bay quanh */}
                    <path
                      d="M 30,110 A 70,35 45 0,1 170,90"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray="4 8"
                      className="opacity-20"
                    />

                    {/* Các ngôi sao lấp lánh nhỏ */}
                    <path
                      d="M 45,60 L 47,65 L 52,67 L 47,69 L 45,74 L 43,69 L 38,67 L 43,65 Z"
                      fill="currentColor"
                      className="animate-pulse opacity-40"
                      style={{ animationDuration: '3s' }}
                    />
                    <path
                      d="M 155,135 L 157,140 L 162,142 L 157,144 L 155,149 L 153,144 L 148,142 L 153,140 Z"
                      fill="currentColor"
                      className="animate-pulse opacity-30"
                      style={{ animationDuration: '4s' }}
                    />

                    {/* Quyển sách đang mở dạng Isometric tối giản */}
                    {/* Bìa sách trái */}
                    <path
                      d="M 40,90 L 95,115 L 95,155 L 40,130 Z"
                      fill="#F4F4F5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {/* Các trang sách trái */}
                    <path
                      d="M 45,85 L 100,110 L 100,150 L 45,125 Z"
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {/* Bìa sách phải */}
                    <path
                      d="M 160,90 L 105,115 L 105,155 L 160,130 Z"
                      fill="#E4E4E7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {/* Các trang sách phải */}
                    <path
                      d="M 155,85 L 100,110 L 100,150 L 155,125 Z"
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />

                    {/* Đường gáy sách */}
                    <path
                      d="M 100,110 L 100,150"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-40"
                    />

                    {/* Các dòng chữ giả trên trang sách */}
                    <path
                      d="M 55,100 L 85,114 M 55,110 L 75,119 M 55,120 L 80,131"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-20"
                    />
                    <path
                      d="M 115,114 L 145,100 M 125,119 L 145,110 M 115,129 L 135,120"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-20"
                    />

                    {/* Đám mây nhỏ bay lên từ cuốn sách */}
                    <path
                      d="M 90,80 C 85,80 80,84 80,89 C 75,89 71,93 71,98 C 71,103 75,107 80,107 L 110,107 C 115,107 119,103 119,98 C 119,93 115,89 110,89 C 110,84 105,80 100,80 C 97,80 94,82 92,84 C 91,82 90,80 90,80 Z"
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      className="shadow-sm"
                    />

                    {/* Kính lúp (được đặt nghiêng, phóng to khoảng trống) */}
                    <g className="animate-bounce" style={{ animationDuration: '6s', transformOrigin: '100px 98px' }}>
                      {/* Tay cầm kính lúp */}
                      <path
                        d="M 112,98 L 132,118"
                        stroke="currentColor"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 112,98 L 132,118"
                        stroke="#F4F4F5"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      
                      {/* Tròng kính lúp */}
                      <circle
                        cx="98"
                        cy="84"
                        r="20"
                        fill="white"
                        fillOpacity="0.8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      {/* Vòng phản chiếu trong kính lúp */}
                      <path
                        d="M 85,84 A 13,13 0 0,1 98,71"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="opacity-45"
                      />
                      
                      {/* Dấu chấm hỏi bên trong tròng kính lúp */}
                      <path
                        d="M 94,80 C 94,77 96,75 99,75 C 101.5,75 103,76.5 103,78.5 C 103,80.5 101,81.5 100,82.5 C 99,83.5 99,85 99,86 M 99,90 H 99.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>

                    {/* Một số hạt lấp lánh nổi bật */}
                    <circle cx="108" cy="55" r="2" fill="currentColor" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                    <circle cx="78" cy="65" r="1.5" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </Float3D>
          </StaggerItem>

          <StaggerItem className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-zinc-500">
              SecureLearn
            </p>
          </StaggerItem>

          <StaggerItem className="mt-4 max-w-2xl">
            <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.05em] text-zinc-900 sm:text-[3.5rem]">
              Trang bạn tìm kiếm không tồn tại.
            </h1>
          </StaggerItem>

          <StaggerItem className="mt-3 max-w-lg">
            <p className="text-base leading-7 text-zinc-600 sm:text-[17px]">
              Có thể liên kết đã cũ, đường dẫn bị sai, hoặc nội dung đã được chuyển sang vị trí khác.
            </p>
          </StaggerItem>

          <StaggerItem className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="udemy_dark" size="xl" className="w-full rounded-full px-7">
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </Link>
            <Button
              type="button"
              onClick={() => window.history.back()}
              variant="outline"
              size="xl"
              className="w-full rounded-full border-black/10 bg-white/80 px-7 hover:bg-white text-zinc-900 sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </StaggerItem>

          <FadeIn delay={0.25} direction="up" className="mt-10">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="h-px w-8 bg-black/10" />
              Không tìm thấy trang / Page Not Found
              <span className="h-px w-8 bg-black/10" />
            </div>
          </FadeIn>
        </StaggerContainer>
      </div>
    </div>
  );
};
