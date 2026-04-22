import React, { useState } from 'react';
import { Plus, ChevronRight, Pencil, Trash2, Tag, Save, Hash, Folder } from 'lucide-react';
import { toast } from 'sonner';
import type { ICategory } from '@/types/admin.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const MOCK_CATEGORIES: ICategory[] = [
  {
    _id: '1', name: 'Công nghệ thông tin', slug: 'cntt', description: 'Lập trình, phát triển phần mềm', icon: '💻', parentId: null, order: 1, isActive: true, courseCount: 85, createdAt: '2026-01-01T00:00:00Z',
    children: [
      { _id: '1-1', name: 'Lập trình Web', slug: 'lap-trinh-web', parentId: '1', order: 1, isActive: true, courseCount: 32, createdAt: '2026-01-01T00:00:00Z' },
      { _id: '1-2', name: 'Phát triển Mobile', slug: 'mobile', parentId: '1', order: 2, isActive: true, courseCount: 18, createdAt: '2026-01-01T00:00:00Z' },
      { _id: '1-3', name: 'DevOps & Cloud', slug: 'devops', parentId: '1', order: 3, isActive: false, courseCount: 12, createdAt: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    _id: '2', name: 'Bảo mật thông tin', slug: 'bao-mat', description: 'An ninh mạng, ethical hacking', icon: '🔐', parentId: null, order: 2, isActive: true, courseCount: 64, createdAt: '2026-01-01T00:00:00Z',
    children: [
      { _id: '2-1', name: 'Ethical Hacking', slug: 'ethical-hacking', parentId: '2', order: 1, isActive: true, courseCount: 28, createdAt: '2026-01-01T00:00:00Z' },
      { _id: '2-2', name: 'Mã hóa & Cryptography', slug: 'cryptography', parentId: '2', order: 2, isActive: true, courseCount: 15, createdAt: '2026-01-01T00:00:00Z' },
    ],
  },
  { _id: '3', name: 'Kinh doanh', slug: 'kinh-doanh', description: 'Khởi nghiệp, marketing, quản trị', icon: '💼', parentId: null, order: 3, isActive: true, courseCount: 42, createdAt: '2026-01-01T00:00:00Z', children: [] },
  { _id: '4', name: 'Thiết kế', slug: 'thiet-ke', description: 'UI/UX, đồ hoạ, video', icon: '🎨', parentId: null, order: 4, isActive: true, courseCount: 37, createdAt: '2026-01-01T00:00:00Z', children: [] },
];

const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

interface FormState { name: string; slug: string; description: string; parentId: string | null; }

// ===== Category Form Dialog =====
interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<ICategory>;
  categories: ICategory[];
  onSave: (data: FormState) => void;
}

const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({ open, onOpenChange, initial, categories, onSave }) => {
  const [form, setForm] = useState<FormState>({
    name: initial.name || '',
    slug: initial.slug || '',
    description: initial.description || '',
    parentId: initial.parentId ?? null,
  });

  React.useEffect(() => {
    setForm({
      name: initial.name || '',
      slug: initial.slug || '',
      description: initial.description || '',
      parentId: initial.parentId ?? null,
    });
  }, [initial._id, open]);

  const autoSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên danh mục.'); return; }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial._id ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tên danh mục</label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))}
                placeholder="Tên danh mục..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Slug</label>
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="ten-danh-muc"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Mô tả</label>
            <textarea
              className={`${inputCls} resize-none h-20`}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả ngắn..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Danh mục cha</label>
            <select
              className={inputCls}
              value={form.parentId || ''}
              onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value || null }))}
            >
              <option value="">Danh mục gốc</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" /> Lưu
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== Category Row Component =====
const CategoryRow: React.FC<{
  cat: ICategory;
  depth?: number;
  expandedIds: string[];
  onToggleExpand: (id: string) => void;
  onEdit: (cat: ICategory) => void;
  onDelete: (id: string) => void;
}> = ({ cat, depth = 0, expandedIds, onToggleExpand, onEdit, onDelete }) => {
  const isExpanded = expandedIds.includes(cat._id);
  const hasChildren = (cat.children || []).length > 0;

  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group ${depth > 0 ? 'pl-10 border-l-2 border-zinc-100 dark:border-zinc-800 ml-4' : ''}`}>
        <button
          onClick={() => hasChildren && onToggleExpand(cat._id)}
          className={`p-1 rounded-lg transition-colors ${hasChildren ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer' : 'opacity-0 cursor-default'}`}
        >
          <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Folder className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{cat.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs ${cat.isActive ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
              {cat.isActive ? 'Hoạt động' : 'Tắt'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-zinc-400"><Hash className="w-3 h-3" />{cat.slug}</span>
            <span className="text-xs text-zinc-400">{cat.courseCount} khóa học</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(cat._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (cat.children || []).map((child) => (
        <CategoryRow
          key={child._id}
          cat={child}
          depth={depth + 1}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

// ===== Main Page =====
export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>(MOCK_CATEGORIES);
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '2']);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<ICategory>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toggleExpand = (id: string) =>
    setExpandedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleOpenAdd = () => { setEditItem({}); setDialogOpen(true); };
  const handleOpenEdit = (cat: ICategory) => { setEditItem(cat); setDialogOpen(true); };

  const handleDelete = () => {
    if (!deleteId) return;
    setCategories((p) => {
      // Xoá root
      const withoutRoot = p.filter((c) => c._id !== deleteId);
      // Xoá child
      return withoutRoot.map((c) => ({ ...c, children: (c.children || []).filter((ch) => ch._id !== deleteId) }));
    });
    setDeleteId(null);
    toast.success('Đã xóa danh mục.');
  };

  const handleSave = (data: FormState) => {
    if (editItem._id) {
      setCategories((p) => p.map((c) => c._id === editItem._id ? { ...c, ...data } : c));
      toast.success('Đã cập nhật danh mục.');
    } else {
      const newCat: ICategory = {
        _id: Date.now().toString(),
        name: data.name, slug: data.slug, description: data.description,
        parentId: data.parentId,
        order: categories.length + 1, isActive: true, courseCount: 0,
        createdAt: new Date().toISOString(),
      };
      if (!data.parentId) {
        setCategories((p) => [...p, { ...newCat, children: [] }]);
      } else {
        setCategories((p) => p.map((c) => c._id === data.parentId
          ? { ...c, children: [...(c.children || []), newCat] }
          : c
        ));
      }
      toast.success('Đã thêm danh mục.');
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      {/* Form Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editItem}
        categories={categories}
        onSave={handleSave}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Xóa Danh mục?"
        description="Danh mục và tất cả danh mục con sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
        confirmText="Xóa"
        isDestructive
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Quản lý Danh mục</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Thiết lập và phân loại các lĩnh vực học tập.</p>
        </div>
        <button
          id="btn-add-category"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Thêm Danh mục
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng danh mục', value: categories.length + categories.reduce((s, c) => s + (c.children?.length || 0), 0) },
          { label: 'Gốc', value: categories.length },
          { label: 'Con', value: categories.reduce((s, c) => s + (c.children?.length || 0), 0) },
          { label: 'Tổng khóa học', value: categories.reduce((s, c) => s + c.courseCount, 0) },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="font-semibold text-zinc-900 dark:text-white text-sm">Cấu trúc danh mục</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {categories.map((cat) => (
            <CategoryRow
              key={cat._id}
              cat={cat}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
