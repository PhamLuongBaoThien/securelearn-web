export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="w-full aspect-video rounded-sm bg-secondary mb-3" />
      <div className="h-4 bg-secondary rounded w-full mb-1.5" />
      <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
      <div className="h-3 bg-secondary rounded w-1/2 mb-3" />
      <div className="h-3 bg-secondary rounded w-2/3 mb-4" />
      <div className="h-8 bg-secondary rounded w-full" />
    </div>
  );
}
