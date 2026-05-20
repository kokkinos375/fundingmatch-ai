import Link from "next/link";
import { createProjectAction } from "@/app/actions";
import { ProjectProfileForm } from "@/components/project-profile-form";

export default function NewProjectPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Create a project profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Capture enough context for deterministic matching. The profile can
            be any startup, research project, product, or pilot idea.
          </p>
        </div>
        <Link
          href="/projects"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          Back to projects
        </Link>
      </div>

      <ProjectProfileForm
        action={createProjectAction}
        submitLabel="Save project"
        cancelHref="/projects"
      />
    </section>
  );
}
