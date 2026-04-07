// ========================
// Entry Point: Khởi tạo ứng dụng React
// Bao gồm: Redux Provider, Theme, React Query, Auth, Toast, Router.
// ========================
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './routes'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { AuthInitializer } from './components/auth/AuthInitializer'
import { Toaster } from '@/components/ui/sonner'

console.log('[SecureLearn] main.tsx loaded')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 phút cache
      retry: 1,                        // Retry 1 lần khi lỗi
      refetchOnWindowFocus: false,     // Tránh refetch không cần thiết
    },
  },
})

try {
  console.log('[SecureLearn] Mounting React app...')
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthInitializer>
              <AppRouter />
            </AuthInitializer>
            {/* Toast container — tích hợp shadcn */}
            <Toaster position="top-center" closeButton duration={4000} richColors />
          </QueryClientProvider>

        </ThemeProvider>
      </Provider>
    </React.StrictMode>,
  )
  console.log('[SecureLearn] React app mounted successfully')
} catch (error) {
  console.error('[SecureLearn] FATAL ERROR mounting app:', error)
}
