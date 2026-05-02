// ========================
// RoleFormDialog: Dialog tạo/sửa role, tách riêng khỏi RbacManager để gọn luồng chính.
// ========================
import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import type { IRolePermission } from '@/types/admin.types';
import { getRoleBadgeClass } from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RbacColorPicker } from './RbacColorPicker';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: IRolePermission | null;
}

export const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}) => {
  const isEdit = !!initialData;
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('blue');
  const { createMut, updateMut } = useAdminRoles();

  useEffect(() => {
    if (!open) return;
    setLabel(initialData?.label ?? '');
    setColor(initialData?.color ?? 'blue');
  }, [initialData, open]);

  const roleKey = isEdit
    ? initialData!.roleKey
    : label.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 30);

  const handleSubmit = () => {
    if (isEdit) {
      updateMut.mutate(
        { roleKey, data: { label, color } },
        {
          onSuccess: () => {
            toast.success('Đã cập nhật vai trò.');
            onSuccess();
            onOpenChange(false);
          },
          onError: (error: any) => toast.error(error.message || 'Lỗi xử lý'),
        }
      );
      return;
    }

    createMut.mutate(
      { roleKey, label, color },
      {
        onSuccess: () => {
          toast.success(`Đã tạo vai trò "${label}".`);
          onSuccess();
          onOpenChange(false);
        },
        onError: (error: any) => toast.error(error.message || 'Lỗi xử lý'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Thay đổi tên hiển thị và màu badge.'
              : 'Nhập tên hiển thị và chọn màu badge cho vai trò.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tên {isEdit ? 'hiển thị' : 'vai trò'} *
            </label>
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Vd: Quản lý Marketing"
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-xl"
              maxLength={40}
            />
            {!isEdit && roleKey && (
              <p className="text-xs text-zinc-400">
                Key tự động:{' '}
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                  {roleKey}
                </code>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Màu badge</label>
            <RbacColorPicker value={color} onChange={setColor} />
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(color)}`}
              >
                {label || 'Xem trước'}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!label.trim() || (!isEdit && !roleKey) || createMut.isPending || updateMut.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {createMut.isPending || updateMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEdit ? (
              <Save className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isEdit ? 'Lưu' : 'Tạo vai trò'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
