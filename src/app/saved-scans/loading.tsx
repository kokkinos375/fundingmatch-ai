import { SkeletonBlock, SkeletonCard } from "@/components/skeleton";

export default function SavedScansLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <SkeletonBlock className="h-8 w-52" />
      <SkeletonBlock className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-8 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}
