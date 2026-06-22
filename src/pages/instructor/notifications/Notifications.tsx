// ========================
// Instructor Notifications: Thông báo từ Admin
// ========================
import React, { useState } from 'react';
import { Bell, ShieldCheck, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

type NotifType = 'all' | 'system' | 'policy' | 'alert';

const MOCK_NOTIFICATIONS = [
  {
    id: 1, type: 'policy' as const,
    title: 'Cập nhật chính sách phí nền tảng',
    body: 'Kể từ ngày 01/06/2026, tỷ lệ chia sẻ doanh thu sẽ được điều chỉnh từ 70/30 lên 75/25 cho giảng viên có rating trên 4.5. Vui lòng xem chi tiết trong trang Tài chính.',
    time: '2 giờ trước',
    read: false,
  },
  {
    id: 2, type: 'alert' as const,
    title: 'Khóa học cần bổ sung thông tin',
    body: 'Khóa học "TypeScript Toàn tập" thiếu mô tả chi tiết và hình ảnh quảng cáo. Vui lòng cập nhật để tăng tỷ lệ ghi danh.',
    time: '5 giờ trước',
    read: false,
  },
  {
    id: 3, type: 'system' as const,
    title: 'Hệ thống bảo trì định kỳ',
    body: 'SecureLearn sẽ tiến hành bảo trì hệ thống vào ngày 28/04/2026 từ 02:00–04:00 SA (GMT+7). Trong thời gian này, dịch vụ upload video sẽ tạm ngừng.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 4, type: 'system' as const,
    title: 'Tính năng mới: Rich Text Editor',
    body: 'Trang chỉnh sửa khóa học đã được nâng cấp với trình soạn thảo văn bản phong phú. Bạn có thể định dạng mô tả khóa học với heading, danh sách, in đậm/nghiêng, v.v.',
    time: '2 ngày trước',
    read: true,
  },
  {
    id: 5, type: 'policy' as const,
    title: 'Yêu cầu xác minh danh tính giảng viên',
    body: 'Để tuân thủ quy định mới, tất cả giảng viên cần hoàn thành xác minh danh tính trước ngày 15/05/2026. Vui lòng truy cập trang Hồ sơ để thực hiện.',
    time: '3 ngày trước',
    read: true,
  },
  {
    id: 6, type: 'alert' as const,
    title: 'Video đang bị báo cáo vi phạm bản quyền',
    body: 'Video bài học "Bài 4: Advanced Patterns" trong khóa "React Nâng cao" đã nhận được 2 báo cáo về bản quyền âm nhạc. Admin đang xem xét. Video sẽ bị ẩn trong 24h.',
    time: '4 ngày trước',
    read: true,
  },
];

const TYPE_CONFIG = {
  system:  { icon: <Info className="w-4 h-4" />,          label: 'Hệ thống',  bg: 'bg-blue-100 dark:bg-blue-500/20',   text: 'text-blue-600 dark:text-blue-400'   },
  policy:  { icon: <ShieldCheck className="w-4 h-4" />,   label: 'Chính sách', bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  alert:   { icon: <AlertTriangle className="w-4 h-4" />, label: 'Cảnh báo',  bg: 'bg-amber-100 dark:bg-amber-500/20',  text: 'text-amber-600 dark:text-amber-400'  },
};

export const InstructorNotifications: React.FC = () => {
  const [filter, setFilter] = useState<NotifType>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filtered = notifications.filter(n => filter === 'all' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Thông báo</h1>
          <p className="text-muted-foreground mt-1">Thông báo và cập nhật từ Admin SecureLearn.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-primary hover:underline flex items-center gap-1.5 shrink-0 mt-1">
            <CheckCircle2 className="w-4 h-4" /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'all'    as NotifType, label: `Tất cả (${notifications.length})` },
          { id: 'system' as NotifType, label: 'Hệ thống' },
          { id: 'policy' as NotifType, label: 'Chính sách' },
          { id: 'alert'  as NotifType, label: 'Cảnh báo' },
        ]).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/50'
            }`}
          >
            {f.label}
          </button>
        ))}

        {unreadCount > 0 && (
          <span className="ml-auto px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium flex items-center gap-1.5">
            <Bell className="w-4 h-4" /> {unreadCount} chưa đọc
          </span>
        )}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Không có thông báo nào.</p>
          </div>
        ) : filtered.map(n => {
          const cfg = TYPE_CONFIG[n.type];
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`relative bg-white dark:bg-zinc-900 border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${
                !n.read
                  ? 'border-primary/30 dark:border-primary/20 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {/* Unread dot */}
              {!n.read && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_theme('colors.primary.DEFAULT')]" />
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{n.time}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold mb-1 ${!n.read ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {n.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{n.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

