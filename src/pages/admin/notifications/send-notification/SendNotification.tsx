import { useEffect, useMemo, useRef, useState } from 'react';
import { Code2, Eye, Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { notificationApi } from '@/services/notificationApi';
import type { Campaign, CampaignInput, NotificationChannel } from '@/types/notification.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const audiences: Array<{ id: CampaignInput['audience']; label: string }> = [
  { id: 'ALL_LEARNERS', label: 'Tất cả người học' }, { id: 'ALL_INSTRUCTORS', label: 'Tất cả giảng viên' },
  { id: 'ALL_ADMINS', label: 'Tất cả admin' }, { id: 'ALL_USERS', label: 'Toàn hệ thống' },
  { id: 'SPECIFIC_USER', label: 'Một người dùng' }, { id: 'COURSE_STUDENTS', label: 'Học viên khóa học' },
];
const baseVariables = [
  { key: 'userName', token: '{{userName}}', label: 'Tên người nhận', sample: 'Nguyễn Văn A' },
  { key: 'userEmail', token: '{{userEmail}}', label: 'Email người nhận', sample: 'nguyenvana@example.com' },
];
const extractVariables = (value: string) => Array.from(value.matchAll(/{{\s*([A-Za-z][\w]*)\s*}}/g), match => match[1]);

const campaignStatusLabels: Record<string, string> = {
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  PARTIAL: 'Hoàn thành một phần',
  FAILED: 'Thất bại',
};

const CampaignHistory = () => {
  const [items, setItems] = useState<Campaign[]>([]);
  const load = () => notificationApi.listCampaigns().then(data => setItems(data.items)).catch(() => undefined);
  useEffect(() => { void load(); const timer = window.setInterval(load, 10000); return () => window.clearInterval(timer); }, []);
  return (
    <section className="rounded-3xl border bg-background p-6">
      <h2 className="text-lg font-bold">Lịch sử gửi</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có chiến dịch gửi nào.</p>
        ) : (
          items.map(item => (
            <div key={item._id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {campaignStatusLabels[item.status] || item.status} · {item.stats?.requested || 0} người · Lỗi gửi Email: {item.stats?.emailFailed || 0}
                </p>
              </div>
              {['PARTIAL', 'FAILED'].includes(item.status) && (
                <Button variant="outline" onClick={async () => { await notificationApi.retryCampaign(item._id); void load(); }}>
                  Gửi lại thư lỗi
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export const SendNotification = () => {
  const [audience, setAudience] = useState<CampaignInput['audience']>('ALL_LEARNERS');
  const [email, setEmail] = useState(''); const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState(''); const [content, setContent] = useState('');
  const [channels, setChannels] = useState<NotificationChannel[]>(['EMAIL', 'IN_APP']);
  const [sending, setSending] = useState(false); const [activeField, setActiveField] = useState<'title' | 'content'>('content');
  const titleRef = useRef<HTMLInputElement>(null); const contentRef = useRef<HTMLTextAreaElement>(null);

  const variables = useMemo(() => audience === 'COURSE_STUDENTS'
    ? [...baseVariables, { key: 'courseId', token: '{{courseId}}', label: 'ID khóa học', sample: courseId || '6680f12ab34cd56ef7890123' }]
    : baseVariables, [audience, courseId]);
  const allowedKeys = new Set(variables.map(variable => variable.key));
  const invalidVariables = [...new Set([...extractVariables(title), ...extractVariables(content)].filter(variable => !allowedKeys.has(variable)))];
  const samples = Object.fromEntries(variables.map(variable => [variable.key, variable.sample]));
  const preview = (value: string) => value.replace(/{{\s*([A-Za-z][\w]*)\s*}}/g, (token, key) => samples[key] ?? token);

  const toggleChannel = (channel: NotificationChannel) => setChannels(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel]);
  const insertVariable = (token: string) => {
    const isTitle = activeField === 'title'; const element = isTitle ? titleRef.current : contentRef.current;
    const current = isTitle ? title : content; const start = element?.selectionStart ?? current.length; const end = element?.selectionEnd ?? start;
    const next = current.slice(0, start) + token + current.slice(end);
    if (isTitle) {
      setTitle(next);
    } else {
      setContent(next);
    }
    window.setTimeout(() => { element?.focus(); element?.setSelectionRange(start + token.length, start + token.length); }, 0);
  };

  const send = async () => {
    if (!title.trim() || !content.trim() || !channels.length) return toast.error('Vui lòng nhập nội dung và chọn kênh gửi.');
    if (audience === 'SPECIFIC_USER' && !email) return toast.error('Vui lòng nhập email.');
    if (audience === 'COURSE_STUDENTS' && !courseId) return toast.error('Vui lòng nhập ID khóa học.');
    if (invalidVariables.length) return toast.error(`Biến không hợp lệ: ${invalidVariables.map(variable => `{{${variable}}}`).join(', ')}`);
    setSending(true);
      try {
        await notificationApi.sendCampaign({ audience, specificEmail: audience === 'SPECIFIC_USER' ? email : undefined, courseId: audience === 'COURSE_STUDENTS' ? courseId : undefined, title, content, channels });
        toast.success('Chiến dịch đã được đưa vào hàng đợi.'); setTitle(''); setContent('');
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể tạo chiến dịch gửi.'); }
      finally { setSending(false); }
    };
  
    return <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-3xl font-bold">Gửi thông báo</h1><p className="text-muted-foreground">Gửi qua Email hoặc Thông báo web theo nhóm người nhận.</p></div>
      <section className="space-y-6 rounded-3xl border bg-background p-6">
        <div><label className="mb-2 block text-sm font-medium">Đối tượng nhận</label><div className="flex flex-wrap gap-2">{audiences.map(item => <Button key={item.id} variant={audience === item.id ? 'default' : 'outline'} onClick={() => setAudience(item.id)}>{item.label}</Button>)}</div></div>
        {audience === 'SPECIFIC_USER' && <Input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email người nhận"/>}
        {audience === 'COURSE_STUDENTS' && <Input value={courseId} onChange={event => setCourseId(event.target.value)} placeholder="Mã định danh khóa học (ID)"/>}
        <div className="flex gap-4"><label className="flex gap-2"><input type="checkbox" checked={channels.includes('EMAIL')} onChange={() => toggleChannel('EMAIL')}/><Mail className="h-4 w-4"/>Email</label><label className="flex gap-2"><input type="checkbox" checked={channels.includes('IN_APP')} onChange={() => toggleChannel('IN_APP')}/><MessageSquare className="h-4 w-4"/>Thông báo web</label></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4"><Input ref={titleRef} value={title} onFocus={() => setActiveField('title')} onChange={event => setTitle(event.target.value)} placeholder="Tiêu đề"/><textarea ref={contentRef} onFocus={() => setActiveField('content')} className="min-h-40 w-full rounded-xl border bg-background p-3" value={content} onChange={event => setContent(event.target.value)} placeholder="Nội dung thông báo"/>
          {invalidVariables.length > 0 && <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">Biến không hợp lệ: {invalidVariables.map(variable => `{{${variable}}}`).join(', ')}. Vui lòng xóa hoặc dùng biến trong danh sách bên cạnh.</div>}
        </div>
        <aside className="space-y-4 rounded-2xl border bg-muted/30 p-4"><div><h3 className="flex items-center gap-2 font-semibold"><Code2 className="h-4 w-4"/>Biến nội dung khả dụng</h3><p className="mt-1 text-xs text-muted-foreground">Nhấn để chèn vào {activeField === 'title' ? 'tiêu đề' : 'nội dung'}. Hệ thống sẽ từ chối mọi biến ngoài danh sách.</p></div><div className="space-y-2">{variables.map(variable => <button key={variable.key} type="button" onClick={() => insertVariable(variable.token)} className="block w-full rounded-xl border bg-background p-2 text-left hover:border-primary"><code className="text-xs font-semibold text-primary">{variable.token}</code><span className="mt-1 block text-[11px] text-muted-foreground">{variable.label} · VD: {variable.sample}</span></button>)}</div></aside>
      </div>
      <div className="rounded-2xl border bg-muted/20 p-4"><h3 className="flex items-center gap-2 font-semibold"><Eye className="h-4 w-4"/>Xem trước với dữ liệu mẫu</h3><p className="mt-3 font-semibold">{preview(title) || 'Tiêu đề sẽ hiển thị ở đây'}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{preview(content) || 'Nội dung sẽ hiển thị ở đây'}</p></div>
      <div className="flex justify-end"><Button disabled={sending || invalidVariables.length > 0} onClick={() => void send()}><Send className="mr-2 h-4 w-4"/>{sending ? 'Đang tạo...' : 'Gửi thông báo'}</Button></div>
    </section><CampaignHistory/></div>;
};