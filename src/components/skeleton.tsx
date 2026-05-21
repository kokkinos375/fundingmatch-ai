export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <SkeletonBlock className="h-4 w-28" />
      <SkeletonBlock className="mt-4 h-6 w-3/4" />
      <SkeletonBlock className="mt-3 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-2/3" />
    </div>
  );
}
