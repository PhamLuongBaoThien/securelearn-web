// ========================
// Router Configuration: Định nghĩa toàn bộ routes cho ứng dụng
// Bao gồm: Public, Auth, Protected (Student), và OAuth callback.
// ========================
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Home } from '../pages/public/Home';

import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import { LearningInterface } from '../pages/learning/LearningInterface';
import { Profile } from '../pages/user/Profile';

// Public & Auth Imports
import { PublicLayout } from '../components/layout/PublicLayout';
import { Catalog } from '../pages/public/Catalog';
import { CourseDetail } from '../pages/public/CourseDetail';
import { AuthLayout } from '../pages/auth/AuthLayout';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Checkout } from '../pages/public/Checkout';
import { Cart } from '../pages/public/Cart';
import { Teach } from '../pages/public/Teach';
import { ScrollToTop } from '../components/layout/ScrollToTop';
import { NotFound } from '../pages/public/NotFound';

// Auth Components
import { OAuthCallback } from '../pages/auth/OAuthCallback';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Admin Components
import { AdminLogin } from '../pages/admin/auth/AdminLogin';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminProtectedRoute } from '../components/auth/AdminProtectedRoute';
import { Dashboard as AdminDashboard } from '../pages/admin/Dashboard';

// Instructor Components
import { InstructorLayout } from '../components/layout/InstructorLayout';
import { InstructorDashboard } from '../pages/instructor/Dashboard';
import { InstructorCourses } from '../pages/instructor/Courses';
import { CourseEditor } from '../pages/instructor/CourseEditor';
import { InstructorPerformance } from '../pages/instructor/Performance';
import { InstructorCommunication } from '../pages/instructor/Communication';

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
          { path: 'course/:courseId', element: <CourseDetail /> },
          { path: 'checkout', element: <Checkout /> },
          { path: 'cart', element: <Cart /> },
          { path: 'teach', element: <Teach /> },
          {
            path: 'profile',
            element: (
              <ProtectedRoute>
                <Profile />
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
      // ===== Protected Routes: Yêu cầu đăng nhập =====
      {
        path: '/student/dashboard',
        element: (
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        ),
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
          { path: 'communication', element: <InstructorCommunication /> },
        ]
      },
      // ===== Admin Routes =====
      {
        path: '/admin/login',
        element: <AdminLogin />,
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
          // Thêm các routes quản lý ở đây
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
