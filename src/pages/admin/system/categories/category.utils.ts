// ========================
// Category Utilities: Các hàm tiện ích xử lý cây danh mục
// ========================
import type { ICategory } from '@/types/admin.types';

// ===== Constants =====

export const MAX_CATEGORY_DEPTH = 4;

export const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

// ===== Types =====

export interface FormState {
  name: string;
  description: string;
  parentId: string | null;
  order: string;
}

// ===== Utility Functions =====

/** Tạo slug URL tự động từ tên danh mục */
export const autoSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

/** Duyệt đệ quy cây danh mục, trả về mảng phẳng tất cả các node */
export const flattenCategories = (categories: ICategory[]): ICategory[] => {
  const result: ICategory[] = [];

  const visit = (items: ICategory[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) visit(item.children);
    }
  };

  visit(categories);
  return result;
};

/** Tạo map { categoryId → depth }, depth bắt đầu từ 1 */
export const getCategoryDepthMap = (categories: ICategory[]) => {
  const depthMap = new Map<string, number>();

  const visit = (items: ICategory[], depth: number) => {
    for (const item of items) {
      depthMap.set(item._id, depth);
      if (item.children?.length) visit(item.children, depth + 1);
    }
  };

  visit(categories, 1);
  return depthMap;
};

/** Tính chiều cao cây con (subtree height) của một danh mục */
export const getSubtreeHeight = (category: ICategory): number => {
  if (!category.children?.length) return 1;
  return 1 + Math.max(...category.children.map((child) => getSubtreeHeight(child)));
};

/** Tạo map { categoryId → "Cha > Con > Cháu" } hiển thị đường dẫn đầy đủ */
export const getCategoryTrailMap = (categories: ICategory[]) => {
  const trailMap = new Map<string, string>();

  const visit = (items: ICategory[], parentTrail = '') => {
    for (const item of items) {
      const trail = parentTrail ? `${parentTrail} > ${item.name}` : item.name;
      trailMap.set(item._id, trail);
      if (item.children?.length) visit(item.children, trail);
    }
  };

  visit(categories);
  return trailMap;
};

/** Thu thập tất cả ID con cháu (descendant) của một danh mục */
export const getDescendantIds = (category: ICategory): string[] => {
  const collected: string[] = [];

  const visit = (node: ICategory) => {
    for (const child of node.children || []) {
      collected.push(child._id);
      visit(child);
    }
  };

  visit(category);
  return collected;
};

/** Tìm mảng siblings và vị trí index của danh mục trong cây */
export const findSiblingContext = (items: ICategory[], targetId: string): { siblings: ICategory[]; index: number } | null => {
  const index = items.findIndex((item) => item._id === targetId);
  if (index >= 0) {
    return { siblings: items, index };
  }

  for (const item of items) {
    if (!item.children?.length) continue;
    const nested = findSiblingContext(item.children, targetId);
    if (nested) return nested;
  }

  return null;
};
