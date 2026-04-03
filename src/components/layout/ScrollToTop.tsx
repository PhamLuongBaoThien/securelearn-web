import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component này lắng nghe sự thay đổi của URL (đường dẫn).
 * Mỗi khi bạn bấm chuyển sang một trang mới, useEffect sẽ được kích hoạt 
 * và gọi hàm window.scrollTo(0, 0) để đưa thanh cuộn về vị trí đầu trang.
 */
export function ScrollToTop() {
  // Lấy ra pathname hiện tại từ react-router-dom
  const { pathname } = useLocation();

  useEffect(() => {
    // Kéo thanh cuộn lên vị trí tọa độ x: 0 (trái), y: 0 (trên cùng)
    window.scrollTo(0, 0);
  }, [pathname]); // Theo dõi sự thay đổi của pathname. Khi pathname đổi, effect này sẽ chạy lại.

  // Component này không hiển thị bất kỳ giao diện (UI) nào ra màn hình
  return null;
}
