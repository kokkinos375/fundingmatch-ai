"use client";

import { useActionState } from "react";
import Link from "next/link";
import { fundingTypeLabels, stageLabels } from "@/lib/labels";
import {
  defaultScoringWeights,
  fundingTypeSchema,
  projectStageSchema,
  type ProjectProfile,
} from "@/lib/schemas";

type ProjectFormState = {
  errors: string[];
};

type ProjectFormAction = (
  state: ProjectFormState,
  formData: FormData,
) => Promise<ProjectFormState>;

const textInputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

const labelClass = "text-sm font-semibold text-slate-800";
const helpClass = "mt-1 text-xs leading-5 text-slate-500";

export function ProjectProfileForm({
  action,
  project,
  submitLabel,
  cancelHref,
}: {
  action: ProjectFormAction;
  project?: ProjectProfile;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { errors: [] });

  return (
    <form action={formAction} className="space-y-6">
      {state.errors.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
          <p className="font-semibold">Fix these validation errors</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {state.errors.map((error) => {
              return <li key={error}>{error}</li>;
            })}
          </ul>
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Project basics
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Name
            <input
              name="name"
              required
              minLength={2}
              defaultValue={project?.name ?? ""}
              placeholder="e.g. GridWise AI"
              className={textInputClass}
            />
          </label>
          <label className={labelClass}>
            Country
            <input
              name="country"
              required
              minLength={2}
              defaultValue={project?.country ?? ""}
              placeholder="e.g. Greece"
              className={textInputClass}
            />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Short description
            <textarea
              name="shortDescription"
              required
              minLength={10}
              rows={3}
              defaultValue={project?.shortDescription ?? ""}
              placeholder="One or two sentences describing the project."
              className={textInputClass}
            />
          </label>
          <label className={labelClass}>
            Stage
            <select
              name="stage"
              required
              defaultValue={project?.stage ?? "prototype"}
              className={textInputClass}
            >
              {projectStageSchema.options.map((stage) => {
                return (
                  <option key={stage} value={stage}>
                    {stageLabels[stage]}
                  </option>
                );
              })}
            </select>
          </label>
          <label className={labelClass}>
            TRL
            <input
              name="trl"
              type="number"
              min={1}
              max={9}
              defaultValue={project?.trl ?? ""}
              placeholder="Optional, 1-9"
              className={textInputClass}
            />
            <span className={helpClass}>
              Optional. If provided, TRL improves stage-fit scoring.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Match context
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <ListField
            name="sectors"
            label="Sectors"
            defaultValue={joinList(project?.sectors)}
            placeholder="energy, climate, maritime"
          />
          <ListField
            name="technologies"
            label="Technologies"
            defaultValue={joinList(project?.technologies)}
            placeholder="AI, sensors, edge devices"
          />
          <label className={labelClass}>
            Target users
            <textarea
              name="targetUsers"
              required
              minLength={2}
              rows={3}
              defaultValue={project?.targetUsers ?? ""}
              placeholder="Who uses or buys this?"
              className={textInputClass}
            />
          </label>
          <ListField
            name="keywords"
            label="Keywords"
            defaultValue={joinList(project?.keywords)}
            placeholder="pilot validation, biodiversity, infrastructure"
          />
          <label className={`${labelClass} md:col-span-2`}>
            Problem solved
            <textarea
              name="problemSolved"
              required
              minLength={10}
              rows={3}
              defaultValue={project?.problemSolved ?? ""}
              placeholder="What problem does the project solve?"
              className={textInputClass}
            />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Solution
            <textarea
              name="solution"
              required
              minLength={10}
              rows={3}
              defaultValue={project?.solution ?? ""}
              placeholder="How does the project solve it?"
              className={textInputClass}
            />
          </label>
          <ListField
            name="avoid"
            label="Avoid"
            defaultValue={joinList(project?.avoid)}
            placeholder="pure equity, defence-only calls"
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Funding preferences
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Select every format the project would consider.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fundingTypeSchema.options.map((type) => {
            return (
              <label
                key={type}
                className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  name="preferredFundingTypes"
                  value={type}
                  defaultChecked={getFundingTypeDefault(project, type)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                />
                {fundingTypeLabels[type]}
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Scoring weights
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Keep defaults for a balanced scan, or raise the weights that matter
          most for this profile.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <WeightField project={project} name="topicFit" label="Topic fit" />
          <WeightField
            project={project}
            name="eligibilityFit"
            label="Eligibility"
          />
          <WeightField
            project={project}
            name="fundingFit"
            label="Funding type"
          />
          <WeightField project={project} name="stageFit" label="Stage fit" />
          <WeightField project={project} name="deadlineFit" label="Deadline" />
          <WeightField
            project={project}
            name="competitionRisk"
            label="Competition risk"
          />
          <WeightField
            project={project}
            name="strategicValue"
            label="Strategic value"
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function ListField({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        name={name}
        required={name !== "avoid"}
        rows={3}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={textInputClass}
      />
      <span className={helpClass}>Use commas or new lines.</span>
    </label>
  );
}

function WeightField({
  project,
  name,
  label,
}: {
  project?: ProjectProfile;
  name: keyof typeof defaultScoringWeights;
  label: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        type="number"
        min={0}
        max={5}
        step={1}
        defaultValue={project?.scoringWeights[name] ?? defaultScoringWeights[name]}
        className={textInputClass}
      />
    </label>
  );
}

function joinList(values: string[] | undefined) {
  return values?.join(", ") ?? "";
}

function getFundingTypeDefault(
  project: ProjectProfile | undefined,
  type: (typeof fundingTypeSchema.options)[number],
) {
  if (project) {
    return project.preferredFundingTypes.includes(type);
  }

  return type === "grant" || type === "pilot";
}
