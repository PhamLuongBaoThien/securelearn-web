import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-500">
      <Navbar />
      <main className="flex-1 pb-16" style={{ overflowClipMargin: '0px', overflowX: 'clip' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
