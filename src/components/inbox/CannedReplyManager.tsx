import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inboxApi } from '@/services/inboxApi';
import type { CannedReply, TicketType } from '@/types/inbox.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export function CannedReplyManager({ ticketType, onInsert }: { ticketType: TicketType; onInsert: (content: string) => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CannedReply | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<TicketType | ''>('');
  const { data } = useQuery({ queryKey: ['inboxCannedReplies', ticketType], queryFn: () => inboxApi.cannedReplies({ type: ticketType, active: true }) });
  const reset = () => { setEditing(null); setTitle(''); setContent(''); setType(''); };
  const save = useMutation({
    mutationFn: () => editing
      ? inboxApi.updateCannedReply(editing._id, { title, content, ticketType: type || null })
      : inboxApi.createCannedReply({ title, content, ticketType: type || null }),
    onSuccess: () => { toast.success('Đã lưu mẫu trả lời.'); reset(); void queryClient.invalidateQueries({ queryKey: ['inboxCannedReplies'] }); },
    onError: () => toast.error('Không thể lưu mẫu trả lời.'),
  });
  const remove = async (id: string) => {
    if (!window.confirm('Xóa mẫu trả lời này?')) return;
    await inboxApi.deleteCannedReply(id);
    void queryClient.invalidateQueries({ queryKey: ['inboxCannedReplies'] });
  };
  return <div className="space-y-2">
    <div className="flex gap-2">
      <Select value="" onChange={event => { const item = data?.items.find(row => row._id === event.target.value); if (item) onInsert(item.content); }}>
        <option value="">Chèn câu trả lời mẫu…</option>
        {data?.items.map(item => <option key={item._id} value={item._id}>{item.title}</option>)}
      </Select>
      <Button type="button" variant="outline" onClick={() => setOpen(value => !value)}>Quản lý mẫu</Button>
    </div>
    {open && <div className="space-y-2 rounded-xl border p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Tên mẫu" />
        <Select value={type} onChange={event => setType(event.target.value as TicketType | '')}><option value="">Mọi loại ticket</option><option value="REPORT">Báo cáo</option><option value="SUPPORT">Hỗ trợ</option><option value="FEEDBACK">Góp ý</option></Select>
      </div>
      <textarea className="min-h-20 w-full rounded-lg border bg-transparent p-2 text-sm" value={content} onChange={event => setContent(event.target.value)} placeholder="Nội dung mẫu" />
      <Button type="button" disabled={!title.trim() || !content.trim() || save.isPending} onClick={() => save.mutate()}>Lưu mẫu</Button>
      <div className="divide-y">{data?.items.map(item => <div key={item._id} className="flex items-center justify-between py-2 text-sm"><button type="button" className="text-left" onClick={() => { setEditing(item); setTitle(item.title); setContent(item.content); setType(item.ticketType || ''); }}>{item.title}</button><Button type="button" variant="ghost" onClick={() => void remove(item._id)}>Xóa</Button></div>)}</div>
    </div>}
  </div>;
}
