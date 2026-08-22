// Thành phần giao diện: HomeBannerSlider thuộc trang chủ công khai (route: /).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionSequence, SectionSequenceItem } from '@/components/animations/SectionReveal';
import { usePublicBanners } from '@/hooks/useBanners';
import type { Banner } from '@/types/admin.types';

const SLIDE_INTERVAL = 5000;
const FALLBACK: Banner = {
  _id: 'securelearn-default',
  title: 'Học tập không giới hạn',
  subtitle: 'Kỹ năng cho hiện tại và tương lai của bạn. Bắt đầu cùng SecureLearn.',
  imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000',
  linkUrl: '/courses',
  isActive: true,
  order: 1,
  createdAt: '',
  updatedAt: '',
};

function SlideLink({ linkUrl }: { linkUrl?: string }) {
  if (!linkUrl) return null;
  const className = 'inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm md:px-8 md:py-4 md:text-base font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';
  return linkUrl.startsWith('/') && !linkUrl.startsWith('//')
    ? <Link to={linkUrl} className={className}>Khám phá ngay</Link>
    : <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={className}>Khám phá ngay</a>;
}

export function HomeBannerSlider() {
  const query = usePublicBanners();
  const slides = useMemo(() => {
    if (query.data?.length) return query.data;
    if (query.isError || (query.isFetched && query.data?.length === 0)) return [FALLBACK];
    return [];
  }, [query.data, query.isError, query.isFetched]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((value) => (value + 1) % slides.length), [slides.length]);
  const previous = useCallback(() => setCurrent((value) => (value - 1 + slides.length) % slides.length), [slides.length]);


  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(next, SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [next, paused, slides.length]);

  if (!slides.length) {
    return (
      <section aria-busy="true" aria-label="Đang tải banner nổi bật"
        className="relative z-0 -mt-[88px] h-[500px] sm:h-[560px] md:h-[620px] lg:h-[680px] w-full overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.28),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.22),transparent_28%),linear-gradient(120deg,rgba(2,6,23,1),rgba(15,23,42,0.96))]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
        <span className="sr-only">Đang tải banner</span>
      </section>
    );
  }

  const safeCurrent = current < slides.length ? current : 0;
  const active = slides[safeCurrent] || FALLBACK;
  return (
    <section aria-roledescription="carousel" aria-label="Banner nổi bật"
      className="relative z-0 -mt-[88px] h-[500px] sm:h-[560px] md:h-[620px] lg:h-[680px] max-h-[760px] w-full overflow-hidden bg-zinc-950"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="relative h-full w-full">
        {slides.map((slide, index) => <div key={slide._id} aria-hidden={index !== safeCurrent}
          className={`absolute inset-0 transition-opacity duration-700 ${index === safeCurrent ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}>
          <img src={slide.imageUrl} alt={slide.title || 'SecureLearn Banner'} className={`h-full w-full object-cover object-center motion-safe:transition-transform motion-safe:duration-[10000ms] ${index === safeCurrent ? 'motion-safe:scale-105' : 'scale-100'}`}
            onError={(event) => { if (event.currentTarget.src !== FALLBACK.imageUrl) event.currentTarget.src = FALLBACK.imageUrl; }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>)}
        <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex w-full max-w-[1340px] flex-col justify-center px-6 pt-[88px] md:px-12 lg:px-16">
          <SectionSequence key={active._id} className="pointer-events-auto max-w-2xl">
            <SectionSequenceItem><h1 className="mb-4 text-2xl font-extrabold leading-tight text-white drop-shadow-xl sm:text-4xl md:text-5xl lg:text-6xl line-clamp-3">{active.title}</h1></SectionSequenceItem>
            {active.subtitle && <SectionSequenceItem><p className="mb-6 text-sm text-white/90 drop-shadow-md sm:text-base md:text-xl line-clamp-2 leading-relaxed max-w-xl">{active.subtitle}</p></SectionSequenceItem>}
            <SectionSequenceItem><SlideLink linkUrl={active.linkUrl} /></SectionSequenceItem>
          </SectionSequence>
        </div>
        {slides.length > 1 && <>
          <button onClick={previous} className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:inline-flex cursor-pointer" aria-label="Banner trước"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={next} className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:inline-flex cursor-pointer" aria-label="Banner tiếp theo"><ChevronRight className="h-6 w-6" /></button>
          <div className="absolute bottom-6 md:bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5">{slides.map((slide, index) =>
            <button key={slide._id} onClick={() => setCurrent(index)} aria-label={`Đi đến banner ${index + 1}: ${slide.title}`} aria-current={index === safeCurrent ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer ${index === safeCurrent ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'}`} />)}
          </div>
        </>}
        {query.isLoading && <span className="sr-only">Đang tải banner</span>}
      </div>
    </section>
  );
}
