import { useState } from "react";
import { Check, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/animations/Drawer";
import {
  CategoryTreeFilter,
  InlinePriceRange,
  DurationFilter,
} from "./CatalogFilters";
import type { PriceRangeValue } from "@/lib/courseUtils";
import { LEVEL_OPTIONS, RATING_OPTIONS } from "./constants";
import type { ICourseCategoryNode } from "@/services/courseApi";

export interface CatalogFilterSidebarProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (val: boolean) => void;
  total: number;
  hasActiveFilter: boolean;
  clearAllFilters: () => void;
  categoryTree: ICourseCategoryNode[];
  selectedCategories: string[];
  handleCategoryChange: (v: string[]) => void;
  selectedLevels: string[];
  handleLevel: (v: string) => void;
  isPriceFiltered: boolean;
  priceRange: PriceRangeValue;
  setPriceRange: (v: PriceRangeValue) => void;
  resetPage: () => void;
  selectedDuration: string;
  setSelectedDuration: (v: string) => void;
  selectedRatings: string[];
  handleRating: (v: string) => void;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 last:mb-0">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full font-semibold flex items-center justify-between p-0 h-auto hover:bg-transparent text-left focus-visible:ring-0"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function CatalogFilterSidebar({
  isDrawerOpen,
  setIsDrawerOpen,
  total,
  hasActiveFilter,
  clearAllFilters,
  categoryTree,
  selectedCategories,
  handleCategoryChange,
  selectedLevels,
  handleLevel,
  priceRange,
  setPriceRange,
  resetPage,
  selectedDuration,
  setSelectedDuration,
  selectedRatings,
  handleRating,
}: CatalogFilterSidebarProps) {
  const drawerFooter = (
    <>
      <Button className="w-full font-bold h-11" onClick={() => setIsDrawerOpen(false)}>
        Hiển thị {total.toLocaleString()} kết quả
      </Button>
      {hasActiveFilter && (
        <Button variant="ghost" className="w-full mt-2" onClick={clearAllFilters}>
          Xóa tất cả bộ lọc
        </Button>
      )}
    </>
  );

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      title="Tất cả bộ lọc"
      footer={drawerFooter}
    >
      <div className="pb-4">
        {/* Danh mục */}
        <FilterSection title="Danh mục">
          <CategoryTreeFilter
            nodes={categoryTree}
            selected={selectedCategories}
            onChange={handleCategoryChange}
          />
        </FilterSection>

        {/* Cấp độ */}
        <FilterSection title="Cấp độ">
          <div className="space-y-3">
            {LEVEL_OPTIONS.map((opt) => {
              const isSelected = selectedLevels.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border group-hover:border-primary"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-sm ${isSelected ? "font-medium" : "text-foreground"}`}>
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
        </FilterSection>

        {/* Giá */}
        <FilterSection title="Khoảng giá">
          <InlinePriceRange
            value={priceRange}
            onChange={(v) => {
              setPriceRange(v);
              resetPage();
            }}
          />
        </FilterSection>

        {/* Thời lượng */}
        <FilterSection title="Thời lượng">
          <DurationFilter
            selected={selectedDuration}
            onChange={(k) => {
              setSelectedDuration(k);
              resetPage();
            }}
          />
        </FilterSection>

        {/* Đánh giá */}
        <FilterSection title="Đánh giá">
          <div className="space-y-3">
            {RATING_OPTIONS.map((opt) => {
              const isSelected = selectedRatings.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border group-hover:border-primary"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span
                    className={`text-sm flex items-center gap-1.5 ${
                      isSelected ? "font-medium" : "text-foreground"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {opt.label}
                  </span>
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
        </FilterSection>
      </div>
    </Drawer>
  );
}
