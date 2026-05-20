import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProjectAction } from "@/app/actions";
import { ProjectProfileForm } from "@/components/project-profile-form";
import { requireUser } from "@/lib/auth";
import { getPrivateProjectForCurrentUser } from "@/lib/projects";
import { isLegacyPrivateDemoProjectId } from "@/lib/public-demo";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isLegacyPrivateDemoProjectId(id)) {
    notFound();
  }

  await requireUser(`/projects/${id}/edit`);
  const { project } = await getPrivateProjectForCurrentUser(id);

  if (!project) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Edit project profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Update the stored profile used by funding scans.
          </p>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          Back to profile
        </Link>
      </div>

      <ProjectProfileForm
        action={updateProjectAction.bind(null, project.id)}
        project={project}
        submitLabel="Update project"
        cancelHref={`/projects/${project.id}`}
      />
    </section>
  );
}
