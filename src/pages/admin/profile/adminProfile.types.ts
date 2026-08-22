// Mã hỗ trợ giao diện: Cung cấp kiểu dữ liệu, hằng số hoặc hàm dùng cho trang hồ sơ và bảo mật tài khoản quản trị (route: /admin/profile).
// Admin Profile Types: Kiểu dữ liệu dùng riêng cho module hồ sơ quản trị viên.
export type AdminProfileFormData = {
  fullName: string;
  phone: string;
  bio: string;
  department: string;
};

export type AdminPasswordFormData = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type AdminProfileTabType = 'edit-profile' | 'avatar' | 'security';
