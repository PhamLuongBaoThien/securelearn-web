// ========================
// Entry Point: Khởi tạo ứng dụng React
// Bao gồm: Redux Provider, Theme, React Query, Auth, Toast, Router.
// ========================
import ReactDOM from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './routes'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 phút cache
      retry: 1,                        // Retry 1 lần khi lỗi
      refetchOnWindowFocus: false,     // Tránh refetch không cần thiết
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
        {/* Toast container — tích hợp shadcn */}
        <Toaster closeButton duration={4000} richColors />
      </QueryClientProvider>
    </ThemeProvider>
  </Provider>,
)


