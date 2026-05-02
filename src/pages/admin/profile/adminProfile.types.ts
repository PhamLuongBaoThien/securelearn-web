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
