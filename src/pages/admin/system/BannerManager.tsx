import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { IBanner } from '@/types/admin.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const MOCK_BANNERS: IBanner[] = [
  { _id: '1', title: 'Học Bảo Mật Cùng Chuyên Gia', subtitle: 'Khám phá hơn 200 khóa học chuyên sâu về an ninh mạng', imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', linkUrl: '/courses?cat=security', isActive: true, order: 1, createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
  { _id: '2', title: 'Lập Trình Từ Zero Đến Hero', subtitle: 'Lộ trình học lập trình toàn diện từ cơ bản đến nâng cao', imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', linkUrl: '/courses?cat=programming', isActive: true, order: 2, createdAt: '2026-02-05T08:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
  { _id: '3', title: 'Khóa Học AI & Machine Learning', subtitle: 'Làm chủ trí tuệ nhân tạo với các dự án thực tiễn', imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80', linkUrl: '/courses?cat=ai', isActive: false, order: 3, createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
];

const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

// ===== Banner Form Dialog =====
interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<IBanner>;
  onSave: (data: Partial<IBanner>) => void;
}

const BannerFormDialog: React.FC<BannerFormDialogProps> = ({ open, onOpenChange, initial = {}, onSave }) => {
  const [form, setForm] = useState({
    title: initial.title || '',
    subtitle: initial.subtitle || '',
    imageUrl: initial.imageUrl || '',
    linkUrl: initial.linkUrl || '',
  });

  // Reset form khi mở với dữ liệu mới
  React.useEffect(() => {
    setForm({
      title: initial.title || '',
      subtitle: initial.subtitle || '',
      imageUrl: initial.imageUrl || '',
      linkUrl: initial.linkUrl || '',
    });
  }, [initial._id, open]);

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề banner.'); return; }
    if (!form.imageUrl.trim()) { toast.error('Vui lòng nhập URL hình ảnh.'); return; }
    onSave(form);
    onOpenChange(false);
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string }[] = [
    { key: 'title', label: 'Tiêu đề', placeholder: 'Tiêu đề banner...' },
    { key: 'subtitle', label: 'Phụ đề', placeholder: 'Mô tả ngắn...' },
    { key: 'imageUrl', label: 'URL hình ảnh', placeholder: 'https://...' },
    { key: 'linkUrl', label: 'URL liên kết (tuỳ chọn)', placeholder: '/courses?cat=...' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial._id ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
              <input
                className={inputCls}
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Image preview */}
          {form.imageUrl && (
            <div className="rounded-2xl overflow-hidden h-36 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <img
                src={form.imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {initial._id ? 'Cập nhật' : 'Thêm Banner'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== Main Page =====
export const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState<IBanner[]>(MOCK_BANNERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<IBanner>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditItem({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (banner: IBanner) => {
    setEditItem(banner);
    setDialogOpen(true);
  };

  const handleToggle = (id: string) => {
    setBanners((prev) => prev.map((b) => b._id === id ? { ...b, isActive: !b.isActive } : b));
    toast.success('Đã cập nhật trạng thái banner.');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setBanners((prev) => prev.filter((b) => b._id !== deleteId));
    setDeleteId(null);
    toast.success('Đã xóa banner.');
  };

  const handleSave = (data: Partial<IBanner>) => {
    if (editItem._id) {
      setBanners((prev) => prev.map((b) => b._id === editItem._id
        ? { ...b, ...data, updatedAt: new Date().toISOString() }
        : b
      ));
      toast.success('Đã cập nhật banner.');
    } else {
      const newBanner: IBanner = {
        _id: Date.now().toString(),
        isActive: true,
        order: banners.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: data.title || '',
        subtitle: data.subtitle || '',
        imageUrl: data.imageUrl || '',
        linkUrl: data.linkUrl,
      };
      setBanners((prev) => [...prev, newBanner]);
      toast.success('Đã thêm banner mới.');
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      {/* Banner Form Dialog */}
      <BannerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editItem}
        onSave={handleSave}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Xóa Banner?"
        description="Banner sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xóa Banner"
        isDestructive
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Quản lý Banner & Slider</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Cập nhật hình ảnh và thông điệp quảng bá hiển thị tại trang chủ.</p>
        </div>
        <button
          id="btn-add-banner"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Thêm Banner
        </button>
      </div>

      {/* Banner List */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500">
            {banners.length} banner · {banners.filter((b) => b.isActive).length} đang hiển thị
          </span>
          <span className="text-xs text-zinc-400">Kéo để sắp xếp thứ tự</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              <GripVertical className="w-5 h-5 text-zinc-300 dark:text-zinc-600 cursor-grab shrink-0" />

              {/* Preview */}
              <div className="w-28 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect fill="%23374151" width="100" height="60"/><text x="50" y="35" text-anchor="middle" fill="%239ca3af" font-size="12">No Image</text></svg>';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{banner.title}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${banner.isActive ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {banner.isActive ? 'Đang hiển thị' : 'Ẩn'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate">{banner.subtitle}</p>
                {banner.linkUrl && <p className="text-xs text-primary/70 truncate mt-0.5">{banner.linkUrl}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggle(banner._id)}
                  className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title={banner.isActive ? 'Ẩn' : 'Hiển thị'}
                >
                  {banner.isActive
                    ? <ToggleRight className="w-5 h-5 text-primary" />
                    : <ToggleLeft className="w-5 h-5 text-zinc-400" />}
                </button>
                <button
                  onClick={() => handleOpenEdit(banner)}
                  className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(banner._id)}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
