import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '../ui/button';

const VISIBILITY_OFFSET = 320;

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > VISIBILITY_OFFSET);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Button
      type="button"
      onClick={handleBackToTop}
      aria-label="Back to top"
      size="icon"
      className={[
        'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full',
        'shadow-lg shadow-black/15 ring-1 ring-black/5',
        'transition-all duration-300 hover:-translate-y-1',
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none',
      ].join(' ')}
    >
      <ArrowUp className="h-5 w-5 " />
    </Button>
  );
}
