import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import {
  getPublicDemoProjectId,
  isLegacyPrivateDemoProjectId,
  isPublicDemoProjectId,
} from "@/lib/public-demo";
import type { ProjectProfile, SavedScan } from "@/lib/schemas";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const storage = getStorageForUser(user.id);
  const [projects, savedScans] = await Promise.all([
    storage.listProjects(),
    storage.listSavedScans(),
  ]);
  const privateProjects = projects.filter((project) => {
    return (
      !isPublicDemoProjectId(project.id) &&
      !isLegacyPrivateDemoProjectId(project.id)
    );
  });
  const recentProjects = privateProjects.slice(0, 4);
  const recentSavedScans = savedScans.slice(0, 4);
  const demoProjectId = getPublicDemoProjectId();

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Welcome{user.email ? `, ${user.email}` : " back"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Your private workspace for project profiles, saved funding scans,
            and follow-up opportunities.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/projects/new"
            className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create new project
          </Link>
          <Link
            href="/saved-scans"
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View saved scans
          </Link>
          <Link
            href={`/projects/${demoProjectId}/scan`}
            className="inline-flex justify-center rounded-md border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
          >
            Run EcoSmart demo
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <DashboardMetric
          label="Total user projects"
          value={privateProjects.length}
        />
        <DashboardMetric label="Total saved scans" value={savedScans.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="Recent saved scans">
          {recentSavedScans.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {recentSavedScans.map((scan) => (
                <SavedScanRow key={scan.id} scan={scan} />
              ))}
            </div>
          ) : (
            <EmptyDashboardState
              title="No saved scans yet"
              description="Run a project scan and save the results to build a private funding shortlist."
              href="/projects"
              action="Open projects"
            />
          )}
        </DashboardPanel>

        <DashboardPanel title="Recent projects">
          {recentProjects.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {recentProjects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyDashboardState
              title="No private projects yet"
              description="Create your first project profile, or try the public EcoSmart Demo scan."
              href="/projects/new"
              action="Create new project"
            />
          )}
        </DashboardPanel>
      </div>
    </section>
  );
}

function DashboardMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function DashboardPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SavedScanRow({ scan }: { scan: SavedScan }) {
  const topScore = scan.result.matches[0]?.scores.finalScore ?? 0;

  return (
    <article className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="teal">Top score {topScore}</Badge>
            <Badge>{scan.result.matches.length} matches</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            {scan.projectName ?? scan.projectId}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Saved {new Date(scan.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href={`/saved-scans/${scan.id}`}
          className="inline-flex justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View report
        </Link>
      </div>
    </article>
  );
}

function ProjectRow({ project }: { project: ProjectProfile }) {
  return (
    <article className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{project.stage.replace("_", " ")}</Badge>
            {project.sectors.slice(0, 2).map((sector) => (
              <Badge key={sector}>{sector}</Badge>
            ))}
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
            {project.shortDescription}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open
        </Link>
      </div>
    </article>
  );
}

function EmptyDashboardState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="p-8 text-center">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        {action}
      </Link>
    </div>
  );
}
