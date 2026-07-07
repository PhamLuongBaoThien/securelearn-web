import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Header';
import { Footer } from './Footer';
import { BackToTop } from './BackToTop';
import { usePublicWebsiteConfig } from '@/hooks/useWebsiteConfig';

export function PublicLayout() {
  const { data: websiteConfig } = usePublicWebsiteConfig();

  useEffect(() => {
    if (!websiteConfig?.faviconUrl) return;
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = websiteConfig.faviconUrl;
  }, [websiteConfig?.faviconUrl]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-500">
      <Navbar />
      <main className="flex-1 pb-16" style={{ overflowClipMargin: '0px', overflowX: 'clip' }}>
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
