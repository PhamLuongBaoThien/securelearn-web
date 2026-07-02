import { useState } from 'react';
import { Flag } from 'lucide-react';
import { inboxApi } from '@/services/inboxApi';
import type { ReportTargetType } from '@/types/inbox.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function ReportDialog({ targetType, targetId, courseId, label = 'Báo cáo' }: { targetType: ReportTargetType; targetId: string; courseId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!title.trim() || !description.trim()) return toast.error('Nhập lý do và mô tả báo cáo.');
    setBusy(true);
    try {
      await inboxApi.create({ type: 'REPORT', title, description, target: { type: targetType, id: targetId, courseId } });
      toast.success('Đã gửi báo cáo tới đội ngũ quản trị.');
      setOpen(false);
      setTitle('');
      setDescription('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi báo cáo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={label}
              onClick={(event) => { event.stopPropagation(); setOpen(true); }}
              className="h-8 w-8 shrink-0 rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-xl font-bold">{label}</h2>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Lý do báo cáo" />
            <textarea className="min-h-32 w-full rounded-lg border bg-transparent p-3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả chi tiết vấn đề..." />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button disabled={busy} onClick={send}>{busy ? 'Đang gửi...' : 'Gửi báo cáo'}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
