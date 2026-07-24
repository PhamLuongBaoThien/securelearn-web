import type { ICourseCategoryNode } from '@/services/courseApi';

//  Catalog Filters 
/**
 * Định nghĩa khoảng giá lọc khóa học bao gồm giá trị nhỏ nhất (min) và lớn nhất (max).
 * Được sử dụng trong Catalog, CatalogFilterSidebar và PriceRangeFilter để quản lý state lọc giá.
 */
export interface PriceRangeValue {
  min: number;
  max: number;
}

/**
 * Định nghĩa cấu trúc cho mỗi lựa chọn bộ lọc thời lượng khóa học (vd: ít hơn 2 giờ, 2-5 giờ).
 */
export interface DurationOption {
  key: string;          // Khóa định danh cho lựa chọn thời lượng
  label: string;        // Nhãn hiển thị ngoài giao diện (tiếng Việt)
  minDuration?: number; // Thời lượng tối thiểu tính bằng giây
  maxDuration?: number; // Thời lượng tối đa tính bằng giây
}

/**
 * Hằng số danh sách các mốc lựa chọn lọc thời lượng khóa học được định nghĩa sẵn.
 * Dùng chung cho bộ lọc trên top-bar (DurationDropdown) và trong thanh bên (DurationFilter).
 */
export const DURATION_OPTIONS: DurationOption[] = [
  { key: 'lt2h',   label: 'Ít hơn 2 giờ', maxDuration: 7_200 },
  { key: '2to5h',  label: '2 – 5 giờ',    minDuration: 7_200,  maxDuration: 18_000 },
  { key: '5to10h', label: '5 – 10 giờ',   minDuration: 18_000, maxDuration: 36_000 },
  { key: 'gt10h',  label: 'Hơn 10 giờ',   minDuration: 36_000 }, // gt10h = greater than 10 hours
];

/**
 * Hàm chuẩn hóa danh mục khóa học được chọn.
 * Thực hiện logic:
 * 1. (Top-down): Khi chọn danh mục cha, tự động tick tất cả danh mục con của nó.
 * 2. (Bottom-up): Khi tất cả danh mục con đều được chọn, tự động tick danh mục cha của chúng.
 * Tránh trường hợp người dùng phải tự tick thủ công từng danh mục con.
 */
export function normalizeCategorySelection(
  selectedSlugs: string[],
  nodes: ICourseCategoryNode[]
): string[] {
  const resultSet = new Set(selectedSlugs);

  // 1. Pha 1 (Top-down): Nếu node cha được chọn, chọn tất cả con
  const checkChildrenIfParentChecked = (treeNodes: ICourseCategoryNode[]) => {
    for (const n of treeNodes) {
      if (resultSet.has(n.slug)) {
        // Tự động thu thập tất cả con
        const gatherDescendants = (node: ICourseCategoryNode) => {
          resultSet.add(node.slug);
          node.children?.forEach(gatherDescendants);
        };
        gatherDescendants(n);
      } else if (n.children && n.children.length > 0) {
        // Nếu node cha không được chọn, tiếp tục kiểm tra con
        checkChildrenIfParentChecked(n.children);
      }
    }
  };
  checkChildrenIfParentChecked(nodes);

  // 2. Pha 2 (Bottom-up): Tick hết con thì tự động tick cha
  const autoCheckParents = (treeNodes: ICourseCategoryNode[]) => {
    for (const n of treeNodes) {
      if (n.children && n.children.length > 0) {
        // Xử lý con trước (đệ quy xuống lá)
        autoCheckParents(n.children);
        // Sau khi con đã xử lý, kiểm tra xem tất cả con đã được tick chưa
        const allChildrenChecked = n.children.every((child) =>
          resultSet.has(child.slug)
        );
        if (allChildrenChecked) {
          resultSet.add(n.slug);
        }
      }
    }
  };
  autoCheckParents(nodes);

  return Array.from(resultSet);
}

/**
 * Lọc danh sách category slugs được chọn để hiển thị tối giản trên Tag Chips:
 * Nếu một danh mục cha và tất cả con của nó đều được chọn -> Chỉ hiển thị 1 Chip cho danh mục Cha.
 * Ẩn các con đi để dải Tag gọn gàng, không bị lặp.
 */
export function getMinimalCategoryChips(
  selectedSlugs: string[],
  nodes: ICourseCategoryNode[]
): { slug: string; name: string }[] {
  const selectedSet = new Set(selectedSlugs);
  const result: { slug: string; name: string }[] = [];

  // Tạo map tra cứu slug -> name
  const nameMap = new Map<string, string>();
  const buildMap = (treeNodes: ICourseCategoryNode[]) => {
    for (const n of treeNodes) {
      nameMap.set(n.slug, n.name);
      if (n.children) buildMap(n.children);
    }
  };
  buildMap(nodes);

  // Hàm đệ quy kiểm tra và thu thập
  const processNode = (node: ICourseCategoryNode) => {
    const isNodeSelected = selectedSet.has(node.slug);

    if (isNodeSelected && node.children && node.children.length > 0) {
      // Kiểm tra xem tất cả con của node này có được chọn hết không
      const checkAllChildrenSelected = (n: ICourseCategoryNode): boolean => {
        if (!selectedSet.has(n.slug)) return false;
        if (n.children && n.children.length > 0) {
          return n.children.every(checkAllChildrenSelected);
        }
        return true;
      };

      if (checkAllChildrenSelected(node)) {
        // Tất cả con đều chọn -> Chỉ hiển thị duy nhất node Cha này
        result.push({ slug: node.slug, name: node.name });
        return; // Không duyệt sâu xuống con nữa
      }
    }

    if (isNodeSelected && (!node.children || node.children.length === 0)) {
      // Node lá được chọn
      result.push({ slug: node.slug, name: node.name });
      return;
    }

    // Nếu node cha không được chọn hết -> duyệt xuống con
    node.children?.forEach(processNode);
  };

  nodes.forEach(processNode);
  return result;
}

/**
 * Hủy chọn một category slug khỏi cây danh mục:
 * Xóa slug được chọn + tất cả descendants (con/cháu) + tất cả ancestors (cha/tổ tiên)
 */
export function deselectCategoryFromTree(
  targetSlug: string,
  selectedSlugs: string[],
  nodes: ICourseCategoryNode[]
): string[] {
  const nextSet = new Set(selectedSlugs);

  // Tìm node target và danh sách ancestors của nó
  let targetNode: ICourseCategoryNode | null = null;
  const ancestors: string[] = [];

  const findNode = (treeNodes: ICourseCategoryNode[], parents: string[]): boolean => {
    for (const n of treeNodes) {
      if (n.slug === targetSlug) {
        targetNode = n;
        ancestors.push(...parents);
        return true;
      }
      if (n.children && findNode(n.children, [...parents, n.slug])) {
        return true;
      }
    }
    return false;
  };

  findNode(nodes, []);

  // Xóa target slug
  nextSet.delete(targetSlug);

  // Xóa tất cả ancestors (cha/ông)
  ancestors.forEach((slug) => nextSet.delete(slug));

  // Xóa tất cả descendants (con/cháu)
  if (targetNode) {
    const removeDescendants = (n: ICourseCategoryNode) => {
      nextSet.delete(n.slug);
      n.children?.forEach(removeDescendants);
    };
    removeDescendants(targetNode);
  }

  return Array.from(nextSet);
}
