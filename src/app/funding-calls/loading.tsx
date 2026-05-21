import { SkeletonBlock, SkeletonCard } from "@/components/skeleton";

export default function FundingCallsLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <SkeletonBlock className="h-8 w-64" />
      <SkeletonBlock className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}
