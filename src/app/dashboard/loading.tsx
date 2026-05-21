import { SkeletonBlock, SkeletonCard } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <SkeletonBlock className="h-8 w-64" />
      <SkeletonBlock className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}
