// Trang/giao diện: Triển khai trang quản lý nội dung chính sách (route: /admin/system/policies).
import React, { useMemo, useState } from 'react';
import { AlertCircle, FileText, Loader2, Pencil, Plus, RefreshCw, Save, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Policy, PolicyInput } from '@/types/admin.types';
import { useAdminPolicies, useDeletePolicy, useSavePolicy, useSetPolicyStatus } from '@/hooks/usePolicies';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

const EMPTY_CONTENT = '<p></p>';
const inputClass = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
const stripRichText = (value: string) => value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const slugify = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 180);

type FormErrors = Partial<Record<'title' | 'slug' | 'summary' | 'content', string>>;

function PolicyFormDialog({ open, onOpenChange, initial, saving, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Policy;
  saving: boolean;
  onSave: (payload: PolicyInput) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    summary: initial?.summary || '',
    content: initial?.content || EMPTY_CONTENT,
    isActive: initial?.isActive ?? true,
  });
  const [manualSlug, setManualSlug] = useState(Boolean(initial?.slug));
  const [errors, setErrors] = useState<FormErrors>({});

  const updateTitle = (title: string) => {
    setForm((old) => ({ ...old, title, slug: manualSlug ? old.slug : slugify(title) }));
  };

  const submit = async () => {
    const nextErrors: FormErrors = {};
    const title = form.title.trim();
    const slug = slugify(form.slug || title);
    const summary = form.summary.trim();
    const content = form.content.trim();

    if (!title) nextErrors.title = 'Vui lòng nhập tiêu đề chính sách.';
    if (title.length > 160) nextErrors.title = 'Tiêu đề không được vượt quá 160 ký tự.';
    if (!slug) nextErrors.slug = 'Đường dẫn không hợp lệ, vui lòng kiểm tra lại.';
    if (summary.length > 300) nextErrors.summary = 'Mô tả ngắn không được vượt quá 300 ký tự.';
    if (!stripRichText(content)) nextErrors.content = 'Vui lòng nhập nội dung chi tiết của chính sách.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSave({ title, slug, summary, content, isActive: form.isActive });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? 'Chỉnh sửa chính sách' : 'Thêm chính sách mới'}</DialogTitle></DialogHeader>
        <div className="grid gap-5 py-2 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div>
              <label htmlFor="policy-title" className="mb-1.5 block text-sm font-medium">Tiêu đề <span className="text-red-500">*</span></label>
              <Input id="policy-title" maxLength={160} className={inputClass} value={form.title} onChange={(event) => updateTitle(event.target.value)} />
              <div className="mt-1 flex justify-between text-xs"><span className="text-red-500">{errors.title}</span><span className="text-zinc-400">{form.title.length}/160</span></div>
            </div>
            <div>
              <label htmlFor="policy-slug" className="mb-1.5 block text-sm font-medium">Đường dẫn URL</label>
              <Input id="policy-slug" className={inputClass} value={form.slug} onChange={(event) => { setManualSlug(true); setForm((old) => ({ ...old, slug: slugify(event.target.value) })); }} placeholder="chinh-sach-hoan-tien" />
              {errors.slug ? <p className="mt-1 text-xs text-red-500">{errors.slug}</p> : <p className="mt-1 text-xs text-zinc-400">Tự động tạo từ tiêu đề, dùng làm liên kết truy cập chính sách trên website.</p>}
            </div>
            <div>
              <label htmlFor="policy-summary" className="mb-1.5 block text-sm font-medium">Mô tả ngắn</label>
              <textarea id="policy-summary" maxLength={300} rows={3} className={inputClass} value={form.summary} onChange={(event) => setForm((old) => ({ ...old, summary: event.target.value }))} placeholder="Mô tả tóm tắt nội dung chính sách để người dùng dễ hiểu trước khi đọc chi tiết." />
              <div className="mt-1 flex justify-between text-xs"><span className="text-red-500">{errors.summary}</span><span className="text-zinc-400">{form.summary.length}/300</span></div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Nội dung chi tiết <span className="text-red-500">*</span></label>
                {errors.content && <span className="text-xs text-red-500">{errors.content}</span>}
              </div>
              <RichTextEditor value={form.content} onChange={(content) => setForm((old) => ({ ...old, content }))} minHeight="340px" maxHeight="460px" placeholder="Nhập nội dung chi tiết của chính sách..." disabled={saving} />
            </div>
          </div>
          <aside className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span>
                <span className="block font-medium">Công khai trên website</span>
                <span className="text-xs text-zinc-500">Bật để người dùng có thể xem chính sách này.</span>
              </span>
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((old) => ({ ...old, isActive: event.target.checked }))} className="h-5 w-5 accent-primary" />
            </label>
            <div className="rounded-xl border border-dashed border-zinc-300 p-3 text-xs leading-5 text-zinc-500 dark:border-zinc-700">
              Bạn có thể sử dụng định dạng văn bản như tiêu đề, danh sách, in đậm, căn lề để trình bày nội dung chính sách rõ ràng hơn.
            </div>
          </aside>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {initial ? 'Lưu thay đổi' : 'Tạo chính sách'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const PolicyManager: React.FC = () => {
  const query = useAdminPolicies();
  const save = useSavePolicy();
  const toggle = useSetPolicyStatus();
  const remove = useDeletePolicy();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Policy>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const policies = useMemo(() => query.data || [], [query.data]);
  const filteredPolicies = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return policies;
    return policies.filter((policy) => [policy.title, policy.slug, policy.summary, stripRichText(policy.content)].some((value) => value.toLowerCase().includes(keyword)));
  }, [policies, search]);

  const showError = (error: unknown) => toast.error(error instanceof Error ? error.message : 'Không thể thực hiện thao tác.');
  const activeCount = policies.filter((item) => item.isActive).length;

  if (query.isLoading) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="ml-3 text-sm text-zinc-500">Đang tải danh sách chính sách...</span></div>;
  if (query.isError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" /><h2 className="font-semibold">Không thể tải danh sách chính sách</h2>
    <p className="my-2 text-sm text-zinc-500">{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Thử lại</Button>
  </div>;

  return <div className="w-full space-y-6">
    {dialogOpen && <PolicyFormDialog key={editItem?._id || 'new'} open={dialogOpen} onOpenChange={setDialogOpen} initial={editItem} saving={save.isPending}
      onSave={async (payload) => { try { await save.mutateAsync({ id: editItem?._id, payload }); toast.success(editItem ? 'Đã lưu thay đổi chính sách thành công.' : 'Đã tạo chính sách mới thành công.'); setDialogOpen(false); } catch (error) { showError(error); } }} />}
    <ConfirmDialog open={deleteId !== null} onOpenChange={(value) => !value && setDeleteId(null)}
      title="Xác nhận xóa chính sách" description="Chính sách này sẽ bị xóa vĩnh viễn và không thể khôi phục. Nếu bạn chỉ muốn tạm ẩn, hãy tắt hiển thị thay vì xóa." confirmText={remove.isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'} isDestructive isPending={remove.isPending}
      onConfirm={async () => { if (!deleteId) return; try { await remove.mutateAsync(deleteId); toast.success('Đã xóa chính sách thành công.'); setDeleteId(null); } catch (error) { showError(error); } }} />

    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="mb-1 text-3xl font-bold text-zinc-900 dark:text-white">Quản lý chính sách</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Tạo và quản lý các chính sách hiển thị trên website để người dùng tra cứu.</p></div>
      <Button onClick={() => { setEditItem(undefined); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Tạo chính sách</Button>
    </div>

    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input className="h-11 rounded-xl pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm chính sách..." />
    </div>

    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-1 border-b p-4 text-sm text-zinc-500 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <span>Tổng cộng {policies.length} chính sách · {activeCount} đang công khai</span>
        <span className="text-xs">Hiển thị {filteredPolicies.length} kết quả</span>
      </div>
      {!filteredPolicies.length ? <div className="p-12 text-center"><FileText className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
        <h2 className="font-semibold">Không tìm thấy chính sách nào</h2><p className="mt-1 text-sm text-zinc-500">Hãy tạo chính sách mới hoặc thay đổi từ khóa tìm kiếm.</p></div>
      : <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{filteredPolicies.map((policy) => (
        <div key={policy._id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{policy.title}</p>
              <Badge variant="secondary" className={`rounded-full ${policy.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>{policy.isActive ? 'Đang công khai' : 'Đã ẩn'}</Badge>
            </div>
            <p className="mt-1 truncate text-xs text-primary">/{policy.slug}</p>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{policy.summary || stripRichText(policy.content) || 'Chưa có mô tả.'}</p>
            <p className="mt-2 text-xs text-zinc-400">Cập nhật lần cuối: {new Date(policy.updatedAt).toLocaleString('vi-VN')}</p>
          </div>
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center justify-end gap-1">
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={toggle.isPending} onClick={async () => { try { await toggle.mutateAsync({ id: policy._id, isActive: !policy.isActive }); toast.success(policy.isActive ? 'Đã ẩn chính sách khỏi website.' : 'Đã công khai chính sách trên website.'); } catch (error) { showError(error); } }} aria-label={policy.isActive ? 'Ẩn khỏi website' : 'Công khai trên website'}>{policy.isActive ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-zinc-400" />}</Button>
              </TooltipTrigger><TooltipContent>{policy.isActive ? 'Ẩn khỏi website' : 'Công khai trên website'}</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => { setEditItem(policy); setDialogOpen(true); }} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10" aria-label="Chỉnh sửa chính sách"><Pencil className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Chỉnh sửa</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={remove.isPending} onClick={() => setDeleteId(policy._id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" aria-label="Xóa chính sách"><Trash2 className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Xóa</TooltipContent></Tooltip>
            </div>
          </TooltipProvider>
        </div>
      ))}</div>}
    </div>
  </div>;
};
