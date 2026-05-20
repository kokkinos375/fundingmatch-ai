import Link from "next/link";
import { Badge } from "@/components/badge";
import { fundingTypeLabels, stageLabels } from "@/lib/labels";
import type { ProjectProfile } from "@/lib/schemas";

export function ProjectCard({ project }: { project: ProjectProfile }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="text-lg font-semibold tracking-tight text-slate-950 hover:text-teal-700"
          >
            {project.name}
          </Link>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {project.shortDescription}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex shrink-0 justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View profile
        </Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="teal">{stageLabels[project.stage]}</Badge>
        {project.trl ? <Badge tone="blue">TRL {project.trl}</Badge> : null}
        <Badge>{project.country}</Badge>
        {project.preferredFundingTypes.slice(0, 3).map((type) => {
          return <Badge key={type}>{fundingTypeLabels[type]}</Badge>;
        })}
      </div>
    </article>
  );
}
