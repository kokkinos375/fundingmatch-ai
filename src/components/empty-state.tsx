import Link from "next/link";

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-950">
        No project profiles yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Add a startup or project profile, then scan for funding opportunities
        that match it.
      </p>
      <Link
        href="/projects/new"
        className="primary-action mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Create project
      </Link>
    </div>
  );
}
