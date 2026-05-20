import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { MatchCard } from "@/components/match-card";
import { requireUser } from "@/lib/auth";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SavedScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/saved-scans/${id}`);
  const scan = await getStorageForUser(user.id).getSavedScan(id);

  if (!scan) {
    notFound();
  }

  const topMatch = scan.result.matches[0];

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/saved-scans"
            className="text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            Saved scans
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {scan.projectName ?? scan.projectId}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Saved scan from {new Date(scan.createdAt).toLocaleString()}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="teal">
            Top score {topMatch?.scores.finalScore ?? 0}
          </Badge>
          <Badge>{scan.result.matches.length} matches</Badge>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {scan.result.matches.map((match, index) => {
          return (
            <MatchCard key={match.call.id} match={match} rank={index + 1} />
          );
        })}
      </div>
    </section>
  );
}
