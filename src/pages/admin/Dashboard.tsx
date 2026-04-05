import React from 'react';
import { Users, BookOpen, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const StatCard = ({ title, value, change, isPositive, icon: Icon }: any) => (
  <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-primary transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
      </div>
    </div>
    
    <div className="relative z-10">
      <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Tổng quan hệ thống</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Chào mừng trở lại! Đây là thống kê mới nhất về nền tảng SecureLearn.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-colors shadow-sm dark:shadow-none">
          <Activity className="w-4 h-4 text-primary" />
          Đồng bộ máy chủ
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Tổng người dùng" 
          value="12,450" 
          change="+12.5%" 
          isPositive={true} 
          icon={Users} 
        />
        <StatCard 
          title="Khóa học đang mở" 
          value="450" 
          change="+5.2%" 
          isPositive={true} 
          icon={BookOpen} 
        />
        <StatCard 
          title="Doanh thu hàng tháng" 
          value="245.5M ₫" 
          change="+8.4%" 
          isPositive={true} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Tỷ lệ chuyển đổi" 
          value="3.24%" 
          change="-1.2%" 
          isPositive={false} 
          icon={TrendingUp} 
        />
      </div>

      {/* Charts & Tables Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 min-h-[400px] flex flex-col shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Xu hướng doanh thu</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Hiệu suất thu nhập nền tảng trong 6 tháng qua</p>
          
          <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50">
            <span className="text-zinc-500 dark:text-zinc-600 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Biểu đồ doanh thu đang được cập nhật
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Đăng ký gần đây</h2>
            <button className="text-sm text-primary hover:text-primary/80 transition-colors">Xem tất cả</button>
          </div>
          
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-medium text-zinc-600 dark:text-zinc-300">
                  U{i}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">Học viên {i}</p>
                  <p className="text-xs text-zinc-500 truncate">user{i}@example.com</p>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-600 font-medium">Vừa xong</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
