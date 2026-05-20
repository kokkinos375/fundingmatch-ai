import Link from "next/link";
import { createProjectAction } from "@/app/actions";
import { ProjectProfileForm } from "@/components/project-profile-form";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdvancedNewProjectPage() {
  await requireUser("/projects/new/advanced");

  return (
    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Advanced project form
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Enter the full profile used by funding scans. Use this mode when
            you already know the detailed project context.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href="/projects/new"
            className="text-teal-700 hover:text-teal-900"
          >
            Guided setup
          </Link>
          <Link
            href="/projects"
            className="text-slate-600 hover:text-slate-950"
          >
            Back to projects
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Do not enter confidential details unless this deployment is private or
        protected.
      </div>

      <ProjectProfileForm
        action={createProjectAction}
        submitLabel="Save project"
        cancelHref="/projects"
      />
    </section>
  );
}
