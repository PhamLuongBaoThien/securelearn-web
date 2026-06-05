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
