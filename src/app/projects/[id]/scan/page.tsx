import Link from "next/link";
import { notFound } from "next/navigation";
import { ScanResultsClient } from "@/components/scan-results-client";
import { isLegacyPrivateDemoProjectId } from "@/lib/public-demo";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ProjectScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isLegacyPrivateDemoProjectId(id)) {
    notFound();
  }

  const project = await getStorage().getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            {project.name}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            EU funding matches
          </h1>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-600">
            Ranked calls from enabled funding sources using deterministic
            scores. AI is used only for explanation fields when{" "}
            <code>OPENAI_API_KEY</code> is available.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-950">
            Scan agent
          </span>
          <span className="block text-xs text-slate-500">
            Scores first, explanations second
          </span>
        </div>
      </div>

      <ScanResultsClient projectId={project.id} projectName={project.name} />
    </section>
  );
}
