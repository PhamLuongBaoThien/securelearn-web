// ========================
// Instructor Communication: Tương tác & Thông báo Lớp học
// Soạn thông báo, lịch sử gửi, quick templates.
// ========================
import React, { useState } from 'react';
import {
  Send,
  Mail,
  Bell,
  MessageSquare,
  Users,
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  BarChart2,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ===== Mock Data =====
const SENT_HISTORY = [
  {
    id: '1',
    title: 'Chào mừng học viên mới khóa React Masterclass!',
    channel: ['Email', 'Push'],
    recipients: 24,
    opened: 18,
    course: 'React Masterclass 2024',
    sentAt: '2026-04-21 09:00',
  },
  {
    id: '2',
    title: 'Nhắc nhở: Bài tập Redux chương 3 sắp hết hạn',
    channel: ['Push'],
    recipients: 142,
    opened: 98,
    course: 'React Masterclass 2024',
    sentAt: '2026-04-20 15:30',
  },
  {
    id: '3',
    title: 'Bài giảng mới: Docker Compose thực hành',
    channel: ['Email', 'Push', 'SMS'],
    recipients: 87,
    opened: 71,
    course: 'DevOps Fundamentals',
    sentAt: '2026-04-19 10:00',
  },
  {
    id: '4',
    title: 'Cập nhật giáo trình — Thêm 3 bài giảng mới',
    channel: ['Email'],
    recipients: 203,
    opened: 145,
    course: 'Python Advanced',
    sentAt: '2026-04-18 08:00',
  },
];

const QUICK_TEMPLATES = [
  {
    id: 't1',
    icon: '👋',
    label: 'Chào mừng học viên',
    preview: 'Chào mừng bạn đến với khóa học! Hãy bắt đầu hành trình học tập ngay hôm nay...',
  },
  {
    id: 't2',
    icon: '⏰',
    label: 'Nhắc bài tập',
    preview: 'Bạn vẫn chưa hoàn thành bài tập của chương [X]. Hãy dành 30 phút để hoàn thành nhé!',
  },
  {
    id: 't3',
    icon: '🎉',
    label: 'Thông báo nội dung mới',
    preview: 'Tin vui! Tôi vừa thêm [N] bài giảng mới vào khóa học. Hãy kiểm tra ngày hôm nay!',
  },
  {
    id: 't4',
    icon: '🏆',
    label: 'Chúc mừng hoàn thành',
    preview: 'Chúc mừng bạn đã hoàn thành khóa học! Đừng quên để lại đánh giá nhé!',
  },
];

const channelConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Email: { label: 'Email', icon: <Mail className="w-3 h-3" />, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  Push: { label: 'Push', icon: <Bell className="w-3 h-3" />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  SMS: { label: 'SMS', icon: <Smartphone className="w-3 h-3" />, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

export const InstructorCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(['Push']));
  const [audience, setAudience] = useState<'all' | 'course' | 'incomplete'>('all');
  const [selectedCourse, setSelectedCourse] = useState('all');

  const totalRecipients = audience === 'all' ? 432 : audience === 'incomplete' ? 156 : 142;
  const openRate = Math.round(
    (SENT_HISTORY.reduce((s, h) => s + h.opened, 0) / SENT_HISTORY.reduce((s, h) => s + h.recipients, 0)) * 100
  );

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        if (next.size > 1) next.delete(ch);
        else toast.error('Phải chọn ít nhất 1 kênh gửi.');
      } else {
        next.add(ch);
      }
      return next;
    });
  };

  const handleSend = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung thông báo.');
      return;
    }
    toast.success(`Đã gửi thông báo đến ${totalRecipients} học viên!`);
    setTitle('');
    setContent('');
  };

  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setTitle(t.label);
    setContent(t.preview);
    toast.success(`Đã áp dụng mẫu "${t.label}"`);
  };

  const TABS = [
    { key: 'compose', label: 'Soạn thông báo', icon: <Send className="w-4 h-4" /> },
    { key: 'history', label: 'Lịch sử gửi', icon: <Clock className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Thông báo Lớp học
          </h1>
          <p className="text-muted-foreground mt-2">
            Gửi Email, Push Notification hoặc SMS đến học viên qua Notification Service.
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng học viên', value: '432', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Thông báo đã gửi', value: SENT_HISTORY.length, icon: <Send className="w-5 h-5" />, color: 'bg-green-500/10 text-green-600' },
          { label: 'Tỷ lệ mở TB', value: `${openRate}%`, icon: <BarChart2 className="w-5 h-5" />, color: 'bg-purple-500/10 text-purple-600' },
          { label: 'Tổng người nhận', value: SENT_HISTORY.reduce((s, h) => s + h.recipients, 0), icon: <MessageSquare className="w-5 h-5" />, color: 'bg-orange-500/10 text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Compose */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Audience */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-white">Đối tượng nhận</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([
                  { key: 'all', label: 'Tất cả học viên', sub: '432 người', icon: <Users className="w-4 h-4" /> },
                  { key: 'course', label: 'Theo khóa học', sub: '142 người', icon: <BookOpen className="w-4 h-4" /> },
                  { key: 'incomplete', label: 'Chưa hoàn thành', sub: '156 người', icon: <Clock className="w-4 h-4" /> },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setAudience(opt.key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                      audience === opt.key
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-primary/40'
                    }`}
                  >
                    {opt.icon}
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs opacity-70">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              {audience === 'course' && (
                <div className="relative">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full h-11 px-3 pr-8 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="all">-- Chọn khóa học --</option>
                    <option value="react">React Masterclass 2024</option>
                    <option value="devops">DevOps Fundamentals</option>
                    <option value="python">Python Advanced</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Channel */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-zinc-900 dark:text-white">Kênh gửi</h3>
              <div className="flex gap-3 flex-wrap">
                {(['Email', 'Push', 'SMS'] as const).map((ch) => {
                  const cfg = channelConfig[ch];
                  const active = selectedChannels.has(ch);
                  return (
                    <button
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        active
                          ? `${cfg.color} border`
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-primary/30'
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                      {active && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-white">Nội dung thông báo</h3>
              <div>
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Tiêu đề</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thông báo..."
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Nội dung</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Nhập nội dung thông báo gửi đến học viên..."
                  className="w-full p-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
                />
                <p className="text-xs text-zinc-400 mt-1">{content.length} ký tự</p>
              </div>

              {/* Summary & Send */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-zinc-500">
                  Gửi đến <span className="font-semibold text-zinc-900 dark:text-white">{totalRecipients}</span> học viên qua{' '}
                  <span className="font-semibold text-zinc-900 dark:text-white">{Array.from(selectedChannels).join(', ')}</span>
                </div>
                <Button onClick={handleSend} className="gap-2 rounded-xl px-6">
                  <Send className="w-4 h-4" /> Gửi ngay
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Templates Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Mẫu nhanh</h3>
              </div>
              <div className="space-y-3">
                {QUICK_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">{t.label}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{t.preview}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium text-zinc-500">Thông báo</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-500 hidden md:table-cell">Khóa học</th>
                  <th className="text-center py-3 px-4 font-medium text-zinc-500">Kênh</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500 hidden sm:table-cell">Người nhận</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500 hidden lg:table-cell">Tỷ lệ mở</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500 hidden lg:table-cell">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {SENT_HISTORY.map((item) => {
                  const rate = Math.round((item.opened / item.recipients) * 100);
                  return (
                    <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-zinc-900 dark:text-white line-clamp-1 max-w-[260px]">{item.title}</p>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-1 max-w-[160px] text-xs">{item.course}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {item.channel.map((ch) => {
                            const cfg = channelConfig[ch];
                            return (
                              <Badge key={ch} className={`flex items-center gap-0.5 text-[10px] border ${cfg.color}`}>
                                {cfg.icon} {ch}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300 font-medium hidden sm:table-cell">
                        {item.recipients}
                      </td>
                      <td className="py-3 px-4 text-right hidden lg:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-10 text-left">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-zinc-400 hidden lg:table-cell whitespace-nowrap">
                        {item.sentAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
