// ========================
// Admin Coupon Manager
// Mục đích:
// - cung cấp màn hình quản trị coupon cho nhóm Admin Finance
// - hỗ trợ tạo/sửa/bật tắt/xóa coupon và theo dõi nhanh lượt dùng, thời hạn, điều kiện áp dụng
// ========================
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Edit, Loader2, Plus, Search, Trash2, ToggleLeft, ToggleRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useAdminCoupons,
  useDeleteAdminCoupon,
  useSaveAdminCoupon,
  useUpdateAdminCouponStatus,
} from '@/hooks/useAdminFinance';
import type { Coupon, CouponPayload, CouponType } from '@/services/paymentApi';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const money = (value: number) => value.toLocaleString('vi-VN') + ' ₫';
const emptyForm: CouponPayload = {
  code: '',
  name: '',
  type: 'PERCENT',
  value: 10,
  maxDiscountAmount: null,
  minOrderAmount: 0,
  usageLimit: null,
  perUserLimit: 1,
  startsAt: null,
  endsAt: null,
  isActive: true,
};

const formatDatePickerDate = (dateString: string | null) => {
  if (!dateString) return 'Chọn ngày';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const CouponManager = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponPayload>(emptyForm);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const couponsQuery = useAdminCoupons({ search: debouncedSearch, status, page: 1, limit: 50 });
  const saveMutation = useSaveAdminCoupon();
  const statusMutation = useUpdateAdminCouponStatus();
  const deleteMutation = useDeleteAdminCoupon();

  const coupons = couponsQuery.data?.coupons ?? [];
  const isSaving = saveMutation.isPending;
  const isUpdatingStatus = statusMutation.isPending;
  const formTitle = editing ? `Sửa ${editing.code}` : 'Tạo coupon';

  const preview = useMemo(() => {
    if (form.type === 'PERCENT') {
      return `${form.value}%${form.maxDiscountAmount ? `, tối đa ${money(form.maxDiscountAmount)}` : ''}`;
    }
    return money(form.value);
  }, [form.maxDiscountAmount, form.type, form.value]);

  const editCoupon = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      isActive: coupon.isActive,
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const validateForm = (): boolean => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      toast.error('Mã coupon không được để trống.');
      return false;
    }
    const codeRegex = /^[A-Z0-9]+$/;
    if (!codeRegex.test(code)) {
      toast.error('Mã coupon chỉ được chứa chữ cái viết hoa và chữ số (không chứa khoảng trắng hay ký tự đặc biệt).');
      return false;
    }

    if (!form.name.trim()) {
      toast.error('Tên hiển thị không được để trống.');
      return false;
    }

    if (form.value === undefined || form.value === null || isNaN(form.value)) {
      toast.error('Giá trị giảm giá không hợp lệ.');
      return false;
    }

    if (form.type === 'PERCENT') {
      if (form.value < 0 || form.value > 100) {
        toast.error('Giá trị phần trăm giảm giá phải nằm trong khoảng từ 0% đến 100%.');
        return false;
      }
    } else {
      if (form.value <= 0) {
        toast.error('Giá trị số tiền giảm cố định phải lớn hơn 0.');
        return false;
      }
    }

    if (form.type === 'PERCENT' && form.maxDiscountAmount !== null) {
      if (form.maxDiscountAmount < 0) {
        toast.error('Số tiền giảm tối đa không được nhỏ hơn 0.');
        return false;
      }
    }

    if (form.minOrderAmount < 0) {
      toast.error('Giá trị đơn hàng tối thiểu không được nhỏ hơn 0.');
      return false;
    }

    if (form.usageLimit !== null && form.usageLimit < 1) {
      toast.error('Tổng lượt dùng tối đa phải từ 1 lượt trở lên.');
      return false;
    }

    if (form.perUserLimit < 1) {
      toast.error('Lượt dùng tối đa mỗi user phải từ 1 lượt trở lên.');
      return false;
    }

    if (form.startsAt && form.endsAt) {
      const start = new Date(form.startsAt);
      const end = new Date(form.endsAt);
      if (end < start) {
        toast.error('Ngày kết thúc phải diễn ra sau ngày bắt đầu.');
        return false;
      }
    }

    return true;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    saveMutation.mutate(
      { id: editing?._id, payload: { ...form, code: form.code.trim().toUpperCase() } },
      { onSuccess: resetForm }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Coupon</h1>
          <p className="mt-1 text-sm text-zinc-500">Quản lý mã giảm giá cho checkout mua khóa học.</p>
        </div>
        <Button onClick={resetForm} className="gap-2">
          <Plus className="h-4 w-4" /> Coupon mới
        </Button>
      </div>

      <section className="border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{formTitle}</h2>
          {editing && <Button type="button" variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>}
        </div>
        <form className="grid gap-4 lg:grid-cols-4" onSubmit={submit}>
          <label className="block text-sm font-medium">
            Mã coupon
            <Input 
              className="mt-1 uppercase" 
              value={form.code} 
              onChange={(event) => setForm({ ...form, code: event.target.value })} 
              placeholder="Ví Dụ: SUMMERSALE"
              required 
            />
          </label>
          <label className="block text-sm font-medium lg:col-span-2">
            Tên hiển thị
            <Input 
              className="mt-1" 
              value={form.name} 
              onChange={(event) => setForm({ ...form, name: event.target.value })} 
              placeholder="Tên chương trình khuyến mãi"
              required 
            />
          </label>
          <label className="block text-sm font-medium">
            Loại giảm
            <div className="mt-1">
              <Select
                value={form.type}
                onChange={(event) => setForm({ 
                  ...form, 
                  type: event.target.value as CouponType, 
                  maxDiscountAmount: event.target.value === 'FIXED' ? null : form.maxDiscountAmount,
                  value: event.target.value === 'PERCENT' && form.value > 100 ? 100 : form.value
                })}
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (₫)</option>
              </Select>
            </div>
          </label>
          <label className="block text-sm font-medium">
            Giá trị
            <Input 
              className="mt-1" 
              type="number" 
              min={0} 
              max={form.type === 'PERCENT' ? 100 : undefined} 
              value={form.value} 
              onChange={(event) => {
                let val = Number(event.target.value);
                if (form.type === 'PERCENT') {
                  if (val > 100) val = 100;
                  if (val < 0) val = 0;
                }
                setForm({ ...form, value: val });
              }} 
              required 
            />
          </label>
          <label className="block text-sm font-medium">
            Giảm tối đa
            <Input 
              className="mt-1" 
              type="number" 
              min={0} 
              disabled={form.type === 'FIXED'} 
              value={form.maxDiscountAmount ?? ''} 
              onChange={(event) => setForm({ ...form, maxDiscountAmount: event.target.value ? Number(event.target.value) : null })} 
              placeholder={form.type === 'FIXED' ? "Không khả dụng" : "Không giới hạn"}
            />
          </label>
          <label className="block text-sm font-medium">
            Đơn tối thiểu
            <Input 
              className="mt-1" 
              type="number" 
              min={0} 
              value={form.minOrderAmount} 
              onChange={(event) => setForm({ ...form, minOrderAmount: Number(event.target.value) })} 
            />
          </label>
          <label className="block text-sm font-medium">
            Tổng lượt dùng
            <Input 
              className="mt-1" 
              type="number" 
              min={1} 
              value={form.usageLimit ?? ''} 
              onChange={(event) => setForm({ ...form, usageLimit: event.target.value ? Number(event.target.value) : null })} 
              placeholder="Không giới hạn"
            />
          </label>
          <label className="block text-sm font-medium">
            Lượt/user
            <Input 
              className="mt-1" 
              type="number" 
              min={1} 
              value={form.perUserLimit} 
              onChange={(event) => setForm({ ...form, perUserLimit: Number(event.target.value) })} 
            />
          </label>
          <div className="block text-sm font-medium">
            <span>Bắt đầu</span>
            <div className="relative mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 border border-input bg-transparent px-3 py-2 pr-10 text-sm shadow-sm",
                      !form.startsAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                    {formatDatePickerDate(form.startsAt)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <Calendar
                    selected={form.startsAt ? new Date(form.startsAt) : undefined}
                    onSelect={(date) => setForm({ ...form, startsAt: date.toISOString() })}
                  />
                </PopoverContent>
              </Popover>
              {form.startsAt && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 mt-0.5"
                  onClick={() => setForm({ ...form, startsAt: null })}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="block text-sm font-medium">
            <span>Kết thúc</span>
            <div className="relative mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 border border-input bg-transparent px-3 py-2 pr-10 text-sm shadow-sm",
                      !form.endsAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                    {formatDatePickerDate(form.endsAt)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <Calendar
                    selected={form.endsAt ? new Date(form.endsAt) : undefined}
                    onSelect={(date) => setForm({ ...form, endsAt: date.toISOString() })}
                  />
                </PopoverContent>
              </Popover>
              {form.endsAt && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 mt-0.5"
                  onClick={() => setForm({ ...form, endsAt: null })}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="pt-7">
            <span className="mb-2 block text-sm font-medium">Trạng thái hoạt động</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors',
                form.isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                {form.isActive ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {form.isActive ? 'Đang bật' : 'Đang tắt'}
              </span>
              {form.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-end justify-between gap-3 lg:col-span-2">
            <span className="text-sm text-zinc-500">Xem trước: {preview}</span>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu coupon
            </Button>
          </div>
        </form>
      </section>

      <section className="border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-64 flex-1 items-center gap-2 border border-zinc-200 px-3 dark:border-zinc-700 rounded-md">
            <Search className="h-4 w-4 text-zinc-400" />
            <Input className="border-0 shadow-none focus-visible:ring-0" placeholder="Tìm mã hoặc tên coupon" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="w-48">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hiệu lực</option>
              <option value="inactive">Tạm dừng</option>
              <option value="expired">Hết hạn</option>
            </Select>
          </div>
        </div>

        {couponsQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500"><th className="py-2">Mã</th><th>Tên</th><th>Giảm</th><th>Điều kiện</th><th>Lượt dùng</th><th>Hiệu lực</th><th>Trạng thái</th><th /></tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 font-bold">{coupon.code}</td>
                    <td>{coupon.name}</td>
                    <td>{coupon.type === 'PERCENT' ? `${coupon.value}%` : money(coupon.value)}</td>
                    <td>{coupon.minOrderAmount ? `Từ ${money(coupon.minOrderAmount)}` : 'Không'}</td>
                    <td>{coupon.usedCount}/{coupon.usageLimit ?? '∞'} · {coupon.perUserLimit}/user</td>
                    <td>{coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString('vi-VN') : 'Ngay'} - {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString('vi-VN') : 'Không hạn'}</td>
                    <td>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => statusMutation.mutate({ id: coupon._id, isActive: !coupon.isActive })}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                          coupon.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        )}
                      >
                        {coupon.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        {coupon.isActive ? 'Đang bật' : 'Đang tắt'}
                      </button>
                    </td>
                    <td className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => editCoupon(coupon)} title="Sửa"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(coupon._id)} title="Xóa"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};