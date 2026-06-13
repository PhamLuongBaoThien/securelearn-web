import React, { useMemo, useState } from 'react';
import { Search, Filter, DollarSign, CreditCard, Download, CheckCircle, XCircle, Clock, Percent, Save } from 'lucide-react';
import type { ITransaction, PaymentProvider, TransactionStatus, IRevenueSplitConfig, IRevenueStats } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
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
};

const providerBadge: Record<PaymentProvider, { label: string; cls: string }> = {
  VNPAY: { label: 'VNPay', cls: 'bg-blue-100 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400' },
  MOMO: { label: 'MoMo', cls: 'bg-pink-100 dark:bg-pink-400/10 text-pink-700 dark:text-pink-400' },
  STRIPE: { label: 'Stripe', cls: 'bg-violet-100 dark:bg-violet-400/10 text-violet-700 dark:text-violet-400' },
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

export const Transactions: React.FC = () => {
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page] = useState(1);
  const [limit] = useState(20);
  const [draftConfig, setDraftConfig] = useState<IRevenueSplitConfig | null>(null);

  const splitConfigQuery = useAdminRevenueSplitConfig();
  const revenueQuery = useAdminRevenueStats();
  const transactionsQuery = useAdminTransactions({ search, providerFilter, statusFilter, page, limit });

  const currentSplitConfig = useMemo(() => {
    if (draftConfig !== null) return draftConfig;
    if (splitConfigQuery.data) return splitConfigQuery.data;
    return { adminPercent: 25, instructorPercent: 75 };
  }, [draftConfig, splitConfigQuery.data]);

  const updateSplitMutation = useUpdateRevenueSplitConfig();

  const filtered = useMemo(() => {
    const transactions = transactionsQuery.data?.transactions ?? [];
    return transactions.filter((t) => {
      const transactionCode = t.transactionCode || t.transactionId;
      const matchSearch =
        !search ||
        transactionCode.toLowerCase().includes(search.toLowerCase()) ||
        t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        t.items?.some((item) => item.title.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [search, transactionsQuery.data?.transactions]);

  const summary = revenueQuery.data as IRevenueStats | undefined;
  const totalAmount = filtered.filter((t) => t.status === 'SUCCEEDED').reduce((s, t) => s + (t.grossAmount ?? t.amount), 0);

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
          <Select className="w-[140px] px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none text-zinc-700 dark:text-zinc-300" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="">Tất cả cổng</option>
            <option value="VNPAY">VNPay</option>
            <option value="MOMO">MoMo</option>
          </Select>
          <Select className="w-[160px] px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none text-zinc-700 dark:text-zinc-300" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả TT</option>
            <option value="SUCCEEDED">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="PENDING">Đang xử lý</option>
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Mã giao dịch', 'Người dùng', 'Nội dung', 'Cổng TT', 'Tổng / Chia', 'Trạng thái', 'Thời gian'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((t: ITransaction) => {
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
                      {t.course ? (
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
                    <td className="px-4 py-3.5"><span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>{sc.icon}{sc.label}</span></td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                      <p>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</p>
                      <p>{new Date(t.createdAt).toLocaleTimeString('vi-VN')}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <CreditCard className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Không có giao dịch nào.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            {filtered.length} giao dịch · Tổng chia: <strong className="text-emerald-600">{fmt(totalAmount)}</strong>
          </span>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <DollarSign className="w-3.5 h-3.5" />
            Số liệu lấy từ payment-service
          </div>
        </div>
      </div>
    </div>
  );
};
