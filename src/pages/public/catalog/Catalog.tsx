import { useState, useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CourseCard } from "@/components/ui/CourseCard";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  SlidersHorizontal,
  Check,
  Star,
  ChevronDown,
  X,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Collapsible Filter Section Component với Card Styling ─────────────────────
function SidebarFilterSection({
  title,
  badgeCount,
  children,
  defaultOpen = false,
}: {
  title: string;
  badgeCount?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-4 transition-all hover:border-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full font-semibold text-sm text-foreground flex items-center justify-between text-left group focus-visible:outline-none"
      >
        <span className="flex items-center gap-2">
          {title}
          {Boolean(badgeCount) && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-bold bg-primary/10 text-primary border-0 rounded-full">
              {badgeCount}
            </Badge>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="mt-3.5 pt-3 border-t border-border/50">{children}</div>}
    </div>
  );
}
import { useCatalog } from "@/hooks/useCatalog";
import { usePublicCourseCategories } from "@/hooks/usePublicCourseCategories";
import {
  CategoryTreeFilter,
  InlinePriceRange,
  DurationFilter,
} from "./CatalogFilters";
import {
  normalizeCategorySelection,
  getMinimalCategoryChips,
  deselectCategoryFromTree,
  DURATION_OPTIONS,
  type PriceRangeValue,
} from "@/lib/courseUtils";
import { CatalogFilterDrawer } from "./CatalogFilterDrawer";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  PRICE_MAX,
  DEFAULT_PRICE,
  LEVEL_OPTIONS,
} from "./constants";
import { CourseCardSkeleton } from "./CourseCardSkeleton";
import { SortDropdown } from "./SortDropdown";
import { useCourseCouponPreviews } from "@/hooks/useCourseCouponPreviews";
import { useEnrolledCourses } from "@/hooks/useEnrolledCourses";
import { useAppSelector } from "@/app/hooks";
import type { ICourseCategoryNode } from "@/services/courseApi";


// ── Empty State Illustration SVG ──────────────────────────────────────────────
function EmptyStateIllustration() {
  return (
    <div className="relative w-48 h-48 mb-2 flex items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >

        {/* Các vòng sóng lan tỏa */}
        <circle
          cx="100"
          cy="100"
          r="60"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-primary/30 animate-[spin_40s_linear_infinite]"
        />
        <circle
          cx="100"
          cy="100"
          r="45"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          className="text-primary/20 animate-[spin_20s_linear_infinite_reverse]"
        />

        {/* Các chấm lấp lánh nhỏ */}
        <circle cx="50" cy="60" r="3" fill="#3B82F6" className="animate-pulse" />
        <circle cx="150" cy="70" r="2" fill="#8B5CF6" className="animate-pulse" style={{ animationDelay: '1s' }} />
        <circle cx="60" cy="130" r="2.5" fill="#EC4899" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
        <circle cx="140" cy="140" r="3.5" fill="#F59E0B" className="animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Hình ảnh Ngôi sao nhỏ */}
        <path
          d="M100 25L102 31L108 33L102 35L100 41L98 35L92 33L98 31Z"
          fill="#F59E0B"
          className="animate-bounce"
          style={{ animationDuration: '2s' }}
        />
        
        {/* Quyển sách mở nằm ở tâm */}
        <g transform="translate(60, 65)">
          <path
            d="M10 55C10 55 30 50 40 55C50 50 70 55 70 55V15C70 15 50 10 40 15C30 10 10 15 10 15V55Z"
            fill="var(--background)"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            className="text-primary"
          />
          <path
            d="M40 15V55"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
          />
          {/* Các dòng chữ giả dạng sóng */}
          <path d="M18 23H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
          <path d="M18 31H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
          <path d="M18 39H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
          <path d="M48 23H62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
          <path d="M48 31H58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
          <path d="M48 39H62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
        </g>

        {/* Chiếc kính lúp bay quanh/đè lên quyển sách */}
        <g className="animate-bounce" style={{ animationDuration: '4s' }} transform="translate(10, 0)">
          {/* Tay cầm kính lúp */}
          <path
            d="M125 125L145 145"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary"
          />
          {/* Khung kính lúp */}
          <circle
            cx="110"
            cy="110"
            r="20"
            fill="var(--background)"
            stroke="currentColor"
            strokeWidth="6"
            className="text-primary"
          />
          {/* Mặt kính phản quang */}
          <path
            d="M98 108A14 14 0 0 1 112 94"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-primary/50"
          />
          {/* Dấu chấm hỏi bên trong kính lúp */}
          <text
            x="110"
            y="116"
            fontSize="18"
            fontWeight="bold"
            fill="currentColor"
            textAnchor="middle"
            className="text-primary fill-current"
          >
            ?
          </text>
        </g>


      </svg>
    </div>
  );
}


type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

function normalizePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function getVisiblePages(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
    .filter((value) => value >= 1 && value <= totalPages)
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
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: categoryTree = [] } = usePublicCourseCategories();

  // URL -> State initialization
  const categoryParam = searchParams.get("category") || "";
  const levelParam = searchParams.get("level") || "";
  const ratingParam = searchParams.get("rating") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const searchParam = searchParams.get("search") || "";
  const durationParam = searchParams.get("duration") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const pageParam = normalizePage(searchParams.get("page"));

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? categoryParam.split(",") : []
  );
  const [selectedLevels,     setSelectedLevels]     = useState<string[]>(
    levelParam ? levelParam.split(",") : []
  );
  const [selectedRatings,    setSelectedRatings]    = useState<string[]>(
    ratingParam ? ratingParam.split(",") : []
  );
  const [priceRange,         setPriceRange]         = useState<PriceRangeValue>({
    min: minPriceParam ? Number(minPriceParam) : 0,
    max: maxPriceParam ? Number(maxPriceParam) : PRICE_MAX,
  });
  const [selectedDuration,   setSelectedDuration]   = useState<string>(durationParam);
  const [sortKey,            setSortKey]            = useState(sortParam);
  const [page,               setPage]               = useState(pageParam);
  const [isDrawerOpen,       setIsDrawerOpen]       = useState(false);
  const catalogGridRef = useRef<HTMLDivElement>(null);

  // URL -> State sync (khi URL thay đổi từ bên ngoài hoặc khi tải xong categoryTree)
  useEffect(() => {
    let newCat = categoryParam ? categoryParam.split(",") : [];
    
    // Chuẩn hóa danh mục (tự động check cha/con) khi dữ liệu cây đã tải xong
    if (categoryTree.length > 0 && newCat.length > 0) {
      // Thu thập tất cả active slugs trong tree
      const getAllSlugsInTree = (nodes: ICourseCategoryNode[]): string[] => {
        const slugs: string[] = [];
        const traverse = (items: ICourseCategoryNode[]) => {
          for (const item of items) {
            slugs.push(item.slug);
            if (item.children?.length) {
              traverse(item.children);
            }
          }
        };
        traverse(nodes);
        return slugs;
      };

      const activeSlugs = new Set(getAllSlugsInTree(categoryTree));
      const validCats = newCat.filter((slug) => activeSlugs.has(slug));

      if (validCats.length !== newCat.length) {
        toast.info("Một số danh mục đã chọn hiện không hoạt động hoặc không tồn tại.");
        newCat = validCats;
      }

      if (newCat.length > 0) {
        newCat = normalizeCategorySelection(newCat, categoryTree);
      }
    }
    
    setSelectedCategories((prev) => JSON.stringify(prev) !== JSON.stringify(newCat) ? newCat : prev);

    const newLevels = levelParam ? levelParam.split(",") : [];
    setSelectedLevels((prev) => JSON.stringify(prev) !== JSON.stringify(newLevels) ? newLevels : prev);

    const newRatings = ratingParam ? ratingParam.split(",") : [];
    setSelectedRatings((prev) => JSON.stringify(prev) !== JSON.stringify(newRatings) ? newRatings : prev);

    const newMin = minPriceParam ? Number(minPriceParam) : 0;
    const newMax = maxPriceParam ? Number(maxPriceParam) : PRICE_MAX;
    setPriceRange((prev) => prev.min !== newMin || prev.max !== newMax ? { min: newMin, max: newMax } : prev);

    setSelectedDuration((prev) => prev !== durationParam ? durationParam : prev);
    setSortKey((prev) => prev !== sortParam ? sortParam : prev);
    setPage((prev) => prev !== pageParam ? pageParam : prev);
  }, [categoryParam, levelParam, ratingParam, minPriceParam, maxPriceParam, durationParam, sortParam, pageParam, categoryTree]);

  // State -> URL sync (debounce để tránh update quá nhanh khi kéo thanh giá)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const next = new URLSearchParams();
      if (selectedCategories.length > 0) next.set("category", selectedCategories.join(","));
      if (selectedLevels.length > 0) next.set("level", selectedLevels.join(","));
      if (selectedRatings.length > 0) next.set("rating", selectedRatings.join(","));
      if (priceRange.min > 0) next.set("minPrice", priceRange.min.toString());
      if (priceRange.max < PRICE_MAX) next.set("maxPrice", priceRange.max.toString());
      if (searchParam) next.set("search", searchParam);
      if (selectedDuration) next.set("duration", selectedDuration);
      if (sortKey !== "newest") next.set("sort", sortKey);
      if (page > 1) next.set("page", page.toString());

      setSearchParams(next, { replace: true });
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategories,
    selectedLevels,
    selectedRatings,
    priceRange,
    selectedDuration,
    sortKey,
    page
  ]);

  const resetPage = useCallback(() => setPage(1), []);

  const handleCategoryChange = useCallback((newSelected: string[]) => {
    setSelectedCategories(newSelected);
    resetPage();
  }, [resetPage]);

  const handleLevel  = useCallback((val: string) => {
    setSelectedLevels((p) => p.includes(val) ? p.filter((v) => v !== val) : [...p, val]);
    resetPage();
  }, [resetPage]);

  const handleRating = useCallback((val: string) => {
    setSelectedRatings((p) => p.includes(val) ? p.filter((v) => v !== val) : [...p, val]);
    resetPage();
  }, [resetPage]);

  // Only apply price filter when range differs from full range
  const isPriceFiltered = priceRange.min > 0 || priceRange.max < PRICE_MAX;

  // Derive minDuration/maxDuration from selectedDuration key
  const durationOpt = DURATION_OPTIONS.find((o) => o.key === selectedDuration);
  const ratingFilter = selectedRatings.length > 0
    ? Math.max(...selectedRatings.map((value) => Number(value)).filter(Number.isFinite))
    : undefined;

  const { data, isLoading, isError, isFetching } = useCatalog({
    category:    selectedCategories.length > 0 ? selectedCategories : undefined,
    level:       selectedLevels.length > 0     ? selectedLevels     : undefined,
    minPrice:    isPriceFiltered ? priceRange.min : undefined,
    maxPrice:    isPriceFiltered ? priceRange.max : undefined,
    rating:      ratingFilter,
    search:      searchParam || undefined,
    minDuration: durationOpt?.minDuration,
    maxDuration: durationOpt?.maxDuration,
    sort: sortKey,
    page,
    limit: 12,
  });

  const courses    = data?.courses    ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const couponPreviewsQuery = useCourseCouponPreviews(courses, !isLoading && !isFetching && !isError);
  const couponPreviews = couponPreviewsQuery.data ?? {};
  const enrolledCoursesQuery = useEnrolledCourses();
  const enrolledCourseIds = new Set((enrolledCoursesQuery.data ?? []).map((course) => course.courseId));
  const isCouponPreviewLoading = courses.length > 0 && couponPreviewsQuery.isLoading;
  const isEnrollmentLoading = isAuthenticated && courses.length > 0 && enrolledCoursesQuery.isLoading;
  const isCatalogCardsLoading = isLoading || isFetching || isCouponPreviewLoading || isEnrollmentLoading;

  const hasActiveFilter =
    selectedCategories.length > 0 ||
    selectedLevels.length > 0 ||
    selectedRatings.length > 0 ||
    isPriceFiltered ||
    !!selectedDuration;

  const clearAllFilters = () => {
    handleCategoryChange([]);
    setSelectedLevels([]);
    setSelectedRatings([]);
    setPriceRange(DEFAULT_PRICE);
    setSelectedDuration('');
    setPage(1);
    setIsDrawerOpen(false);
  };
  const getPageHref = (targetPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (targetPage <= 1) next.delete('page');
    else next.set('page', targetPage.toString());
    const query = next.toString();
    return query ? `?${query}` : '?';
  };

  const changePage = (nextPage: number) => {
    if (isCatalogCardsLoading || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      catalogGridRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  };

  const handlePageClick = (event: MouseEvent<HTMLAnchorElement>, nextPage: number) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    changePage(nextPage);
  };

  return (
    <div className="relative -mt-[88px] min-h-screen bg-background text-foreground antialiased">
      {/* ── Hero Banner (Đồng bộ phong cách trang Chi tiết khóa học) ── */}
      <section className="relative pt-[120px] pb-10 lg:pt-[136px] lg:pb-14 px-6 overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background">
        {/* Họa tiết chấm trang trí nhẹ ở background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-[1340px] mx-auto space-y-2">
          <p className="text-sm font-semibold text-primary">
            Thư viện khóa học SecureLearn
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-foreground tracking-tight">
            Khám phá Khóa học
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed pt-1 max-w-2xl">
            Tìm kiếm và lựa chọn các khóa học phù hợp với mục tiêu phát triển của bạn.
          </p>
        </div>

        {/* Đường gạch chia nhẹ ở dưới hero banner */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </section>

      {/* ── Nội dung chính của Catalog ── */}
      <main className="max-w-[1340px] mx-auto px-4 md:px-6 py-8">

        {/* ── Top Bar: Filter stats, Level/Duration Dropdowns & Sort ── */}
        <div ref={catalogGridRef} className="relative z-30 space-y-4 mb-6 pb-4 border-b border-border">
          <div className="flex scroll-mt-28 items-center justify-between gap-3 flex-wrap">
            {/* Left: Mobile Drawer trigger & Result count */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mobile Filter Drawer Trigger */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className={`lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-xl transition-all ${
                  hasActiveFilter
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-secondary bg-background text-foreground"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Bộ lọc {hasActiveFilter && "•"}
              </button>

              <p className="text-sm text-muted-foreground font-medium">
                Hiển thị <span className="font-bold text-foreground">{total.toLocaleString()}</span> khóa học
              </p>
            </div>

            {/* Right: Sort */}
            <SortDropdown
              value={sortKey}
              onChange={(val) => { setSortKey(val); resetPage(); }}
            />
          </div>

          {/* ── Active Filter Chips Bar (Dải Chips Lựa Chọn) ── */}
          {hasActiveFilter && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" /> Đang chọn:
              </span>

              {/* Category Chips (Hiển thị tối giản: Nếu chọn hết con thì chỉ hiện Cha) */}
              {getMinimalCategoryChips(selectedCategories, categoryTree).map((cat) => (
                <Badge
                  key={cat.slug}
                  variant="secondary"
                  className="gap-1.5 px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <span>{cat.name}</span>
                  <X
                    className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => {
                      const next = deselectCategoryFromTree(cat.slug, selectedCategories, categoryTree);
                      handleCategoryChange(next);
                    }}
                  />
                </Badge>
              ))}

              {/* Level Chips */}
              {selectedLevels.map((lvl) => {
                const label = LEVEL_OPTIONS.find((l) => l.value === lvl)?.label || lvl;
                return (
                  <Badge
                    key={lvl}
                    variant="secondary"
                    className="gap-1.5 px-3 py-1 text-xs font-medium bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-colors"
                  >
                    <span>{label}</span>
                    <X
                      className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={() => handleLevel(lvl)}
                    />
                  </Badge>
                );
              })}

              {/* Price Range Chip */}
              {isPriceFiltered && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-3 py-1 text-xs font-medium bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-colors"
                >
                  <span>Giá: {priceRange.min / 1000}k - {priceRange.max >= PRICE_MAX ? 'Max' : `${priceRange.max / 1000}k`}</span>
                  <X
                    className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => { setPriceRange(DEFAULT_PRICE); resetPage(); }}
                  />
                </Badge>
              )}

              {/* Duration Chip */}
              {selectedDuration && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-3 py-1 text-xs font-medium bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-colors"
                >
                  <span>{DURATION_OPTIONS.find((d) => d.key === selectedDuration)?.label || selectedDuration}</span>
                  <X
                    className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => { setSelectedDuration(''); resetPage(); }}
                  />
                </Badge>
              )}

              {/* Rating Chips */}
              {selectedRatings.map((rat) => (
                <Badge
                  key={rat}
                  variant="secondary"
                  className="gap-1.5 px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>≥ {rat} sao</span>
                  <X
                    className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => handleRating(rat)}
                  />
                </Badge>
              ))}

              {/* Clear All Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-destructive h-7 px-2 font-medium"
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>

        {/* ── 2 Column Grid Layout (Modern Card Sidebar + Right Content) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* ── Left Sidebar (Modern Glassmorphism Card Filters) ── */}
          <aside className="hidden lg:block lg:col-span-1 space-y-4 sticky top-28 self-start">
            <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  Bộ lọc tìm kiếm
                </h3>
                {hasActiveFilter && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* 1. Danh mục (Collapsible Card) */}
              <SidebarFilterSection
                title="Danh mục"
                badgeCount={selectedCategories.length}
              >
                <CategoryTreeFilter
                  nodes={categoryTree}
                  selected={selectedCategories}
                  onChange={handleCategoryChange}
                />
              </SidebarFilterSection>

              {/* 2. Cấp độ (Collapsible Card) */}
              <SidebarFilterSection
                title="Cấp độ"
                badgeCount={selectedLevels.length}
              >
                <div className="space-y-2.5">
                  {LEVEL_OPTIONS.map((opt) => {
                    const isSelected = selectedLevels.includes(opt.value);
                    return (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border group-hover:border-primary"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`text-sm ${isSelected ? "font-semibold text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                          {opt.label}
                        </span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => handleLevel(opt.value)}
                        />
                      </label>
                    );
                  })}
                </div>
              </SidebarFilterSection>

              {/* 3. Khoảng giá (Collapsible Card) */}
              <SidebarFilterSection
                title="Khoảng giá"
                badgeCount={isPriceFiltered ? 1 : 0}
              >
                <InlinePriceRange
                  value={priceRange}
                  onChange={(v) => {
                    setPriceRange(v);
                    resetPage();
                  }}
                />
              </SidebarFilterSection>

              {/* 4. Thời lượng (Collapsible Card) */}
              <SidebarFilterSection
                title="Thời lượng"
                badgeCount={selectedDuration ? 1 : 0}
              >
                <DurationFilter
                  selected={selectedDuration}
                  onChange={(k) => {
                    setSelectedDuration(k);
                    resetPage();
                  }}
                />
              </SidebarFilterSection>

              {/* 5. Đánh giá (Collapsible Card) */}
              <SidebarFilterSection
                title="Đánh giá"
                badgeCount={selectedRatings.length}
              >
                <div className="space-y-2.5">
                  {[
                    { value: '4.5', label: 'Từ 4.5 trở lên' },
                    { value: '4.0', label: 'Từ 4.0 trở lên' },
                    { value: '3.5', label: 'Từ 3.5 trở lên' },
                    { value: '3.0', label: 'Từ 3.0 trở lên' },
                  ].map((opt) => {
                    const isSelected = selectedRatings.includes(opt.value);
                    const numVal = Number(opt.value);
                    const fullStars = Math.floor(numVal);
                    const hasHalf = numVal % 1 !== 0;
                    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

                    return (
                      <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                        {/* Square Checkbox matching Level options */}
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border group-hover:border-primary"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>

                        {/* 5 Stars display (Full / Half / Empty) */}
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-0.5">
                            {/* Full Stars */}
                            {Array.from({ length: fullStars }).map((_, idx) => (
                              <Star key={`full-${idx}`} className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                            ))}

                            {/* Half Star (SVG với nửa vàng nửa trống) */}
                            {hasHalf && (
                              <div className="relative w-3.5 h-3.5 shrink-0">
                                <Star className="absolute inset-0 w-3.5 h-3.5 text-amber-500 stroke-amber-500" />
                                <div className="absolute inset-0 w-[50%] overflow-hidden">
                                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                </div>
                              </div>
                            )}

                            {/* Empty Stars */}
                            {Array.from({ length: emptyStars }).map((_, idx) => (
                              <Star key={`empty-${idx}`} className="w-3.5 h-3.5 text-amber-500/40 stroke-amber-500/60 fill-transparent shrink-0" />
                            ))}
                          </span>

                          <span className={`text-xs ${isSelected ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                            {opt.label}
                          </span>
                        </div>

                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => handleRating(opt.value)}
                        />
                      </label>
                    );
                  })}
                </div>
              </SidebarFilterSection>
            </div>
          </aside>

          {/* ── Right Content: Course Cards Grid (3 Columns) ── */}
          <div className="lg:col-span-3">

            {/* ── Error ── */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-semibold">Không thể tải khóa học</p>
                <p className="text-muted-foreground text-sm">Vui lòng thử lại sau.</p>
              </div>
            )}

            {/* ── Loading Skeleton ── */}
            {isCatalogCardsLoading && (
              <div className="grid auto-rows-fr grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* ── Empty ── */}
            {!isCatalogCardsLoading && !isError && courses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-border rounded-2xl p-8">
                <EmptyStateIllustration />
                <p className="text-lg font-semibold">Không tìm thấy khóa học</p>
                <p className="text-muted-foreground text-sm">
                  {hasActiveFilter ? "Thử thay đổi bộ lọc bên cột trái." : "Chưa có khóa học nào được xuất bản."}
                </p>
                {hasActiveFilter && (
                  <Button variant="outline" onClick={clearAllFilters}>Xóa tất cả bộ lọc</Button>
                )}
              </div>
            )}

            {/* ── Course Grid (3 Columns) ── */}
            {!isCatalogCardsLoading && !isError && courses.length > 0 && (
              <StaggerContainer className="grid auto-rows-fr grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <StaggerItem key={course._id} className="h-full">
                    <CourseCard course={course} couponPreview={couponPreviews[course._id] ?? null} disableCouponPreviewFetch isEnrolledOverride={enrolledCourseIds.has(course._id)} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* ── Pagination ── */}
            {!isError && totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={getPageHref(page - 1)}
                      text="Trước"
                      aria-disabled={page <= 1 || isCatalogCardsLoading}
                      tabIndex={page <= 1 || isCatalogCardsLoading ? -1 : undefined}
                      className={page <= 1 || isCatalogCardsLoading
                        ? 'pointer-events-none rounded-xl opacity-50'
                        : 'cursor-pointer rounded-xl'}
                      onClick={(event) => handlePageClick(event, page - 1)}
                    />
                  </PaginationItem>

                  {getVisiblePages(page, totalPages).map((item) => (
                    <PaginationItem key={item}>
                      {typeof item === 'number' ? (
                        <PaginationLink
                          href={getPageHref(item)}
                          isActive={item === page}
                          aria-label={`Đi tới trang ${item}`}
                          aria-disabled={isCatalogCardsLoading}
                          tabIndex={isCatalogCardsLoading ? -1 : undefined}
                          className={isCatalogCardsLoading
                            ? 'pointer-events-none rounded-xl opacity-50'
                            : 'cursor-pointer rounded-xl'}
                          onClick={(event) => handlePageClick(event, item)}
                        >
                          {item}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis className="text-muted-foreground" />
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href={getPageHref(page + 1)}
                      text="Sau"
                      aria-disabled={page >= totalPages || isCatalogCardsLoading}
                      tabIndex={page >= totalPages || isCatalogCardsLoading ? -1 : undefined}
                      className={page >= totalPages || isCatalogCardsLoading
                        ? 'pointer-events-none rounded-xl opacity-50'
                        : 'cursor-pointer rounded-xl'}
                      onClick={(event) => handlePageClick(event, page + 1)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>

        {/* ── Filter Drawer (Mobile Only Panel) ── */}
        <CatalogFilterDrawer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          total={total}
          hasActiveFilter={hasActiveFilter}
          clearAllFilters={clearAllFilters}
          categoryTree={categoryTree}
          selectedCategories={selectedCategories}
          handleCategoryChange={handleCategoryChange}
          selectedLevels={selectedLevels}
          handleLevel={handleLevel}
          isPriceFiltered={isPriceFiltered}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          resetPage={resetPage}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          selectedRatings={selectedRatings}
          handleRating={handleRating}
        />
      </main>
    </div>
  );
}
