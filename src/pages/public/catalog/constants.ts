import type { PriceRangeValue } from "@/lib/courseUtils";

export const PRICE_MAX = 5_000_000;
export const DEFAULT_PRICE: PriceRangeValue = { min: 0, max: PRICE_MAX };

export const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

export const RATING_OPTIONS = [
  { value: "4.5", label: "4.5 trở lên" },
  { value: "4.0", label: "4.0 trở lên" },
  { value: "3.5", label: "3.5 trở lên" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Phổ biến nhất" },
  { value: "price_asc", label: "Giá từ thấp đến cao" },
  { value: "price_desc", label: "Giá từ cao đến thấp" },
];
