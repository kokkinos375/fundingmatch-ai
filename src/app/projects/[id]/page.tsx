import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProjectAction } from "@/app/actions";
import { Badge } from "@/components/badge";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { fundingTypeLabels, stageLabels } from "@/lib/labels";
import { isLegacyPrivateDemoProjectId } from "@/lib/public-demo";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
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
            href="/projects"
            className="text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            Projects
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {project.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {project.shortDescription}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          <Link
            href={`/projects/${project.id}/scan`}
            className="primary-action inline-flex justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Scan EU Funding
          </Link>
          <ConfirmDeleteForm
            action={deleteProjectAction.bind(null, project.id)}
            label="Delete"
            message={`Delete project "${project.name}"? This cannot be undone.`}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Profile details
            </h2>
            <dl className="mt-5 grid gap-5 md:grid-cols-2">
              <Detail label="Country" value={project.country} />
              <Detail
                label="Stage"
                value={`${stageLabels[project.stage]}${project.trl ? `, TRL ${project.trl}` : ""}`}
              />
              <Detail label="Target users" value={project.targetUsers} />
              <Detail
                label="Preferred funding"
                value={project.preferredFundingTypes
                  .map((type) => fundingTypeLabels[type])
                  .join(", ")}
              />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Problem and solution
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextBlock title="Problem solved" text={project.problemSolved} />
              <TextBlock title="Solution" text={project.solution} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Scoring weights
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(project.scoringWeights).map(([key, value]) => {
                return (
                  <div
                    key={key}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      {formatWeightLabel(key)}
                    </dt>
                    <dd className="mt-2 text-2xl font-semibold text-slate-950">
                      {value}
                    </dd>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Sectors
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.sectors.map((sector) => {
                return <Badge key={sector}>{sector}</Badge>;
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Technologies
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.technologies.map((technology) => {
                return (
                  <Badge key={technology} tone="blue">
                    {technology}
                  </Badge>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Keywords
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.keywords.map((keyword) => {
                return (
                  <Badge key={keyword} tone="teal">
                    {keyword}
                  </Badge>
                );
              })}
            </div>
          </section>

          {project.avoid.length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Avoid
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.avoid.map((item) => {
                  return (
                    <Badge key={item} tone="amber">
                      {item}
                    </Badge>
                  );
                })}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-950">{value}</dd>
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function formatWeightLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").toLowerCase();
}
