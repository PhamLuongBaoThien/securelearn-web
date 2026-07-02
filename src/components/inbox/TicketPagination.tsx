import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
export function TicketPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (value) =>
      value === 1 || value === totalPages || Math.abs(value - page) <= 1,
  );
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Trước"
            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            onClick={(event) => {
              event.preventDefault();
              if (page > 1) onChange(page - 1);
            }}
          />
        </PaginationItem>
        {pages.map((value) => (
          <PaginationItem key={value}>
            <PaginationLink
              href="#"
              isActive={value === page}
              onClick={(event) => {
                event.preventDefault();
                onChange(value);
              }}
            >
              {value}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            text="Sau"
            className={
              page >= totalPages ? "pointer-events-none opacity-50" : ""
            }
            onClick={(event) => {
              event.preventDefault();
              if (page < totalPages) onChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
