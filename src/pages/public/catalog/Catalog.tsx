import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CourseCard } from "@/components/ui/CourseCard";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { usePublicCourseCategories } from "@/hooks/usePublicCourseCategories";
import {
  MultiSelectDropdown,
  DurationDropdown,
} from "./CatalogFilters";
import {
  normalizeCategorySelection,
  DURATION_OPTIONS,
  type PriceRangeValue,
} from "@/lib/courseUtils";
import { CatalogFilterSidebar } from "./CatalogFilterSidebar";

import {
  PRICE_MAX,
  DEFAULT_PRICE,
  LEVEL_OPTIONS,
} from "./constants";
import { CourseCardSkeleton } from "./CourseCardSkeleton";
import { SortDropdown } from "./SortDropdown";


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

// ── Main ─────────────────────────────────────────────────────────────────────
export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL -> State initialization
  const categoryParam = searchParams.get("category") || "";
  const levelParam = searchParams.get("level") || "";
  const ratingParam = searchParams.get("rating") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const searchParam = searchParams.get("search") || "";
  const durationParam = searchParams.get("duration") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const pageParam = searchParams.get("page") || "1";

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
  const [page,               setPage]               = useState(Number(pageParam));
  const [isDrawerOpen,       setIsDrawerOpen]       = useState(false);

  // URL -> State sync (khi URL thay đổi từ bên ngoài hoặc khi tải xong categoryTree)
  useEffect(() => {
    let newCat = categoryParam ? categoryParam.split(",") : [];
    
    // Chuẩn hóa danh mục (tự động check cha/con) khi dữ liệu cây đã tải xong
    if (categoryTree.length > 0 && newCat.length > 0) {
      newCat = normalizeCategorySelection(newCat, categoryTree);
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
    setPage((prev) => prev !== Number(pageParam) ? Number(pageParam) : prev);
  }, [categoryParam, levelParam, ratingParam, minPriceParam, maxPriceParam, durationParam, sortParam, pageParam]);

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

  const { data: categoryTree = [] } = usePublicCourseCategories();

  const courses    = data?.courses    ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const hasMore    = page < totalPages;
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



  return (
    <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-8">
      {/* ── Page Heading ── */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-1">
          Khám phá Khóa học
        </h1>
        <p className="text-muted-foreground text-base">
          {isLoading || isFetching ? "Đang tải..." : `${total.toLocaleString()} khóa học`}
        </p>
      </div>

      {/* ── Horizontal Filter Bar ── */}
      <div className="relative z-40 flex items-center justify-between gap-3 mb-6 flex-wrap">
        {/* Left: filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tất cả bộ lọc — Mở Drawer */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border rounded-full transition-all ${
              hasActiveFilter
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary bg-background text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Tất cả bộ lọc
          </button>


          <MultiSelectDropdown
            label="Cấp độ"
            options={LEVEL_OPTIONS}
            selected={selectedLevels}
            onSelect={handleLevel}
          />


          <DurationDropdown
            selected={selectedDuration}
            onChange={(k) => { setSelectedDuration(k); resetPage(); }}
          />
        </div>

        {/* Right: Sort */}
        <SortDropdown
          value={sortKey}
          onChange={(val) => { setSortKey(val); resetPage(); }}
        />
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-semibold">Không thể tải khóa học</p>
          <p className="text-muted-foreground text-sm">Vui lòng thử lại sau.</p>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {(isLoading || isFetching) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !isFetching && !isError && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <EmptyStateIllustration />
          <p className="text-lg font-semibold">Không tìm thấy khóa học</p>
          <p className="text-muted-foreground text-sm">
            {hasActiveFilter ? "Thử thay đổi bộ lọc." : "Chưa có khóa học nào được xuất bản."}
          </p>
          {hasActiveFilter && (
            <Button variant="outline" onClick={clearAllFilters}>Xóa bộ lọc</Button>
          )}
        </div>
      )}

      {/* ── Course Grid ── */}
      {!isLoading && !isFetching && !isError && courses.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
          {courses.map((course) => (
            <StaggerItem key={course._id}>
              <CourseCard course={course} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* ── Load More ── */}
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Button
            variant="outline"
            className="px-10 py-5 font-bold border-2 rounded-none"
            disabled={isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {isFetching ? "Đang tải..." : "Xem thêm khóa học"}
          </Button>
        </div>
      )}

      {/* ── Filter Drawer (Left Side Panel) ── */}
      <CatalogFilterSidebar
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
    </div>
  );
}
