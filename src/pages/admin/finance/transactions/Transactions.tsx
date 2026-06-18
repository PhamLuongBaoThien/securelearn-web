import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, CreditCard, Download, CheckCircle, XCircle, Clock, Percent, Save, Undo2, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { ITransaction, PaymentProvider, TransactionStatus, IRevenueSplitConfig, IRevenueStats } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useAdminRevenueSplitConfig,
  useAdminRevenueStats,
  useAdminTransactions,
  useUpdateRevenueSplitConfig,
} from '@/hooks/useAdminFinance';

const statusConfig: Record<TransactionStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  SUCCEEDED: { label: 'Thành công', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' },
  FAILED: { label: 'Thất bại', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400' },
  PENDING: { label: 'Đang xử lý', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400' },
  REFUNDED: { label: 'Đã hoàn tiền', icon: <Undo2 className="w-3.5 h-3.5" />, cls: 'bg-zinc-100 dark:bg-zinc-400/10 text-zinc-600 dark:text-zinc-300' },
};

const providerBadge: Record<PaymentProvider, { label: string; cls: string }> = {
  VNPAY: { label: 'VNPay', cls: 'bg-blue-100 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400' },
  MOMO: { label: 'MoMo', cls: 'bg-pink-100 dark:bg-pink-400/10 text-pink-700 dark:text-pink-400' },
  STRIPE: { label: 'Stripe', cls: 'bg-violet-100 dark:bg-violet-400/10 text-violet-700 dark:text-violet-400' },
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const providerFilters: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tất cả cổng' },
  { value: 'VNPAY', label: 'VNPay' },
  { value: 'MOMO', label: 'MoMo' },
];

const statusFilters: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SUCCEEDED', label: 'Thành công' },
  { value: 'PENDING', label: 'Đang xử lý' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [];
  sortedPages.forEach((pageNumber, index) => {
    const previous = sortedPages[index - 1];
    if (previous && pageNumber - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(pageNumber);
  });

  return items;
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value)?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-[160px] justify-between rounded-xl border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 shadow-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span className="truncate">{selected}</span>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value || 'all'} value={option.value} className="cursor-pointer">
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const Transactions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [providerFilter, setProviderFilter] = useState<string>(searchParams.get('provider') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [page, setPage] = useState(Math.max(Number(searchParams.get('page') || '1'), 1));
  const [limit] = useState(10);
  const [draftConfig, setDraftConfig] = useState<IRevenueSplitConfig | null>(null);

  const splitConfigQuery = useAdminRevenueSplitConfig();
  const revenueQuery = useAdminRevenueStats();

  useEffect(() => {
    setPage(1);
  }, [providerFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const nextSearch = searchParams.get('q') || '';
    const nextProvider = searchParams.get('provider') || '';
    const nextStatus = searchParams.get('status') || '';
    const nextPage = Math.max(Number(searchParams.get('page') || '1'), 1);

    setSearch((current) => (current !== nextSearch ? nextSearch : current));
    setProviderFilter((current) => (current !== nextProvider ? nextProvider : current));
    setStatusFilter((current) => (current !== nextStatus ? nextStatus : current));
    setPage((current) => (current !== nextPage ? nextPage : current));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (providerFilter) params.set('provider', providerFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [page, providerFilter, search, setSearchParams, statusFilter]);

  const transactionsQuery = useAdminTransactions({
    search: debouncedSearch,
    providerFilter,
    statusFilter,
    page,
    limit,
  });

  const currentSplitConfig = useMemo(() => {
    if (draftConfig !== null) return draftConfig;
    if (splitConfigQuery.data) return splitConfigQuery.data;
    return { adminPercent: 25, instructorPercent: 75 };
  }, [draftConfig, splitConfigQuery.data]);

  const updateSplitMutation = useUpdateRevenueSplitConfig();

  const transactions = transactionsQuery.data?.transactions ?? [];
  const totalTransactions = transactionsQuery.data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalTransactions / limit), 1);
  const visiblePages = getVisiblePages(page, totalPages);

  const summary = revenueQuery.data as IRevenueStats | undefined;
  const totalAmount = transactions.filter((t) => t.status === 'SUCCEEDED').reduce((s, t) => s + (t.grossAmount ?? t.amount), 0);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Lịch sử Giao dịch</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Theo dõi thanh toán qua VNPay/MoMo và tỷ lệ chia doanh thu cho từng giao dịch.</p>
        </div>
        <Button id="btn-export-transactions" variant="outline" className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Xuất CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Tỷ lệ chia doanh thu</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Quản trị viên %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={currentSplitConfig.adminPercent}
                onChange={(e) => setDraftConfig({
                  adminPercent: Number(e.target.value),
                  instructorPercent: 100 - Number(e.target.value),
                })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Giảng viên %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={currentSplitConfig.instructorPercent}
                onChange={(e) => setDraftConfig({
                  instructorPercent: Number(e.target.value),
                  adminPercent: 100 - Number(e.target.value),
                })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Tổng phải bằng 100%</span>
            <span>{currentSplitConfig.adminPercent + currentSplitConfig.instructorPercent}%</span>
          </div>
          {(() => {
            const unchanged = draftConfig === null || (
              splitConfigQuery.data
              && draftConfig.adminPercent === splitConfigQuery.data.adminPercent
              && draftConfig.instructorPercent === splitConfigQuery.data.instructorPercent
            );
            return (
                <Button
                onClick={() => updateSplitMutation.mutate(currentSplitConfig)}
                disabled={updateSplitMutation.isPending || !!unchanged}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
              >
                <Save className="w-4 h-4" />
                {updateSplitMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
              </Button>
            );
          })()}
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Tóm tắt doanh thu</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-500">Tổng doanh thu</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{fmt(summary?.totalRevenue ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-500">Doanh thu QTV</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{fmt(summary?.totalAdminRevenue ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-500">Doanh thu Giảng viên</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{fmt(summary?.totalInstructorRevenue ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-500">Giao dịch thành công</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{summary?.successfulTransactions ?? 0}</p>
            </div>
          </div>
        </div>
      </div>


      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <Input className="bg-transparent text-sm flex-1 border-0 shadow-none px-0 py-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-0" placeholder="Mã GD, tên, email, tên khóa..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <FilterDropdown
            label="Tất cả cổng"
            value={providerFilter}
            options={providerFilters}
            onChange={setProviderFilter}
          />
          <FilterDropdown
            label="Tất cả trạng thái"
            value={statusFilter}
            options={statusFilters}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="relative min-h-[580px] overflow-x-auto">
          {transactionsQuery.isFetching && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full w-1/3 animate-pulse bg-zinc-900 dark:bg-white" />
            </div>
          )}
          <table className={`w-full transition-opacity duration-150 ${transactionsQuery.isFetching ? 'opacity-70' : 'opacity-100'}`}>
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Mã giao dịch', 'Người dùng', 'Nội dung', 'Cổng TT', 'Tổng / Chia', 'Trạng thái', 'Thời gian'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((t: ITransaction) => {
                const sc = statusConfig[t.status];
                const pb = providerBadge[t.provider];
                const gross = t.grossAmount ?? t.amount;
                const adminShare = t.adminAmount ?? Math.round(gross * ((currentSplitConfig.adminPercent || 0) / 100));
                const instructorShare = t.instructorAmount ?? (gross - adminShare);
                const transactionCode = t.transactionCode || t.transactionId;
                return (
                  <tr key={t._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-zinc-600 dark:text-zinc-400">{transactionCode}</code>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.fullName}</p>
                      <p className="text-xs text-zinc-400">{t.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-44">
                      {t.productType === 'SUBSCRIPTION' || t.subscriptionSnapshot ? (
                        <div className="min-w-0">
                          <span className="truncate block font-medium text-violet-600 dark:text-violet-400">
                            {t.subscriptionSnapshot?.name || (t.subscriptionSnapshot?.planType === 'YEARLY' ? 'Thuê bao 1 năm' : 'Thuê bao 1 tháng')}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {t.subscriptionSnapshot?.planType === 'YEARLY' ? 'Gói năm' : 'Gói tháng'}
                            {t.subscriptionSnapshot?.durationDays ? ` · ${t.subscriptionSnapshot.durationDays} ngày` : ''}
                          </span>
                        </div>
                      ) : t.items?.length ? (
                        <div className="min-w-0">
                          <span className="truncate block">{t.items[0].title}</span>
                          {t.items.length > 1 && (
                            <span className="text-xs text-zinc-400">+{t.items.length - 1} khóa học khác</span>
                          )}
                        </div>
                      ) : t.course ? (
                        <span className="truncate block">{t.course.title}</span>
                      ) : (
                        <span className="text-violet-500 font-medium">{t.plan === 'MONTHLY' ? 'Thuê bao 1 tháng' : t.plan === 'YEARLY' ? 'Thuê bao 1 năm' : t.plan}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pb.cls}`}>{pb.label}</span></td>
                    <td className="px-4 py-3.5 text-sm">
                      <div className="font-bold text-zinc-900 dark:text-white">{fmt(gross)}</div>
                      <div className="text-xs text-zinc-500">QTV {fmt(adminShare)} · GV {fmt(instructorShare)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>{sc.icon}{sc.label}</span>
                      {t.status === 'REFUNDED' && t.refundReason && (
                        <p className="mt-1 max-w-40 text-xs text-zinc-500" title={t.refundReason}>{t.refundReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                      <p>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</p>
                      <p>{new Date(t.createdAt).toLocaleTimeString('vi-VN')}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <CreditCard className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Không có giao dịch nào.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-zinc-500">
            {transactions.length} / {totalTransactions} giao dịch · Trang {page}/{totalPages} · Tổng thành công trang này: <strong className="text-emerald-600">{fmt(totalAmount)}</strong>
          </span>
          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Trước"
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((current) => Math.max(current - 1, 1));
                  }}
                />
              </PaginationItem>
              {visiblePages.map((item) => (
                <PaginationItem key={item}>
                  {typeof item === 'number' ? (
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Sau"
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((current) => Math.min(current + 1, totalPages));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};
