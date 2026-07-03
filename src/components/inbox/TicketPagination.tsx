import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

const getVisiblePages = (page: number, totalPages: number): PageItem[] => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
    .filter(value => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const result: PageItem[] = [];
  pages.forEach((value, index) => {
    const previous = pages[index - 1];
    if (previous && value - previous > 1) {
      result.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    result.push(value);
  });
  return result;
};

type Props = {
  page: number;
  totalPages: number;
  total: number;
  visibleCount: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export function TicketPagination({
  page,
  totalPages,
  total,
  visibleCount,
  loading = false,
  onPageChange,
}: Props) {
  if (totalPages <= 1) {
    return total > 0 ? (
      <p className="border-t border-border/60 px-4 py-3 text-center text-xs text-muted-foreground">
        Hiển thị {visibleCount} / {total} yêu cầu
      </p>
    ) : null;
  }

  const changePage = (event: React.MouseEvent<HTMLAnchorElement>, nextPage: number) => {
    event.preventDefault();
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    onPageChange(nextPage);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-center text-xs text-muted-foreground sm:text-left">
        Hiển thị {visibleCount} / {total} yêu cầu · Trang {page}/{totalPages}
      </span>
      <Pagination className="mx-0 w-auto justify-center sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="Trước"
              aria-disabled={page <= 1 || loading}
              className={page <= 1 || loading ? 'pointer-events-none opacity-50 text-xs rounded-xl' : 'cursor-pointer text-xs rounded-xl'}
              onClick={event => changePage(event, page - 1)}
            />
          </PaginationItem>
          {getVisiblePages(page, totalPages).map(item => (
            <PaginationItem key={item}>
              {typeof item === 'number' ? (
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  aria-label={`Đi tới trang ${item}`}
                  className="cursor-pointer rounded-xl text-xs"
                  onClick={event => changePage(event, item)}
                >
                  {item}
                </PaginationLink>
              ) : (
                <PaginationEllipsis className="h-9 w-9 text-muted-foreground" />
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              text="Sau"
              aria-disabled={page >= totalPages || loading}
              className={page >= totalPages || loading ? 'pointer-events-none opacity-50 text-xs rounded-xl' : 'cursor-pointer text-xs rounded-xl'}
              onClick={event => changePage(event, page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
