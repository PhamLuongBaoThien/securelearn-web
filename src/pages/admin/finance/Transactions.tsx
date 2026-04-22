import React, { useState } from 'react';
import { Search, Filter, DollarSign, CreditCard, Download, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import type { ITransaction, PaymentProvider, TransactionStatus } from '@/types/admin.types';

const MOCK_TRANSACTIONS: ITransaction[] = [
  { _id: 't1', transactionId: 'VNP-2026042100123', user: { _id: 'u1', email: 'nguyenvana@gmail.com', fullName: 'Nguyễn Văn A' }, course: { _id: 'c1', title: 'Ethical Hacking: Từ Zero đến Chuyên Gia' }, amount: 899000, provider: 'VNPAY', status: 'SUCCESS', paymentMethod: 'ATM/VISA', ipnReceivedAt: '2026-04-21T10:32:00Z', createdAt: '2026-04-21T10:30:00Z', updatedAt: '2026-04-21T10:32:00Z' },
  { _id: 't2', transactionId: 'MM-2026042100456', user: { _id: 'u6', email: 'dinhthif@gmail.com', fullName: 'Đinh Thị F' }, course: { _id: 'c2', title: 'React & TypeScript Masterclass 2026' }, amount: 699000, provider: 'MOMO', status: 'SUCCESS', paymentMethod: 'MoMo Wallet', ipnReceivedAt: '2026-04-21T09:18:00Z', createdAt: '2026-04-21T09:17:00Z', updatedAt: '2026-04-21T09:18:00Z' },
  { _id: 't3', transactionId: 'VNP-2026042000789', user: { _id: 'u1', email: 'nguyenvana@gmail.com', fullName: 'Nguyễn Văn A' }, plan: 'MONTHLY', amount: 199000, provider: 'VNPAY', status: 'SUCCESS', paymentMethod: 'QR Code', ipnReceivedAt: '2026-04-20T15:10:00Z', createdAt: '2026-04-20T15:09:00Z', updatedAt: '2026-04-20T15:10:00Z' },
  { _id: 't4', transactionId: 'MM-2026041900321', user: { _id: 'u3', email: 'lebinhc@gmail.com', fullName: 'Lê Bình C' }, course: { _id: 'c3', title: 'Docker & Kubernetes cho Developers' }, amount: 1199000, provider: 'MOMO', status: 'FAILED', paymentMethod: 'MoMo Wallet', createdAt: '2026-04-19T14:00:00Z', updatedAt: '2026-04-19T14:01:00Z' },
  { _id: 't5', transactionId: 'VNP-2026041800654', user: { _id: 'u6', email: 'dinhthif@gmail.com', fullName: 'Đinh Thị F' }, plan: 'YEARLY', amount: 1499000, provider: 'VNPAY', status: 'PENDING', paymentMethod: 'ATM', createdAt: '2026-04-18T11:30:00Z', updatedAt: '2026-04-18T11:30:00Z' },
];

const statusConfig: Record<TransactionStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  SUCCESS: { label: 'Thành công', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' },
  FAILED: { label: 'Thất bại', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400' },
  PENDING: { label: 'Đang xử lý', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400' },
  REFUNDED: { label: 'Hoàn tiền', icon: <RefreshCw className="w-3.5 h-3.5" />, cls: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400' },
};

const providerBadge: Record<PaymentProvider, { label: string; cls: string }> = {
  VNPAY: { label: 'VNPay', cls: 'bg-blue-100 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400' },
  MOMO: { label: 'MoMo', cls: 'bg-pink-100 dark:bg-pink-400/10 text-pink-700 dark:text-pink-400' },
  STRIPE: { label: 'Stripe', cls: 'bg-violet-100 dark:bg-violet-400/10 text-violet-700 dark:text-violet-400' },
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

export const Transactions: React.FC = () => {
  const [transactions] = useState<ITransaction[]>(MOCK_TRANSACTIONS);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = transactions.filter((t) => {
    const matchSearch = !search || t.transactionId.includes(search) || t.user.fullName.toLowerCase().includes(search.toLowerCase()) || t.user.email.toLowerCase().includes(search.toLowerCase());
    const matchProvider = !providerFilter || t.provider === providerFilter;
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchProvider && matchStatus;
  });

  const totalAmount = filtered.filter((t) => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0);
  const successCount = filtered.filter((t) => t.status === 'SUCCESS').length;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Lịch sử Giao dịch</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Theo dõi thanh toán qua VNPay/MoMo và trạng thái xử lý sự kiện từ RabbitMQ.</p>
        </div>
        <button id="btn-export-transactions" className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng giao dịch', value: transactions.length, sub: 'tất cả', color: 'text-zinc-900 dark:text-white' },
          { label: 'Thành công', value: successCount, sub: fmt(totalAmount), color: 'text-emerald-500' },
          { label: 'Thất bại', value: transactions.filter((t) => t.status === 'FAILED').length, sub: 'cần kiểm tra', color: 'text-red-500' },
          { label: 'Đang xử lý', value: transactions.filter((t) => t.status === 'PENDING').length, sub: 'chờ IPN', color: 'text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input className="bg-transparent text-sm flex-1 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400" placeholder="Mã GD, tên, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none text-zinc-700 dark:text-zinc-300" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="">Tất cả cổng</option>
            <option value="VNPAY">VNPay</option>
            <option value="MOMO">MoMo</option>
            <option value="STRIPE">Stripe</option>
          </select>
          <select className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none text-zinc-700 dark:text-zinc-300" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả TT</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="REFUNDED">Hoàn tiền</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Mã giao dịch', 'Người dùng', 'Nội dung', 'Cổng TT', 'Số tiền', 'Trạng thái', 'Thời gian'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((t) => {
                const sc = statusConfig[t.status];
                const pb = providerBadge[t.provider];
                return (
                  <tr key={t._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-zinc-600 dark:text-zinc-400">{t.transactionId}</code>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.user.fullName}</p>
                      <p className="text-xs text-zinc-400">{t.user.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-40">
                      {t.course ? <span className="truncate block">{t.course.title}</span> : <span className="text-violet-500 font-medium">{t.plan === 'MONTHLY' ? 'Thuê bao 1 tháng' : t.plan === 'YEARLY' ? 'Thuê bao 1 năm' : t.plan}</span>}
                    </td>
                    <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pb.cls}`}>{pb.label}</span></td>
                    <td className="px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white">{fmt(t.amount)}</td>
                    <td className="px-4 py-3.5"><span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>{sc.icon}{sc.label}</span></td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400">
                      <p>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</p>
                      <p>{new Date(t.createdAt).toLocaleTimeString('vi-VN')}</p>
                      {t.ipnReceivedAt && <p className="text-emerald-500">IPN ✓</p>}
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
          <span className="text-sm text-zinc-500">{filtered.length} giao dịch · Thành công: <strong className="text-emerald-600">{fmt(totalAmount)}</strong></span>
          <div className="flex items-center gap-2 text-xs text-zinc-400"><DollarSign className="w-3.5 h-3.5" />IPN từ RabbitMQ</div>
        </div>
      </div>
    </div>
  );
};
