import React, { useState } from 'react';
import { Search, Inbox as InboxIcon, CheckCircle2, MessageSquare, AlertTriangle, HelpCircle } from 'lucide-react';

type MsgType = 'ALL' | 'REPORT' | 'SUPPORT' | 'FEEDBACK';

const MOCK_MESSAGES = [
  { id: 1, sender: 'Nguyễn Văn A', email: 'nva@gmail.com', role: 'STUDENT', type: 'SUPPORT', title: 'Hỗ trợ thanh toán', content: 'Tôi đã chuyển khoản nhưng tài khoản chưa được kích hoạt khóa học.', time: '10 phút trước', read: false },
  { id: 2, sender: 'Trần Thị B', email: 'ttb@gmail.com', role: 'INSTRUCTOR', type: 'REPORT', title: 'Báo cáo vi phạm bản quyền', content: 'Video của tôi bị một giảng viên khác reup trên hệ thống.', time: '1 giờ trước', read: false },
  { id: 3, sender: 'Lê Văn C', email: 'lvc@gmail.com', role: 'STUDENT', type: 'FEEDBACK', title: 'Góp ý giao diện', content: 'Giao diện học tập trên mobile hơi khó nhìn, mong admin cải thiện.', time: '2 ngày trước', read: true },
  { id: 4, sender: 'Phạm Thị D', email: 'ptd@gmail.com', role: 'INSTRUCTOR', type: 'SUPPORT', title: 'Lỗi upload video', content: 'Hệ thống báo lỗi khi tôi tải lên video 2GB.', time: '3 ngày trước', read: true },
];

const TYPE_CONFIG = {
  SUPPORT: { icon: <HelpCircle className="w-4 h-4" />, label: 'Hỗ trợ', color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/10' },
  REPORT: { icon: <AlertTriangle className="w-4 h-4" />, label: 'Báo cáo', color: 'text-amber-500 bg-amber-100 dark:bg-amber-500/10' },
  FEEDBACK: { icon: <MessageSquare className="w-4 h-4" />, label: 'Góp ý', color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10' },
};

export const Inbox: React.FC = () => {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [filterType, setFilterType] = useState<MsgType>('ALL');
  const [search, setSearch] = useState('');

  const filtered = messages.filter(m => {
    const matchType = filterType === 'ALL' || m.type === filterType;
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.sender.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  const markAsRead = (id: number) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const markAllAsRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Hộp thư đến</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Quản lý tin nhắn, báo cáo và yêu cầu hỗ trợ từ người dùng.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-primary" /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Left Panel: Filters */}
        <div className="w-full sm:w-64 shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Tìm kiếm tin nhắn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            {[
              { id: 'ALL', label: 'Tất cả tin nhắn', icon: <InboxIcon className="w-4 h-4" /> },
              { id: 'SUPPORT', label: 'Hỗ trợ', icon: TYPE_CONFIG.SUPPORT.icon },
              { id: 'REPORT', label: 'Báo cáo vi phạm', icon: TYPE_CONFIG.REPORT.icon },
              { id: 'FEEDBACK', label: 'Góp ý', icon: TYPE_CONFIG.FEEDBACK.icon },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as MsgType)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 ${
                  filterType === f.id 
                    ? 'bg-primary/5 text-primary font-medium' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Message List */}
        <div className="flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
              <InboxIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-zinc-500">Hộp thư trống.</p>
            </div>
          ) : (
            filtered.map(m => {
              const config = TYPE_CONFIG[m.type as keyof typeof TYPE_CONFIG];
              return (
                <div 
                  key={m.id}
                  onClick={() => markAsRead(m.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                    m.read 
                      ? 'bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800' 
                      : 'bg-white dark:bg-zinc-900 border-primary/30 shadow-sm'
                  }`}
                >
                  {!m.read && <span className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary" />}
                  
                  <div className="flex items-start gap-4 pr-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-zinc-900 dark:text-white text-sm">{m.sender}</span>
                        <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{m.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}</span>
                        <span className="text-xs text-zinc-400 ml-2">{m.time}</span>
                      </div>
                      <h3 className={`text-sm mb-1 ${m.read ? 'font-medium text-zinc-700 dark:text-zinc-300' : 'font-bold text-zinc-900 dark:text-white'}`}>{m.title}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
