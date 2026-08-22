// Trang/giao diện: Triển khai nhóm trang danh sách và chi tiết chính sách (route: /policies và /policies/:slug).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Loader2, Search, Shield } from 'lucide-react';
import { usePublicPolicies } from '@/hooks/usePolicies';
import { Input } from '@/components/ui/input';

export const Policies: React.FC = () => {
  const { data, isLoading, isError } = usePublicPolicies();
  const [search, setSearch] = useState('');
  const policies = useMemo(() => data || [], [data]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return policies;
    return policies.filter((policy) => [policy.title, policy.summary, policy.slug].some((value) => value?.toLowerCase().includes(keyword)));
  }, [policies, search]);

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-zinc-500">Đang tải chính sách...</span></div>;
  }

  if (isError) {
    return <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <Shield className="mx-auto mb-4 h-12 w-12 text-red-400" />
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Không thể tải chính sách</h2>
      <p className="mt-2 text-zinc-500">Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.</p>
    </div>;
  }
  return (
    <div className="relative -mt-[88px] min-h-[70vh] bg-zinc-50 dark:bg-zinc-950">
      <section className="bg-zinc-900 px-4 pb-16 pt-[120px] text-zinc-50 border-b border-zinc-800 lg:pb-20 lg:pt-[136px]">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">Chính sách & Điều khoản</h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">Các quy định và chính sách áp dụng khi bạn sử dụng nền tảng SecureLearn.</p>
          <div className="relative mt-8 w-full max-w-md text-zinc-900 dark:text-zinc-100">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input className="h-12 rounded-2xl border-zinc-200 bg-white pl-12 text-base shadow-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Tìm kiếm chính sách..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1100px] px-6 py-12 lg:py-16">
        {!filtered.length ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{search ? 'Không tìm thấy chính sách phù hợp' : 'Chưa có chính sách nào'}</h2>
            <p className="mt-2 text-zinc-500">{search ? 'Hãy thử từ khóa khác.' : 'Các chính sách sẽ được cập nhật sớm.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((policy) => (
              <Link key={policy._id} to={`/policies/${policy.slug}`} className="group flex min-h-40 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-primary/40">
                <div>
                  <div className="mb-2 flex items-center">
                    <h2 className="font-semibold text-zinc-900 group-hover:text-primary dark:text-white">{policy.title}</h2>
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">{policy.summary || 'Xem chi tiết để biết thêm thông tin.'}</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span>Cập nhật {new Date(policy.updatedAt).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Xem chi tiết <ChevronRight className="h-3 w-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
