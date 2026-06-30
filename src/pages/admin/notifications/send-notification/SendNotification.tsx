import React, { useState } from 'react';
import { Send, Users, User, Mail, MessageSquare } from 'lucide-react';
import { notificationApi } from '@/services/notificationApi';
import type { NotificationChannel } from '@/types/notification.types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type TargetType = 'ALL_STUDENTS' | 'ALL_INSTRUCTORS' | 'ALL_USERS' | 'SPECIFIC_USER';

export const SendNotification: React.FC = () => {
  const [targetType, setTargetType] = useState<TargetType>('ALL_STUDENTS');
  const [specificEmail, setSpecificEmail] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [methods, setMethods] = useState({ email: true, inApp: true });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (targetType === 'SPECIFIC_USER' && !specificEmail) {
      toast.error('Vui lòng nhập email người nhận.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error('Tiêu đề và nội dung không được để trống.');
      return;
    }
    if (!methods.email && !methods.inApp) {
      toast.error('Vui lòng chọn ít nhất một phương thức gửi.');
      return;
    }

    setSending(true);
    const channels: NotificationChannel[] = [];
    if (methods.email) channels.push('EMAIL');
    if (methods.inApp) channels.push('IN_APP');
    try {
      await notificationApi.sendCampaign({ audience: targetType, specificEmail: targetType === 'SPECIFIC_USER' ? specificEmail : undefined, title, content, channels });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi thông báo.');
      setSending(false);
      return;
    }
    setSending(false);
    toast.success('Gửi thông báo thành công.');
    
    // Reset form
    setTitle('');
    setContent('');
    setSpecificEmail('');
  };

  const inputCls = "w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
  const labelCls = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5";

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Gửi thông báo</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Gửi email hoặc thông báo trực tiếp đến học viên và giảng viên.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Đối tượng nhận */}
        <div>
          <label className={labelCls}>Đối tượng nhận</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'ALL_STUDENTS', label: 'Tất cả Học viên', icon: <Users className="w-4 h-4" /> },
              { id: 'ALL_INSTRUCTORS', label: 'Tất cả Giảng viên', icon: <Users className="w-4 h-4" /> },
              { id: 'ALL_USERS', label: 'Toàn hệ thống', icon: <Users className="w-4 h-4" /> },
              { id: 'SPECIFIC_USER', label: 'Cá nhân', icon: <User className="w-4 h-4" /> },
            ].map((t) => (
              <Button
                key={t.id}
                onClick={() => setTargetType(t.id as TargetType)}
                variant="outline"
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                  targetType === t.id 
                    ? 'border-primary bg-primary/5 text-primary font-semibold' 
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {t.icon}
                <span className="text-sm">{t.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {targetType === 'SPECIFIC_USER' && (
          <div>
            <label className={labelCls}>Email người nhận</label>
            <Input 
              type="email" 
              className={inputCls} 
              placeholder="nguyenvana@gmail.com" 
              value={specificEmail}
              onChange={(e) => setSpecificEmail(e.target.value)}
            />
          </div>
        )}

        {/* Phương thức gửi */}
        <div>
          <label className={labelCls}>Phương thức gửi</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary" checked={methods.email} onChange={(e) => setMethods({...methods, email: e.target.checked})} />
              <span className="text-sm flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"><Mail className="w-4 h-4" /> Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary" checked={methods.inApp} onChange={(e) => setMethods({...methods, inApp: e.target.checked})} />
              <span className="text-sm flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"><MessageSquare className="w-4 h-4" /> In-App</span>
            </label>
          </div>
        </div>

        {/* Nội dung */}
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Tiêu đề</label>
            <Input 
              className={inputCls} 
              placeholder="Nhập tiêu đề thông báo..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Nội dung</label>
            <textarea 
              className={`${inputCls} resize-none min-h-[150px]`} 
              placeholder="Nhập nội dung chi tiết..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <p className="text-xs text-zinc-500 mt-2">Hỗ trợ các biến: {'{{userName}}'}, {'{{userEmail}}'}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang gửi...</>
            ) : (
              <><Send className="w-4 h-4" /> Gửi thông báo</>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};
