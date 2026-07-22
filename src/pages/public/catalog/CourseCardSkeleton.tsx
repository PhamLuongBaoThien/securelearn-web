export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-card border border-border rounded-xl overflow-hidden shadow-sm animate-pulse">
      {/* Thumbnail aspect-video */}
      <div className="w-full aspect-video bg-secondary shrink-0" />

      {/* Info area */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title — 2 lines */}
        <div className="space-y-1.5 mb-2">
          <div className="h-4.5 w-full bg-secondary rounded" />
          <div className="h-4.5 w-3/4 bg-secondary rounded" />
        </div>

        {/* Instructor name */}
        <div className="h-3.5 w-1/2 bg-secondary rounded mb-2.5" />

        {/* Rating row (4.8 ★★★★★ (120)) */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="h-3.5 w-6 bg-secondary rounded" />
          <div className="h-3.5 w-16 bg-secondary rounded" />
          <div className="h-3 w-10 bg-secondary rounded" />
        </div>

        {/* Stats: Level • Duration • Lessons */}
        <div className="h-3 w-40 bg-secondary rounded mb-3" />

        {/* Price row */}
        <div className="flex flex-col justify-end min-h-[3.5rem] mb-3 mt-auto">
          <div className="h-6 w-28 bg-secondary rounded" />
        </div>

        {/* CTA Button */}
        <div className="h-8 w-full bg-secondary rounded-sm mt-auto" />
      </div>
    </div>
  );
}
