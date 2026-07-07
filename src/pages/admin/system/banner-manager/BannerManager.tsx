import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2,
  Pencil, Plus, RefreshCw, Save, ToggleLeft, ToggleRight, Trash2, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Banner, BannerInput } from '@/types/admin.types';
import {
  useAdminBanners, useDeleteBanner, useReorderBanners, useSaveBanner, useSetBannerStatus,
} from '@/hooks/useBanners';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ImageMode = 'upload' | 'url';
type FormErrors = Partial<Record<'title' | 'image' | 'linkUrl', string>>;
const inputClass = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

function validHttps(value: string) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function BannerFormDialog({
  open, onOpenChange, initial, saving, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Banner;
  saving: boolean;
  onSave: (payload: BannerInput) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: initial?.title || '', subtitle: initial?.subtitle || '',
    imageUrl: initial?.imageUrl || '', linkUrl: initial?.linkUrl || '',
  });
  const [mode, setMode] = useState<ImageMode>(initial ? 'url' : 'upload');
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState(initial?.imageUrl || '');
  const [errors, setErrors] = useState<FormErrors>({});
  const objectUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const selectFile = (next?: File) => {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
      setErrors((old) => ({ ...old, image: 'Chỉ hỗ trợ JPG, PNG hoặc WebP.' }));
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setErrors((old) => ({ ...old, image: 'Ảnh tối đa 5MB.' }));
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(next);
    objectUrlRef.current = objectUrl;
    setFile(next);
    setPreview(objectUrl);
    setErrors((old) => ({ ...old, image: undefined }));
  };

  const submit = async () => {
    const nextErrors: FormErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề banner.';
    const chosenUrl = form.imageUrl.trim();
    if (!file && !chosenUrl && !initial?.imageUrl) nextErrors.image = 'Vui lòng chọn file hoặc nhập URL ảnh.';
    if (mode === 'url' && chosenUrl && !validHttps(chosenUrl)) nextErrors.image = 'URL ảnh phải dùng HTTPS.';
    const link = form.linkUrl.trim();
    if (link && !(link.startsWith('/') && !link.startsWith('//')) && !validHttps(link)) {
      nextErrors.linkUrl = 'Dùng đường dẫn nội bộ bắt đầu bằng / hoặc URL HTTPS.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSave({
      title: form.title.trim(), subtitle: form.subtitle.trim(), linkUrl: link || undefined,
      image: mode === 'upload' ? file : undefined,
      imageUrl: mode === 'url' ? chosenUrl || initial?.imageUrl : initial?.imageUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label htmlFor="banner-title" className="mb-1.5 block text-sm font-medium">Tiêu đề <span className="text-red-500">*</span></label>
            <Input id="banner-title" maxLength={120} className={inputClass} value={form.title}
              onChange={(event) => setForm((old) => ({ ...old, title: event.target.value }))} />
            <div className="mt-1 flex justify-between text-xs"><span className="text-red-500">{errors.title}</span><span className="text-zinc-400">{form.title.length}/120</span></div>
          </div>
          <div>
            <label htmlFor="banner-subtitle" className="mb-1.5 block text-sm font-medium">Phụ đề</label>
            <textarea id="banner-subtitle" maxLength={240} rows={3} className={inputClass} value={form.subtitle}
              onChange={(event) => setForm((old) => ({ ...old, subtitle: event.target.value }))} />
            <p className="mt-1 text-right text-xs text-zinc-400">{form.subtitle.length}/240</p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Ảnh banner <span className="text-red-500">*</span></legend>
            <div className="mb-3 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
              {(['upload', 'url'] as ImageMode[]).map((item) => (
                <button key={item} type="button" onClick={() => { setMode(item); setPreview(item === 'url' ? form.imageUrl || initial?.imageUrl || '' : file ? preview : initial?.imageUrl || ''); }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === item ? 'bg-white text-primary shadow-sm dark:bg-zinc-700' : 'text-zinc-500'}`}>
                  {item === 'upload' ? 'Tải ảnh lên' : 'Dán URL ảnh'}
                </button>
              ))}
            </div>
            {mode === 'upload' ? (
              <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-zinc-300 p-6 text-center transition-colors hover:border-primary dark:border-zinc-700">
                <Upload className="mb-2 h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Chọn ảnh JPG, PNG hoặc WebP</span>
                <span className="mt-1 text-xs text-zinc-500">Khuyến nghị 1920×1080 (16:9), tối đa 5MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
              </label>
            ) : (
              <div><label htmlFor="banner-image-url" className="sr-only">URL ảnh HTTPS</label>
                <Input id="banner-image-url" className={inputClass} placeholder="https://..." value={form.imageUrl}
                  onChange={(event) => { setForm((old) => ({ ...old, imageUrl: event.target.value })); setPreview(event.target.value); }} /></div>
            )}
            {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
          </fieldset>
          {preview && <div className="aspect-video overflow-hidden rounded-2xl border bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
            <img key={preview} src={preview} alt="Xem trước banner" className="h-full w-full object-cover"
              onError={() => setErrors((old) => ({ ...old, image: 'Không thể tải ảnh xem trước.' }))} />
          </div>}
          <div>
            <label htmlFor="banner-link" className="mb-1.5 block text-sm font-medium">Liên kết CTA</label>
            <Input id="banner-link" className={inputClass} placeholder="/courses hoặc https://..." value={form.linkUrl}
              onChange={(event) => setForm((old) => ({ ...old, linkUrl: event.target.value }))} />
            {errors.linkUrl && <p className="mt-1 text-xs text-red-500">{errors.linkUrl}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {initial ? 'Cập nhật' : 'Thêm Banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortableRow({ id, disabled, children }: { id: string; disabled: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}
    className={`flex flex-col gap-3 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 sm:flex-row sm:items-center ${isDragging ? 'relative z-10 opacity-60 shadow-lg' : ''}`}>
    {children}
  </div>;
}
export const BannerManager: React.FC = () => {
  const query = useAdminBanners();
  const save = useSaveBanner();
  const toggle = useSetBannerStatus();
  const remove = useDeleteBanner();
  const reorder = useReorderBanners();
  const banners = useMemo(() => query.data || [], [query.data]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Banner>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const showError = (error: unknown) => toast.error(error instanceof Error ? error.message : 'Không thể thực hiện thao tác.');

  const move = async (fromId: string, toId: string) => {
    if (fromId === toId || reorder.isPending) return;
    const from = banners.findIndex((item) => item._id === fromId);
    const to = banners.findIndex((item) => item._id === toId);
    if (from < 0 || to < 0) return;
    const next = [...banners];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    try { await reorder.mutateAsync(next); toast.success('Đã cập nhật thứ tự banner.'); } catch (error) { showError(error); }
  };

  const step = (id: string, direction: -1 | 1) => {
    const index = banners.findIndex((item) => item._id === id);
    const target = banners[index + direction];
    if (target) void move(id, target._id);
  };

  if (query.isLoading) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="ml-3 text-sm text-zinc-500">Đang tải banner...</span></div>;
  if (query.isError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" /><h2 className="font-semibold">Không thể tải danh sách banner</h2>
    <p className="my-2 text-sm text-zinc-500">{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Thử lại</Button>
  </div>;

  return <div className="w-full space-y-6">
    {dialogOpen && <BannerFormDialog key={editItem?._id || 'new'} open={dialogOpen} onOpenChange={setDialogOpen} initial={editItem} saving={save.isPending}
      onSave={async (payload) => { try { await save.mutateAsync({ id: editItem?._id, payload }); toast.success(editItem ? 'Đã cập nhật banner.' : 'Đã thêm banner mới.'); setDialogOpen(false); } catch (error) { showError(error); } }} />}
    <ConfirmDialog open={deleteId !== null} onOpenChange={(value) => !value && setDeleteId(null)}
      title="Xóa Banner?" description="Banner sẽ bị xóa vĩnh viễn và không thể khôi phục." confirmText={remove.isPending ? 'Đang xóa...' : 'Xóa Banner'} isDestructive
      onConfirm={async () => { if (!deleteId) return; try { await remove.mutateAsync(deleteId); toast.success('Đã xóa banner.'); setDeleteId(null); } catch (error) { showError(error); } }} />
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="mb-1 text-3xl font-bold text-zinc-900 dark:text-white">Quản lý Banner & Slider</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Cập nhật hình ảnh và thông điệp quảng bá hiển thị tại trang chủ.</p></div>
      <Button onClick={() => { setEditItem(undefined); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Thêm Banner</Button>
    </div>
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-1 border-b p-4 text-sm text-zinc-500 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <span>{banners.length} banner · {banners.filter((item) => item.isActive).length} đang hiển thị</span>
        <span className="text-xs">Kéo thả hoặc dùng nút lên/xuống để sắp xếp</span>
      </div>
      {!banners.length ? <div className="p-12 text-center"><ImagePlus className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
        <h2 className="font-semibold">Chưa có banner nào</h2><p className="mt-1 text-sm text-zinc-500">Trang chủ sẽ sử dụng hero mặc định của SecureLearn.</p></div>
      : <DndContext sensors={sensors} onDragEnd={(event: DragEndEvent) => { if (event.over && event.active.id !== event.over.id) void move(String(event.active.id), String(event.over.id)); }}>
        <SortableContext items={banners.map((item) => item._id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{banners.map((banner, index) => (
        <SortableRow key={banner._id} id={banner._id} disabled={reorder.isPending}>

          <div className="flex items-center gap-2"><GripVertical className="hidden h-5 w-5 cursor-grab text-zinc-300 sm:block" aria-hidden />
            <div className="h-20 w-36 shrink-0 overflow-hidden rounded-xl border bg-zinc-100 dark:border-zinc-700"><img src={banner.imageUrl} alt="" className="h-full w-full object-cover" /></div></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{banner.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${banner.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>{banner.isActive ? 'Đang hiển thị' : 'Ẩn'}</span></div>
            <p className="mt-1 truncate text-xs text-zinc-500">{banner.subtitle || 'Không có phụ đề'}</p>{banner.linkUrl && <p className="mt-1 truncate text-xs text-primary">{banner.linkUrl}</p>}</div>
          <div className="flex items-center justify-end gap-1">
            <button aria-label="Đưa banner lên" disabled={index === 0 || reorder.isPending} onClick={() => step(banner._id, -1)} className="rounded-lg p-2 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-700"><ArrowUp className="h-4 w-4" /></button>
            <button aria-label="Đưa banner xuống" disabled={index === banners.length - 1 || reorder.isPending} onClick={() => step(banner._id, 1)} className="rounded-lg p-2 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-700"><ArrowDown className="h-4 w-4" /></button>
            <button aria-label={banner.isActive ? 'Ẩn banner' : 'Hiển thị banner'} disabled={toggle.isPending} onClick={async () => { try { await toggle.mutateAsync({ id: banner._id, isActive: !banner.isActive }); toast.success('Đã cập nhật trạng thái banner.'); } catch (error) { showError(error); } }} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700">{banner.isActive ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-zinc-400" />}</button>
            <button aria-label="Chỉnh sửa banner" onClick={() => { setEditItem(banner); setDialogOpen(true); }} className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil className="h-4 w-4" /></button>
            <button aria-label="Xóa banner" disabled={remove.isPending} onClick={() => setDeleteId(banner._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </SortableRow>
      ))}</div>
        </SortableContext>
      </DndContext>}
    </div>
  </div>;
};
