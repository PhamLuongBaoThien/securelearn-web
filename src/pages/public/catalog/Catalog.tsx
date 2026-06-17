import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CourseCard } from "@/components/ui/CourseCard";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BookOpen,
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

// ── Main ─────────────────────────────────────────────────────────────────────
export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL -> State initialization
  const categoryParam = searchParams.get("category") || "";
  const levelParam = searchParams.get("level") || "";
  const ratingParam = searchParams.get("rating") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
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
          <BookOpen className="w-12 h-12 text-muted-foreground" />
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
