import Link from "next/link";
import { Badge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SavedScansPage() {
  const user = await requireUser("/saved-scans");
  const scans = await getStorageForUser(user.id).listSavedScans();

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Saved scans
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review private snapshots of funding match results you saved from
            project scan pages.
          </p>
        </div>
        <Link
          href="/projects"
          className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Open projects
        </Link>
      </div>

      {scans.length === 0 ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            No saved scans yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Run a funding scan for one of your project profiles, then save the
            result snapshot here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {scans.map((scan) => {
            const topScore = scan.result.matches[0]?.scores.finalScore ?? 0;

            return (
              <article
                key={scan.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="teal">Top score {topScore}</Badge>
                      <Badge>{scan.result.matches.length} matches</Badge>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-slate-950">
                      {scan.projectName ?? scan.projectId}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Saved {new Date(scan.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/saved-scans/${scan.id}`}
                    className="inline-flex justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View report
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
