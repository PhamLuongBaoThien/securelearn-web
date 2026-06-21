// ========================
// Frontend Routes
// Mục đích:
// - khai báo router chính cho public, student, instructor và admin
// - gắn thêm pricing route cho flow thuê bao song song với checkout giỏ khóa học
// ========================
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Home } from '../pages/public/home';

import { StudentDashboard } from '../pages/student/dashboard';
import { LearningInterface } from '../pages/student/learn';
import { Profile } from '../pages/shared/profile';

// Public & Auth Imports
import { PublicLayout } from '../components/layout/PublicLayout';
import { Catalog } from '../pages/public/catalog';
import { CourseDetail } from '../pages/public/course-detail';
import { AuthLayout } from '../pages/shared/auth/layout';
import { Login } from '../pages/shared/auth/login';
import { Signup } from '../pages/shared/auth/signup';
import { ForgotPassword } from '../pages/shared/auth/forgot-password';
import { Checkout } from '../pages/public/checkout';
import { Cart } from '../pages/public/cart';
import { VnpayReturn } from '../pages/shared/payments/vnpay-return';
import { MomoReturn } from '../pages/shared/payments/momo-return';
import { Teach } from '../pages/public/teach';
import { Pricing } from '../pages/public/pricing';
import { SubscriptionCatalog } from '../pages/public/subscription-catalog';
import { ScrollToTop } from '../components/layout/ScrollToTop';
import { NotFound } from '../pages/public/not-found';

// Auth Components
import { OAuthCallback } from '../pages/shared/auth/oauth-callback';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Admin Components
import { AdminLogin } from '../pages/admin/login';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminGuestRoute } from '../components/auth/AdminGuestRoute';
import { AdminProtectedRoute } from '../components/auth/AdminProtectedRoute';
import { AdminRoleRoute } from '../components/auth/AdminRoleRoute';
import { AdminDashboard } from '../pages/admin/dashboard';
import { AdminProfile } from '../pages/admin/profile';

// Admin — System & CMS (System & Content Management System dịch sang tiếng việt là quản lý hệ thống và quản lý nội dung ) 
import { WebsiteConfig } from '../pages/admin/system/website-config';
import { BannerManager } from '../pages/admin/system/banner-manager';
import { CategoryManager } from '../pages/admin/system/categories';

// Admin — Users & RBAC (RBAC là viết tắt của Role Based Access Control có nghĩa là quản lý vai trò và quyền)
import { UserList } from '../pages/admin/users/user-list';
import { StaffList } from '../pages/admin/users/staff';
import { RbacManager } from '../pages/admin/users/rbac';

// Admin — Courses
import { CourseReview } from '../pages/admin/courses/course-review';
import { ResourceManager } from '../pages/admin/courses/resource-manager';

// Admin — Finance
import { Transactions } from '../pages/admin/finance/transactions';
import { PlanManager } from '../pages/admin/finance/plan-manager';
import { CouponManager } from '../pages/admin/finance/coupon-manager';

// Admin — Notifications & Progress
import { NotificationConfig } from '../pages/admin/notifications/notification-config';
import { SendNotification } from '../pages/admin/notifications/send-notification';
import { Inbox } from '../pages/admin/notifications/inbox';

// Instructor Components
import { InstructorLayout } from '../components/layout/InstructorLayout';
import { InstructorDashboard } from '../pages/instructor/dashboard';
import { InstructorCourses, CourseEditor } from '../pages/instructor/courses';
import { InstructorPerformance } from '../pages/instructor/performance';
import { InstructorStudents } from '../pages/instructor/students';
import { InstructorCommunication } from '../pages/instructor/communication';
import { InstructorNotifications } from '../pages/instructor/notifications';

// Tạo một RootLayout chung bọc bên ngoài toàn bộ các route
// Nhờ đó, ScrollToTop luôn tồn tại trong App và hoạt động mỗi lần chuyển Route
function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />, // RootLayout sẽ là layout bọc ngoài cùng
    children: [
      {
        path: '/',
        element: <PublicLayout />,
        children: [
          { path: '', element: <Home /> },
          { path: 'courses', element: <Catalog /> },
          { path: 'course/:slug', element: <CourseDetail /> },
          { path: 'checkout', element: <Checkout /> },
          { path: 'cart', element: <Cart /> },
          { path: 'teach', element: <Teach /> },
          // Pricing là entry cho flow mua thuê bao, độc lập với checkout giỏ khóa học.
          { path: 'pricing', element: <Pricing /> },
          { path: 'subscription-catalog', element: <SubscriptionCatalog /> },
          {
            path: 'profile',
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
          {
            path: 'student/dashboard',
            element: (
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            ),
          },
        ]
      },
      {
        path: '/auth',
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'signup', element: <Signup /> },
          { path: 'forgot-password', element: <ForgotPassword /> },
        ]
      },
      // OAuth Callback — Route riêng, không dùng layout
      {
        path: '/oauth-callback',
        element: <OAuthCallback />,
      },
      {
        path: '/payment/vnpay-return',
        element: <VnpayReturn />,
      },
      {
        path: '/payment/momo-return',
        element: <MomoReturn />,
      },
      {
        path: '/student/courses/:courseId/learn',
        element: (
          <ProtectedRoute>
            <LearningInterface />
          </ProtectedRoute>
        ),
      },
      // ===== Instructor Routes =====
      {
        path: '/instructor',
        element: (
          <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
            <InstructorLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '', element: <InstructorDashboard /> },
          { path: 'dashboard', element: <InstructorDashboard /> },
          { path: 'courses', element: <InstructorCourses /> },
          { path: 'courses/:courseId/edit', element: <CourseEditor /> },
          { path: 'performance', element: <InstructorPerformance /> },
          { path: 'students', element: <InstructorStudents /> },
          { path: 'communication', element: <InstructorCommunication /> },
          { path: 'notifications', element: <InstructorNotifications /> },
        ]
      },
      // ===== Admin Routes =====
      {
        path: '/admin/login',
        element: (
          <AdminGuestRoute>
            <AdminLogin />
          </AdminGuestRoute>
        ),
      },
      {
        path: '/admin',
        element: (
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: <AdminDashboard /> },
          // ===== System & CMS =====
          { path: 'system/config', element: <WebsiteConfig /> },
          { path: 'system/banners', element: <BannerManager /> },
          { path: 'system/categories', element: <CategoryManager /> },
          // ===== Users & RBAC =====
          { path: 'users/list', element: <UserList /> },
          {
            path: 'users/staff',
            element: (
              <AdminRoleRoute allowedRoles={['SUPER_ADMIN']}>
                <StaffList />
              </AdminRoleRoute>
            ),
          },
          {
            path: 'users/rbac',
            element: (
              <AdminRoleRoute allowedRoles={['SUPER_ADMIN']}>
                <RbacManager />
              </AdminRoleRoute>
            ),
          },
          // ===== Courses =====
          { path: 'courses/review', element: <CourseReview /> },
          { path: 'courses/resources', element: <ResourceManager /> },
          // ===== Finance =====
          { path: 'finance/transactions', element: <Transactions /> },
          { path: 'finance/plans', element: <PlanManager /> },
          { path: 'finance/coupons', element: <CouponManager /> },
          // ===== Notifications & Progress =====
          { path: 'notifications/send', element: <SendNotification /> },
          { path: 'notifications/inbox', element: <Inbox /> },
          { path: 'notifications/config', element: <NotificationConfig /> },
          // ===== Profile =====
          { path: 'profile', element: <AdminProfile /> },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

