import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
        Not found
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        This project profile is not available.
      </h1>
      <p className="mt-3 text-slate-600">
        The in-memory project store may have reset, or the profile id may be
        incorrect.
      </p>
      <Link
        href="/projects"
        className="primary-action mt-7 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Back to projects
      </Link>
    </section>
  );
}
