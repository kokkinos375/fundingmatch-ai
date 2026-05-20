"use client";

import Link from "next/link";

export default function ProjectScanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-950">
        <h1 className="text-xl font-semibold">Funding scan failed</h1>
        <p className="mt-2 text-sm leading-6">
          {error.message || "The scan page could not be rendered."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
          <Link
            href="/projects"
            className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100"
          >
            Back to projects
          </Link>
        </div>
      </div>
    </section>
  );
}
