import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/project-card";
import { getVisibleProjectsForCurrentUser } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { projects, user } = await getVisibleProjectsForCurrentUser();

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Project profiles
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Save different startup or project ideas, then run the same funding
            scan logic for each profile.
          </p>
        </div>
        <Link
          href={user ? "/projects/new" : "/auth/login?next=/projects/new"}
          className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create project
        </Link>
      </div>
      <div className="mt-8">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              return <ProjectCard key={project.id} project={project} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
