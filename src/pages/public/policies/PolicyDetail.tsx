import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight, FileText, Home, Loader2, Shield } from 'lucide-react';
import { usePublicPolicyBySlug } from '@/hooks/usePolicies';
import { Button } from '@/components/ui/button';
/** Trích heading h2/h3 từ HTML content để build Table of Contents */
function extractHeadings(html: string): Array<{ id: string; text: string; level: number }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings: Array<{ id: string; text: string; level: number }> = [];
  doc.querySelectorAll('h2, h3').forEach((el, i) => {
    const text = el.textContent?.trim();
    if (!text) return;
    const id = `heading-${i}`;
    headings.push({ id, text, level: el.tagName === 'H2' ? 2 : 3 });
  });
  return headings;
}

/** Inject id attributes vào h2/h3 tags trong HTML content */
function injectHeadingIds(html: string): string {
  let index = 0;
  return html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_match, tag, attrs, inner) => {
    const id = `heading-${index++}`;
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
}

export const PolicyDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: policy, isLoading, isError, error } = usePublicPolicyBySlug(slug || '');

  // Scroll top on mount
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  const headings = policy?.content ? extractHeadings(policy.content) : [];
  const processedContent = policy?.content ? injectHeadingIds(policy.content) : '';
  const formattedDate = policy?.updatedAt
    ? new Date(policy.updatedAt).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : '';

  // ──── Loading ────
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-zinc-500">Đang tải chính sách...</span>
      </div>
    );
  }

  // ──── 404 / Error ────
  if (isError || !policy) {
    const errorMessage = error instanceof Error ? error.message : '';
    const is404 = errorMessage.includes('404') || errorMessage.includes('Không tìm thấy');
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        {is404 ? (
          <>
            <FileText className="mx-auto mb-4 h-14 w-14 text-zinc-300" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Không tìm thấy chính sách</h1>
            <p className="mt-2 text-zinc-500">Chính sách này không tồn tại hoặc đã bị gỡ bỏ.</p>
          </>
        ) : (
          <>
            <Shield className="mx-auto mb-4 h-14 w-14 text-red-400" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Đã xảy ra lỗi</h1>
            <p className="mt-2 text-zinc-500">Không thể tải nội dung chính sách. Vui lòng thử lại sau.</p>
          </>
        )}
        <Link to="/policies">
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách chính sách
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="relative -mt-[88px] min-h-[70vh] bg-zinc-50 dark:bg-zinc-950">
      {/* ──── Header (includes Breadcrumb and Policy Title) ──── */}
      <header className="bg-zinc-900 text-zinc-300 border-b border-zinc-800 pt-[120px] pb-10 lg:pb-14 lg:pt-[136px]">
        {/* Breadcrumb inside the dark header */}
        <div className="mx-auto max-w-[1200px] px-6 mb-6 flex items-center gap-2 text-sm text-zinc-400">
          <Link to="/" className="flex items-center gap-1 transition-colors hover:text-white">
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <Link to="/policies" className="transition-colors hover:text-white">Chính sách</Link>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <span className="truncate text-zinc-300">{policy.title}</span>
        </div>

        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              Cập nhật: {formattedDate}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
            {policy.title}
          </h1>
          {policy.summary && (
            <p className="mt-3 max-w-2xl text-lg text-zinc-400">{policy.summary}</p>
          )}
        </div>
      </header>

      {/* ──── Content + Sidebar ──── */}
      <div className="mx-auto max-w-[1200px] px-6 py-10 lg:py-14">
        <div className="flex gap-12 lg:gap-16">
          {/* Main content */}
          <article
            className="prose prose-zinc dark:prose-invert min-w-0 max-w-none flex-1 prose-headings:scroll-mt-28 prose-headings:font-bold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-li:marker:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* Table of Contents sidebar */}
          {headings.length > 2 && (
            <aside className="hidden w-56 shrink-0 xl:block">
              <nav className="sticky top-28">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Mục lục</p>
                <ul className="space-y-1 border-l-2 border-zinc-200 dark:border-zinc-800">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`block border-l-2 -ml-[2px] py-1.5 text-sm transition-colors hover:border-primary hover:text-primary ${
                          h.level === 2
                            ? 'border-transparent pl-4 font-medium text-zinc-600 dark:text-zinc-400'
                            : 'border-transparent pl-7 text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>

        {/* Back link */}
        <div className="mt-14 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <Link to="/policies">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Xem tất cả chính sách
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};



