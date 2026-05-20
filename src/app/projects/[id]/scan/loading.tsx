export default function ProjectScanLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10" aria-busy="true">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-72 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full max-w-2xl rounded bg-slate-100" />
      <div className="mt-8 space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="h-20 rounded bg-slate-100" />
            <div className="h-20 rounded bg-slate-100" />
            <div className="h-20 rounded bg-slate-100" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 w-56 rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </section>
  );
}
