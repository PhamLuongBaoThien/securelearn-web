import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { FadeIn } from '../animations/FadeIn';

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground font-sans antialiased transition-colors duration-300">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 sm:px-8 flex">
        {/* Placeholder Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border py-8 pr-6 shrink-0">
          <nav className="flex flex-col gap-2">
            <span className="text-sm font-medium px-4 py-2.5 bg-primary/10 rounded-md text-primary cursor-pointer transition-colors">
              Tổng quan
            </span>
            <span className="text-sm font-medium px-4 py-2.5 text-muted-foreground hover:bg-secondary/50 rounded-md cursor-pointer transition-colors">
              Khóa học của tôi
            </span>
            <span className="text-sm font-medium px-4 py-2.5 text-muted-foreground hover:bg-secondary/50 rounded-md cursor-pointer transition-colors">
              Chứng chỉ
            </span>
            <span className="text-sm font-medium px-4 py-2.5 text-muted-foreground hover:bg-secondary/50 rounded-md cursor-pointer transition-colors">
              Cài đặt
            </span>
          </nav>
        </aside>
        
        <main className="flex-1 py-8 md:pl-10 w-full overflow-hidden">
          <FadeIn>
            {children}
          </FadeIn>
        </main>
      </div>
    </div>
  );
};
