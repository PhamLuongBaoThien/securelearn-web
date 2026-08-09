import React, { useMemo, useState } from 'react';
import { Search, Filter, CreditCard, Download, RefreshCw, CheckCircle, XCircle, Clock, Percent, Save, Undo2, ChevronDown, ChevronUp, CircleDollarSign, Scale, Users, Loader2, X, CalendarRange, TrendingUp } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import type { ITransaction, PaymentProvider, TransactionStatus, IRevenueSplitConfig, IRevenueStats } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
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
import { getTransactions } from '@/services/adminApi';
import type { AdminSubscriptionTerm, SubscriptionSettlement } from '@/services/paymentApi';
import {
  useAdminRevenueSplitConfig,
  useAdminRevenueStats,
  useAdminTransactions,
  useAdminSubscriptionTerms,
  useAdminSubscriptionSettlements,
  useUpdateSubscriptionSettlement,
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

const fmt = (value: unknown) => { const amount = Number(value); return (Number.isFinite(amount) ? amount.toLocaleString('vi-VN') : '0') + '₫'; };
const compactCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

type RevenueRange = '30d' | '90d' | '12m' | 'all' | 'custom';
type CustomRevenueDates = { startDate: string; endDate: string };

const revenueRangeOptions: Array<{ value: RevenueRange; label: string }> = [
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '12m', label: '12 tháng' },
  { value: 'all', label: 'Tất cả' },
  { value: 'custom', label: 'Tùy chọn' },
];

const revenueChartConfig = {
  revenue: { label: 'Tổng doanh thu', color: 'var(--chart-1)' },
  adminRevenue: { label: 'Doanh thu nền tảng', color: 'var(--chart-2)' },
  instructorRevenue: { label: 'Phần chia giảng viên', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRevenueDateParams = (range: RevenueRange, customDates: CustomRevenueDates) => {
  if (range === 'all') return {};
  if (range === 'custom') {
    return {
      startDate: customDates.startDate ? `${customDates.startDate}T00:00:00+07:00` : undefined,
      endDate: customDates.endDate ? `${customDates.endDate}T23:59:59.999+07:00` : undefined,
    };
  }

  const end = new Date();
  const start = new Date(end);
  if (range === '12m') start.setFullYear(start.getFullYear() - 1);
  else start.setDate(start.getDate() - (range === '30d' ? 29 : 89));
  return {
    startDate: `${formatInputDate(start)}T00:00:00+07:00`,
    endDate: `${formatInputDate(end)}T23:59:59.999+07:00`,
  };
};

const getDefaultCustomRevenueDates = (): CustomRevenueDates => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 89);
  return { startDate: formatInputDate(start), endDate: formatInputDate(end) };
};

const getTransactionEffectiveDate = (transaction: ITransaction) =>
  transaction.paidAt ? new Date(transaction.paidAt) : new Date(transaction.createdAt);

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


function getTransactionKind(t: ITransaction): 'COURSE' | 'SUBSCRIPTION' | 'UNKNOWN' {
  if (t.productType === 'SUBSCRIPTION') return 'SUBSCRIPTION';
  if (t.productType === 'COURSE') return 'COURSE';
  if (t.items?.length || t.course) return 'COURSE';
  if (t.subscriptionSnapshot || t.plan === 'MONTHLY' || t.plan === 'YEARLY') return 'SUBSCRIPTION';
  return 'UNKNOWN';
}
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

function FilterSelect({
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
  return (
    <Select
      value={value}
      onValueChange={(event) => onChange(event)}
>
      <SelectTrigger aria-label={label} className="rounded-lg border-zinc-200 bg-zinc-50 font-medium text-zinc-700 shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
      </SelectContent>
    </Select>
  );
}

function SubscriptionSettlementCard({
  item,
  expanded,
  onToggle,
  termById,
  isUpdating,
  onMakeAvailable,
}: {
  item: SubscriptionSettlement;
  expanded: boolean;
  onToggle: () => void;
  termById: Map<string, AdminSubscriptionTerm>;
  isUpdating: boolean;
  onMakeAvailable: () => void;
}) {
  const availablePool = Number(item.instructorPool || 0) + Number(item.carriedIn || 0);
  const isBalanced = Number(item.reconciliationDifference || 0) === 0;
  const minutes = (seconds: number) => `${(Number(seconds || 0) / 60).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} phút`;
  const dateTime = (value?: string | Date | null) => value
    ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const overlapRange = (term?: AdminSubscriptionTerm) => {
    if (!term) return null;
    const [year, month] = item.period.split('-').map(Number);
    const periodStart = new Date(`${item.period}-01T00:00:00+07:00`);
    const nextPeriod = new Date(`${year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-01T00:00:00+07:00`);
    if (month === 12) nextPeriod.setFullYear(year + 1);
    return {
      startsAt: new Date(Math.max(new Date(term.startsAt).getTime(), periodStart.getTime())),
      endsAt: new Date(Math.min(new Date(term.endsAt).getTime(), nextPeriod.getTime())),
    };
  };
  const termLedgers = item.termLedgers || [];

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Kỳ {item.period}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'}`}>
                {item.status === 'AVAILABLE' ? 'Có thể nhận' : 'Chờ ghi nhận'}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300'}`}>
                <Scale className="h-3.5 w-3.5" /> {isBalanced ? 'Đối soát khớp' : `Lệch ${fmt(item.reconciliationDifference)}`}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{termLedgers.length.toLocaleString('vi-VN')} kỳ thuê bao · {minutes(item.totalQualifiedSeconds)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={onToggle} aria-expanded={expanded}>
            {expanded ? <ChevronUp className="mr-1.5 h-4 w-4" /> : <ChevronDown className="mr-1.5 h-4 w-4" />}
            {expanded ? 'Thu gọn' : 'Xem chi tiết'}
          </Button>
          {item.status === 'LOCKED' && (
            <Button size="sm" className="cursor-pointer" disabled={isUpdating} onClick={onMakeAvailable}>
              Duyệt cho phép nhận
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-px bg-zinc-100 sm:grid-cols-2 xl:grid-cols-4 dark:bg-zinc-800">
        {[
          { label: 'Doanh thu ghi nhận', value: item.recognizedGross, note: 'Doanh thu thuê bao thuộc kỳ' },
          { label: 'Doanh thu nền tảng', value: item.adminRevenue, note: `Gồm hết hạn ${fmt(item.expiredToAdmin)}` },
          { label: 'Quỹ dành cho người giảng dạy', value: availablePool, note: `Quỹ mới ${fmt(item.instructorPool)} + chuyển kỳ trước ${fmt(item.carriedIn)}` },
          { label: 'Đã phân bổ', value: item.allocatedAmount, note: `${item.allocations?.length || 0} khóa học/tác giả` },
        ].map((metric) => (
          <div key={metric.label} className="bg-white p-4 dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500">{metric.label}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">{fmt(metric.value)}</p>
            <p className="mt-1 text-xs text-zinc-400">{metric.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border-t border-zinc-100 bg-zinc-50/70 p-4 text-sm sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-950/30">
        <div><span className="text-zinc-500">Chuyển từ kỳ trước</span><strong className="ml-2 text-zinc-900 dark:text-white">{fmt(item.carriedIn)}</strong></div>
        <div><span className="text-zinc-500">Chuyển sang kỳ sau</span><strong className="ml-2 text-zinc-900 dark:text-white">{fmt(item.carriedOut)}</strong></div>
        <div><span className="text-zinc-500">Hết kỳ về nền tảng</span><strong className="ml-2 text-zinc-900 dark:text-white">{fmt(item.expiredToAdmin)}</strong></div>
      </div>

      {expanded && (
        <div className="space-y-6 border-t border-zinc-200 p-5 dark:border-zinc-800">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              <h4 className="font-semibold text-zinc-900 dark:text-white">Phân bổ theo người giảng dạy và khóa học</h4>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-950/40">
                  <tr><th className="px-3 py-2.5">Khóa học</th><th>Tác giả</th><th>Học viên</th><th>Kỳ góp quỹ</th><th>Phút hợp lệ</th><th>Tỷ lệ chia</th><th className="pr-3 text-right">Số tiền</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(item.allocations || []).map((allocation) => (
                    <tr key={`${allocation.instructorId}:${allocation.courseId}`}>
                      <td className="px-3 py-3 font-medium text-zinc-900 dark:text-white">{allocation.courseTitle || allocation.courseId}</td>
                      <td className="font-mono text-xs text-zinc-500">{allocation.instructorId}</td>
                      <td>{allocation.learnerCount}</td><td>{allocation.termCount}</td><td>{minutes(allocation.qualifiedSeconds)}</td><td>{Number(allocation.sharePercent || 0).toLocaleString('vi-VN')}%</td>
                      <td className="pr-3 text-right font-semibold">{fmt(allocation.amount)}</td>
                    </tr>
                  ))}
                  {!item.allocations?.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-zinc-400">Kỳ này chưa có khoản phân bổ cho người giảng dạy.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h4 className="mb-1 font-semibold text-zinc-900 dark:text-white">Theo dõi quỹ riêng từng học viên</h4>
            <p className="mb-3 text-xs text-zinc-500">Mỗi hàng là một kỳ thuê bao. Quỹ của học viên được tính và phân bổ độc lập trước khi tổng hợp lên bảng phía trên.</p>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-950/40">
                  <tr><th className="px-3 py-2.5">Học viên / Kỳ</th><th>Gói</th><th>Ghi nhận trong tháng</th><th>Quỹ tháng</th><th>Chuyển kỳ trước</th><th>Phút hợp lệ</th><th>Đã chia</th><th>Chuyển kỳ sau</th><th className="pr-3">Về nền tảng</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {termLedgers.map((ledger) => {
                    const term = termById.get(ledger.termId);
                    const overlap = overlapRange(term);
                    return (
                      <tr key={ledger.termId}>
                        <td className="px-3 py-3"><p className="font-medium text-zinc-900 dark:text-white">{ledger.userId}</p><p className="font-mono text-[11px] text-zinc-400">{term?.transactionCode || ledger.termId}</p></td>
                        <td>{term?.planName || '—'}</td>
                        <td className="whitespace-nowrap text-xs"><p>{dateTime(overlap?.startsAt)}</p><p className="mt-1 text-zinc-400">đến {dateTime(overlap?.endsAt)}</p></td><td>{fmt(ledger.recognizedPool)}</td><td>{fmt(ledger.carryIn)}</td><td>{minutes(ledger.totalQualifiedSeconds)}</td><td className="font-semibold">{fmt(ledger.allocatedAmount)}</td><td>{fmt(ledger.carryOut)}</td><td className="pr-3">{fmt(ledger.expiredToAdmin)}</td>
                      </tr>
                    );
                  })}
                  {!termLedgers.length && <tr><td colSpan={9} className="px-3 py-8 text-center text-zinc-400">Không có sổ ghi nhận theo kỳ trong tháng này.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
export const Transactions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') || '';
  const providerFilter = searchParams.get('provider') || '';
  const statusFilter = searchParams.get('status') || '';
  const sortVal = searchParams.get('sort') || 'newest';
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);
  const productType = searchParams.get('type') === 'SUBSCRIPTION' ? 'SUBSCRIPTION' as const : 'COURSE' as const;
  const debouncedSearch = useDebounce(urlSearch.trim(), 300);
  const limit = 10;
  const [draftConfig, setDraftConfig] = useState<IRevenueSplitConfig | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedSettlement, setExpandedSettlement] = useState<string | null>(null);
  const [revenueRange, setRevenueRange] = useState<RevenueRange>('90d');
  const [customRevenueDates, setCustomRevenueDates] = useState<CustomRevenueDates>(getDefaultCustomRevenueDates);
  const revenueDateParams = useMemo(
    () => getRevenueDateParams(revenueRange, customRevenueDates),
    [customRevenueDates, revenueRange],
  );

  const hasActiveFilters = Boolean(urlSearch || providerFilter || statusFilter || sortVal !== 'newest');

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    ['q', 'provider', 'status', 'sort', 'page'].forEach((key) => params.delete(key));
    setSearchParams(params, { replace: true });
  };

  const splitConfigQuery = useAdminRevenueSplitConfig(productType);

  const termsQuery = useAdminSubscriptionTerms();
  const settlementsQuery = useAdminSubscriptionSettlements();
  const settlementMutation = useUpdateSubscriptionSettlement();
  const termById = useMemo(() => new Map(
    (termsQuery.data || []).map((term) => [term._id, term] as const)
  ), [termsQuery.data]);

  const transactionsQuery = useAdminTransactions({
    search: debouncedSearch,
    providerFilter,
    statusFilter,
    sort: sortVal,
    startDate: revenueDateParams.startDate,
    endDate: revenueDateParams.endDate,
    page,
    limit,
    productType,
  });
  const revenueQuery = useAdminRevenueStats({
    startDate: revenueDateParams.startDate,
    endDate: revenueDateParams.endDate,
    productType,
  });

  const currentSplitConfig = useMemo(() => {
    if (draftConfig !== null) return draftConfig;
    if (splitConfigQuery.data) return splitConfigQuery.data;
    return { adminPercent: 25, instructorPercent: 75 };
  }, [draftConfig, splitConfigQuery.data]);

  const updateSplitMutation = useUpdateRevenueSplitConfig(productType);

  const transactions = transactionsQuery.data?.transactions ?? [];
  const totalTransactions = transactionsQuery.data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalTransactions / limit), 1);
  const visiblePages = getVisiblePages(page, totalPages);

  const summary = revenueQuery.data as (IRevenueStats | undefined);
  const totalAmount = transactions.filter((t) => t.status === 'SUCCEEDED').reduce((s, t) => s + t.amount, 0);
  const useDailyRevenueData = revenueRange === '30d' || revenueRange === '90d' || (
    revenueRange === 'custom'
    && Boolean(customRevenueDates.startDate && customRevenueDates.endDate)
    && (new Date(customRevenueDates.endDate).getTime() - new Date(customRevenueDates.startDate).getTime()) <= 120 * 24 * 60 * 60 * 1000
  );
  const revenueChartData = useMemo(() => {
    const source = useDailyRevenueData && summary?.dailyData?.length
      ? summary.dailyData
      : summary?.monthlyData ?? [];
    return source.map((entry) => {
      const key = 'date' in entry ? entry.date : entry.month;
      const [year, month, day] = key.split('-');
      return {
        ...entry,
        label: day ? `${day}/${month}` : `${month}/${year}`,
        fullLabel: day ? `${day}/${month}/${year}` : `${month}/${year}`,
      };
    });
  }, [summary?.dailyData, summary?.monthlyData, useDailyRevenueData]);
  const todayInput = formatInputDate(new Date());

  const resetToFirstPage = () => {
    if (page === 1) return;
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const changeRevenueRange = (range: RevenueRange) => {
    setRevenueRange(range);
    resetToFirstPage();
  };

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const rows: ITransaction[] = [];
      let exportPage = 1;
      let total = 0;
      do {
        const response = await getTransactions({ search: debouncedSearch || undefined, provider: providerFilter || undefined, status: statusFilter || undefined, sort: sortVal, startDate: revenueDateParams.startDate, endDate: revenueDateParams.endDate, productType, page: exportPage, limit: 100 });
        const batch = response.data?.transactions || [];
        total = response.data?.total || 0;
        rows.push(...batch);
        exportPage += 1;
      } while (rows.length < total);
      const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const header = ['Mã giao dịch', 'Người dùng', 'Email', 'Sản phẩm', 'Cổng thanh toán', 'Số tiền', 'Trạng thái', 'Thời gian'];
      const body = rows.map((row) => [row.transactionCode || row.transactionId, row.fullName, row.email, row.subscriptionSnapshot?.name || row.items?.map((item) => item.title).join('; ') || row.course?.title || '', row.provider, row.amount, row.status, getTransactionEffectiveDate(row).toLocaleString('vi-VN')]);
      const csv = '\uFEFF' + [header, ...body].map((line) => line.map(quote).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `giao-dich-${productType === 'COURSE' ? 'mua-dut' : 'thue-bao'}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Lịch sử Giao dịch</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Theo dõi thanh toán qua VNPay/MoMo và tỷ lệ chia doanh thu cho từng giao dịch.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => void Promise.all([transactionsQuery.refetch(), revenueQuery.refetch(), splitConfigQuery.refetch(), termsQuery.refetch(), settlementsQuery.refetch()])} disabled={transactionsQuery.isFetching || revenueQuery.isFetching || splitConfigQuery.isFetching || termsQuery.isFetching || settlementsQuery.isFetching} className="gap-2" title="Làm mới dữ liệu giao dịch"><RefreshCw className={`h-4 w-4 ${transactionsQuery.isFetching || revenueQuery.isFetching || splitConfigQuery.isFetching || termsQuery.isFetching || settlementsQuery.isFetching ? 'animate-spin' : ''}`} /> Làm mới</Button><Button id="btn-export-transactions" variant="outline" onClick={exportCsv} disabled={isExporting} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
        </Button></div>
      </div>

      <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {(['COURSE', 'SUBSCRIPTION'] as const).map((type) => <Button key={type} variant={productType === type ? 'default' : 'ghost'} className="rounded-lg" onClick={() => { const next = new URLSearchParams(searchParams); next.set('type', type); next.set('page', '1'); setSearchParams(next); setDraftConfig(null); }}>{type === 'COURSE' ? 'Mua đứt' : 'Thuê bao'}</Button>)}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <CalendarRange className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Phạm vi báo cáo</h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Điều khiển KPI, biểu đồ, danh sách giao dịch và file CSV.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2" aria-label="Khoảng thời gian doanh thu">
              {revenueRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={revenueRange === option.value ? 'default' : 'outline'}
                  className="rounded-lg"
                  onClick={() => changeRevenueRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {revenueRange === 'custom' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-zinc-500">
                  <span>Từ ngày</span>
                  <Input
                    type="date"
                    value={customRevenueDates.startDate}
                    max={customRevenueDates.endDate || todayInput}
                    onChange={(event) => {
                      setCustomRevenueDates((current) => ({ ...current, startDate: event.target.value }));
                      resetToFirstPage();
                    }}
                    className="h-9 rounded-lg"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-zinc-500">
                  <span>Đến ngày</span>
                  <Input
                    type="date"
                    value={customRevenueDates.endDate}
                    min={customRevenueDates.startDate || undefined}
                    max={todayInput}
                    onChange={(event) => {
                      setCustomRevenueDates((current) => ({ ...current, endDate: event.target.value }));
                      resetToFirstPage();
                    }}
                    className="h-9 rounded-lg"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
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
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Tỷ lệ người giảng dạy</label>
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
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">Tổng doanh thu</p>
                  <p className="mt-1 truncate text-xl font-bold text-zinc-900 dark:text-white">{fmt(summary?.totalRevenue ?? 0)}</p>
                </div>
                <CircleDollarSign className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-700" />
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">Doanh thu nền tảng</p>
                  <p className="mt-1 truncate text-xl font-bold text-zinc-900 dark:text-white">{fmt(summary?.totalAdminRevenue ?? 0)}</p>
                </div>
                <CreditCard className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-700" />
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{productType === 'SUBSCRIPTION' ? 'Tổng quỹ giảng dạy' : 'Thu nhập từ giảng dạy'}</p>
                  <p className="mt-1 truncate text-xl font-bold text-zinc-900 dark:text-white">{fmt(summary?.totalInstructorRevenue ?? 0)}</p>
                </div>
                <Users className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-700" />
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">Giao dịch thành công</p>
                  <p className="mt-1 truncate text-xl font-bold text-zinc-900 dark:text-white">{summary?.successfulTransactions ?? 0}</p>
                </div>
                <CheckCircle className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Xu hướng doanh thu</h2>
            {revenueQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tổng doanh thu và tỷ lệ phân bổ trong phạm vi báo cáo đã chọn.
          </p>
        </div>

        <div className="mt-5 min-h-80">
          {revenueChartData.length > 0 ? (
            <ChartContainer config={revenueChartConfig} className="h-80 w-full">
              <ComposedChart data={revenueChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminTransactionRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} minTickGap={24} />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} tickFormatter={compactCurrency} width={68} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" labelKey="fullLabel" formatter={(value) => fmt(value)} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2.5} fill="url(#adminTransactionRevenue)" />
                <Line type="monotone" dataKey="adminRevenue" stroke="var(--color-adminRevenue)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="instructorRevenue" stroke="var(--color-instructorRevenue)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ChartContainer>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center dark:border-zinc-700 dark:bg-zinc-950/40">
              <TrendingUp className="mb-3 h-9 w-9 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Chưa có doanh thu trong khoảng thời gian này.</p>
              <p className="mt-1 text-xs text-zinc-400">Hãy chọn khoảng thời gian khác để xem xu hướng.</p>
            </div>
          )}
        </div>
      </section>


      {productType === 'SUBSCRIPTION' && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Đối soát và phân bổ quỹ thuê bao</h2>
            <p className="mt-1 text-sm text-zinc-500">Tự chốt lúc 02:00 ngày 1 theo giờ Việt Nam. Quỹ được tính riêng cho từng kỳ học viên, sau đó mới tổng hợp theo người giảng dạy và khóa học.</p>
          </div>
          {(settlementsQuery.data || []).map((item) => (
            <SubscriptionSettlementCard
              key={item._id}
              item={item}
              expanded={expandedSettlement === item._id}
              onToggle={() => setExpandedSettlement((current) => current === item._id ? null : item._id)}
              termById={termById}
              isUpdating={settlementMutation.isPending}
              onMakeAvailable={() => settlementMutation.mutate({ period: item.period, status: 'AVAILABLE' })}
            />
          ))}
          {!settlementsQuery.isLoading && !(settlementsQuery.data || []).length && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
              Chưa có đối soát thuê bao đã chốt.
            </div>
          )}
        </section>
      )}

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        {/* Search */}
        <div className="flex w-full items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <Input
            className="bg-transparent text-sm flex-1 border-0 shadow-none px-0 py-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-0"
            placeholder="Mã GD, tên, email, tên khóa..."
            value={urlSearch}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('q', e.target.value);
              else params.delete('q');
              params.delete('page');
              setSearchParams(params, { replace: true });
            }}
          />
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="h-10 shrink-0 gap-1.5 rounded-lg border-red-200/50 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/20"
            >
              <X className="h-3.5 w-3.5" />
              {'X\u00f3a b\u1ed9 l\u1ecdc'}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <Filter className="hidden h-4 w-4 shrink-0 text-zinc-400 sm:block" />
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            label="Tất cả cổng"
            value={providerFilter}
            options={providerFilters}
            onChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) params.set('provider', value);
              else params.delete('provider');
              params.delete('page');
              setSearchParams(params, { replace: true });
            }}
          />
          <FilterSelect
            label="Tất cả trạng thái"
            value={statusFilter}
            options={statusFilters}
            onChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) params.set('status', value);
              else params.delete('status');
              params.delete('page');
              setSearchParams(params, { replace: true });
            }}
          />
          <FilterSelect
            label="Sắp xếp"
            value={sortVal}
            options={[
              { value: 'newest', label: 'Mới nhất' },
              { value: 'oldest', label: 'Cũ nhất' },
              { value: 'amount_desc', label: 'Số tiền cao nhất' },
              { value: 'amount_asc', label: 'Số tiền thấp nhất' },
            ]}
            onChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value === 'newest') params.delete('sort');
              else params.set('sort', value);
              params.delete('page');
              setSearchParams(params, { replace: true });
            }}
          />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Filter className="h-4 w-4" />
            {totalTransactions.toLocaleString('vi-VN')} giao dịch
          </div>
          <div className="h-4 w-4">
            {transactionsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          </div>
        </div>
        <div className="min-h-[580px] overflow-x-auto">
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
                const sc = statusConfig[t.status] || { label: t.status || 'Không xác định', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-zinc-100 text-zinc-600' };
                const pb = providerBadge[t.provider] || { label: t.provider || 'Khác', cls: 'bg-zinc-100 text-zinc-600' };
                const actualAmount = t.amount;
                const gross = t.grossAmount ?? t.amount;
                const discount = t.discountAmount ?? 0;
                const adminShare = t.adminAmount ?? Math.round(actualAmount * ((currentSplitConfig.adminPercent || 0) / 100));
                const instructorShare = t.instructorAmount ?? (actualAmount - adminShare);
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
                    <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-64">
                      {getTransactionKind(t) === 'COURSE' ? (
                        <div className="min-w-0">
                          <div className="mb-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                            Khóa học
                          </div>
                          {t.items?.length ? (
                            <>
                              <span className="line-clamp-2 font-medium text-zinc-800 dark:text-zinc-100" title={t.items[0].title}>{t.items[0].title}</span>
                              {t.items.length > 1 && <span className="text-xs text-zinc-400">+{t.items.length - 1} khóa học khác</span>}
                            </>
                          ) : t.course ? (
                            <span className="line-clamp-2 font-medium text-zinc-800 dark:text-zinc-100" title={t.course.title}>{t.course.title}</span>
                          ) : (
                            <span className="text-xs text-zinc-400">Mua khóa học</span>
                          )}
                        </div>
                      ) : getTransactionKind(t) === 'SUBSCRIPTION' ? (
                        <div className="min-w-0">
                          <div className="mb-1 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                            Thuê bao
                          </div>
                          {(() => {
                            const subName = t.subscriptionSnapshot?.name || (t.subscriptionSnapshot?.planType === 'YEARLY' || t.plan === 'YEARLY' ? 'Thuê bao 1 năm' : 'Thuê bao 1 tháng');
                            return (
                              <span className="line-clamp-2 font-medium text-violet-600 dark:text-violet-400" title={subName}>
                                {subName}
                              </span>
                            );
                          })()}
                          <span className="text-xs text-zinc-400">
                            {t.subscriptionSnapshot?.planType === 'YEARLY' || t.plan === 'YEARLY' ? 'Gói năm' : 'Gói tháng'}
                            {t.subscriptionSnapshot?.durationDays ? ` · ${t.subscriptionSnapshot.durationDays} ngày` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">Không xác định</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pb.cls}`}>{pb.label}</span></td>
                    <td className="px-4 py-3.5 text-sm">
                      <div className="font-bold text-zinc-900 dark:text-white">{fmt(actualAmount)}</div>
                      {discount > 0 && (
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="line-through">{fmt(gross)}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            (Giảm {fmt(discount)}{t.couponSnapshot?.code ? ` mã ${t.couponSnapshot.code}` : ''})
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-zinc-500 mt-1">QTV {fmt(adminShare)} · GV {fmt(instructorShare)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>{sc.icon}{sc.label}</span>
                      {t.status === 'REFUNDED' && t.refundReason && (
                        <p className="mt-1 max-w-40 text-xs text-zinc-500" title={t.refundReason}>{t.refundReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                      <p>{getTransactionEffectiveDate(t).toLocaleDateString('vi-VN')}</p>
                      <p>{getTransactionEffectiveDate(t).toLocaleTimeString('vi-VN')}</p>
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
                    const params = new URLSearchParams(searchParams);
                    const nextPage = Math.max(page - 1, 1);
                    if (nextPage > 1) params.set('page', nextPage.toString());
                    else params.delete('page');
                    setSearchParams(params, { replace: true });
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
                        const params = new URLSearchParams(searchParams);
                        if (item > 1) params.set('page', item.toString());
                        else params.delete('page');
                        setSearchParams(params, { replace: true });
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
                    const params = new URLSearchParams(searchParams);
                    const nextPage = Math.min(page + 1, totalPages);
                    if (nextPage > 1) params.set('page', nextPage.toString());
                    else params.delete('page');
                    setSearchParams(params, { replace: true });
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      {productType === 'SUBSCRIPTION' && <>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="mb-4 text-lg font-bold">Kỳ thuê bao gần đây</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-zinc-500"><th className="py-2">Mã giao dịch</th><th>Gói</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th></tr></thead><tbody>{(termsQuery.data || []).slice(0, 30).map((term) => <tr key={term._id} className="border-b border-zinc-100 dark:border-zinc-800"><td className="py-3">{term.transactionCode}</td><td>{term.planName}</td><td>{new Date(term.startsAt).toLocaleString('vi-VN')}</td><td>{new Date(term.endsAt).toLocaleString('vi-VN')}</td><td className="font-medium">{term.status}</td></tr>)}</tbody></table></div></section>

      </>}
    </div>
  );
};

