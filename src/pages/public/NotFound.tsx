import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 bg-zinc-900/50 p-6 rounded-full border border-zinc-800">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl font-semibold mb-2 text-zinc-300">Không Tìm Thấy Trang</h2>
        <p className="text-zinc-500 mb-8 max-w-md">
          Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link 
          to="/"
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Trang Chủ
        </Link>
      </div>
    </div>
  );
};
