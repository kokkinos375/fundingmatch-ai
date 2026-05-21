"use client";

import { useMemo, useState, useActionState } from "react";
import Link from "next/link";
import { SkeletonBlock } from "@/components/skeleton";
import { fundingTypeLabels, stageLabels } from "@/lib/labels";
import {
  defaultScoringWeights,
  fundingTypeSchema,
  projectStageSchema,
  type FundingType,
  type ProjectStage,
} from "@/lib/schemas";
import {
  projectProfileExtractionSchema,
  type ProjectProfileExtraction,
} from "@/lib/project-profile-extraction-schema";

type ProjectFormState = {
  errors: string[];
};

type ProjectFormAction = (
  state: ProjectFormState,
  formData: FormData,
) => Promise<ProjectFormState>;

type GuidedProjectDraft = {
  name: string;
  country: string;
  ideaDescription: string;
  shortDescription: string;
  targetUsers: string;
  technologies: string;
  sectors: string[];
  customSectors: string;
  stage: ProjectStage;
  trl: string;
  problemSolved: string;
  solution: string;
  keywords: string;
  preferredFundingTypes: FundingType[];
};

type ExtractState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialDraft: GuidedProjectDraft = {
  name: "",
  country: "",
  ideaDescription: "",
  shortDescription: "",
  targetUsers: "",
  technologies: "",
  sectors: [],
  customSectors: "",
  stage: "prototype",
  trl: "",
  problemSolved: "",
  solution: "",
  keywords: "",
  preferredFundingTypes: ["grant", "pilot", "accelerator"],
};

const steps = [
  "Describe",
  "Review",
  "Refine",
  "Completeness",
  "Confirm",
] as const;

const sectorOptions = [
  "sustainability",
  "environment",
  "digital innovation",
  "health",
  "energy",
  "mobility",
  "education",
  "agriculture",
  "manufacturing",
  "creative industries",
  "public sector",
  "research",
];

const textInputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const labelClass = "text-sm font-semibold text-slate-800";
const helpClass = "mt-1 text-xs leading-5 text-slate-500";

export function GuidedProjectCreationFlow({
  action,
}: {
  action: ProjectFormAction;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<GuidedProjectDraft>(initialDraft);
  const [extractState, setExtractState] = useState<ExtractState>({
    status: "idle",
  });
  const [state, formAction, isPending] = useActionState(action, { errors: [] });
  const currentStep = steps[stepIndex];
  const canContinue = getCanContinue(currentStep, draft);
  const generatedProfile = useMemo(() => buildProfileFields(draft), [draft]);
  const completeness = useMemo(() => getProfileCompleteness(draft), [draft]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.24fr_0.5fr_0.26fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Guided setup
        </p>
        <ol className="mt-5 space-y-3">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isComplete = index < stepIndex;

            return (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      isActive || isComplete
                        ? "bg-teal-700 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {step}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          Prefer the full form?{" "}
          <Link
            href="/projects/new/advanced"
            className="font-semibold text-teal-700 hover:text-teal-900"
          >
            Open advanced mode
          </Link>
          .
        </div>
      </aside>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200">
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Step {stepIndex + 1} of {steps.length}
            </span>
            <span>{completeness.percent}% complete</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <details className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4 xl:hidden">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">
            Live profile preview
          </summary>
          <div className="mt-4">
            <ProfilePreviewCard
              generatedProfile={generatedProfile}
              completeness={completeness}
            />
          </div>
        </details>

        {state.errors.length > 0 ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
            <p className="font-semibold">Fix these validation errors</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.errors.map((error) => {
                return <li key={error}>{error}</li>;
              })}
            </ul>
          </div>
        ) : null}

        <div className="min-h-[430px]">
          {currentStep === "Describe" ? (
            <IdeaStep
              draft={draft}
              extractState={extractState}
              onExtract={requestAiSuggestion}
              setDraft={setDraft}
            />
          ) : null}
          {currentStep === "Review" ? (
            <ReviewProfileStep draft={draft} setDraft={setDraft} />
          ) : null}
          {currentStep === "Refine" ? (
            <RefineStep draft={draft} setDraft={setDraft} />
          ) : null}
          {currentStep === "Completeness" ? (
            <CompletenessStep
              completeness={completeness}
              generatedProfile={generatedProfile}
              setStepIndex={setStepIndex}
            />
          ) : null}
          {currentStep === "Confirm" ? (
            <form action={formAction} className="space-y-6">
              <ConfirmationStep
                draft={draft}
                generatedProfile={generatedProfile}
                setDraft={setDraft}
              />
              <HiddenProjectFields generatedProfile={generatedProfile} />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStepIndex(stepIndex - 1)}
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isPending ? "Saving..." : "Save project profile"}
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {currentStep !== "Confirm" ? (
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() =>
                setStepIndex(Math.min(steps.length - 1, stepIndex + 1))
              }
              disabled={!canContinue}
              className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Continue
            </button>
          </div>
        ) : null}
      </section>

      <aside className="hidden xl:block">
        <div className="sticky top-6">
          <ProfilePreviewCard
            generatedProfile={generatedProfile}
            completeness={completeness}
          />
        </div>
      </aside>
    </div>
  );

  async function requestAiSuggestion() {
    const idea = draft.ideaDescription.trim();

    if (idea.length < 10) {
      setExtractState({
        status: "error",
        message:
          "Paste at least a short project idea before requesting suggestions.",
      });
      return;
    }

    setExtractState({ status: "loading" });

    try {
      const response = await fetch("/api/projects/extract-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getExtractorErrorMessage(payload));
      }

      const suggestion = projectProfileExtractionSchema.safeParse(
        isRecord(payload) ? payload.suggestion : undefined,
      );

      if (!suggestion.success) {
        throw new Error(
          "AI suggestions are unavailable right now. Your draft is safe; continue manually or try again later.",
        );
      }

      setDraft(applySuggestionToDraft(draft, suggestion.data));
      setStepIndex(1);
      setExtractState({
        status: "success",
        message:
          "AI suggestions were added. Review and edit the profile before saving.",
      });
    } catch (error) {
      setExtractState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "AI suggestions are unavailable right now. Your draft is safe; continue manually or try again later.",
      });
    }
  }
}

function IdeaStep({
  draft,
  extractState,
  onExtract,
  setDraft,
}: {
  draft: GuidedProjectDraft;
  extractState: ExtractState;
  onExtract: () => void;
  setDraft: (draft: GuidedProjectDraft) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Start with the idea"
        description="Write this in plain language. You can polish the profile later."
      />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          Project name
          <input
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            placeholder="e.g. CircularCity AI"
            className={textInputClass}
          />
        </label>
        <label className={labelClass}>
          Country
          <input
            value={draft.country}
            onChange={(event) =>
              setDraft({ ...draft, country: event.target.value })
            }
            placeholder="e.g. Greece"
            className={textInputClass}
          />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Project idea description
          <textarea
            value={draft.ideaDescription}
            onChange={(event) =>
              setDraft({ ...draft, ideaDescription: event.target.value })
            }
            rows={6}
            placeholder="What are you building, what problem does it solve, and why does it matter?"
            className={textInputClass}
          />
          <span className={helpClass}>
            Two or three sentences are enough for the first scan.
          </span>
          <div className="mt-3 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-5 text-slate-600">
              Paste your rough idea, then ask AI to suggest a structured
              profile you can review and edit.
            </div>
            <button
              type="button"
              onClick={onExtract}
              disabled={
                extractState.status === "loading" ||
                draft.ideaDescription.trim().length < 10
              }
              className="primary-action inline-flex shrink-0 justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {extractState.status === "loading"
                ? "Suggesting..."
                : "Suggest with AI"}
            </button>
          </div>
          {extractState.status === "success" ||
          extractState.status === "error" ? (
            <p
              className={`mt-2 text-xs leading-5 ${
                extractState.status === "success"
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {extractState.message}
            </p>
          ) : null}
          {extractState.status === "loading" ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
              <SkeletonBlock className="h-3 w-40" />
              <SkeletonBlock className="mt-2 h-3 w-full" />
              <SkeletonBlock className="mt-2 h-3 w-2/3" />
            </div>
          ) : null}
        </label>
        <label className={labelClass}>
          Target users
          <textarea
            value={draft.targetUsers}
            onChange={(event) =>
              setDraft({ ...draft, targetUsers: event.target.value })
            }
            rows={3}
            placeholder="Who will use, buy, or benefit from this?"
            className={textInputClass}
          />
        </label>
        <label className={labelClass}>
          Technologies or methods
          <textarea
            value={draft.technologies}
            onChange={(event) =>
              setDraft({ ...draft, technologies: event.target.value })
            }
            rows={3}
            placeholder="AI, sensors, platform, training, data analytics..."
            className={textInputClass}
          />
          <span className={helpClass}>Use commas or short phrases.</span>
        </label>
      </div>
    </div>
  );
}

function ReviewProfileStep({
  draft,
  setDraft,
}: {
  draft: GuidedProjectDraft;
  setDraft: (draft: GuidedProjectDraft) => void;
}) {
  const generatedProfile = buildProfileFields(draft);

  return (
    <div className="animate-[fadeIn_180ms_ease-out]">
      <StepHeading
        title="Review generated profile"
        description="Check the core story before refining sectors, technologies, and funding preferences."
      />
      <div className="mt-6 grid gap-5">
        <label className={labelClass}>
          Project name
          <input
            value={generatedProfile.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            placeholder="Project name"
            className={textInputClass}
          />
        </label>
        <EditableField
          label="Short description"
          value={generatedProfile.shortDescription}
          rows={3}
          onChange={(value) => setDraft({ ...draft, shortDescription: value })}
        />
        <EditableField
          label="Problem solved"
          value={generatedProfile.problemSolved}
          rows={3}
          onChange={(value) => setDraft({ ...draft, problemSolved: value })}
        />
        <EditableField
          label="Solution"
          value={generatedProfile.solution}
          rows={3}
          onChange={(value) => setDraft({ ...draft, solution: value })}
        />
      </div>
    </div>
  );
}

function RefineStep({
  draft,
  setDraft,
}: {
  draft: GuidedProjectDraft;
  setDraft: (draft: GuidedProjectDraft) => void;
}) {
  return (
    <div className="animate-[fadeIn_180ms_ease-out]">
      <StepHeading
        title="Refine funding profile"
        description="These details improve matching quality and make saved project profiles easier to scan later."
      />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          Target country
          <input
            value={draft.country}
            onChange={(event) =>
              setDraft({ ...draft, country: event.target.value })
            }
            placeholder="e.g. Greece"
            className={textInputClass}
          />
          <span className={helpClass}>
            Add target country to improve eligibility matching.
          </span>
        </label>
        <label className={labelClass}>
          TRL
          <select
            value={draft.trl}
            onChange={(event) =>
              setDraft({ ...draft, trl: event.target.value })
            }
            className={textInputClass}
          >
            <option value="">Not sure yet</option>
            {Array.from({ length: 9 }, (_, index) => index + 1).map((trl) => (
              <option key={trl} value={trl}>
                TRL {trl}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Target users
          <textarea
            value={draft.targetUsers}
            onChange={(event) =>
              setDraft({ ...draft, targetUsers: event.target.value })
            }
            rows={3}
            placeholder="Who will use, buy, or benefit from this?"
            className={textInputClass}
          />
        </label>
        <label className={labelClass}>
          Technologies
          <textarea
            value={draft.technologies}
            onChange={(event) =>
              setDraft({ ...draft, technologies: event.target.value })
            }
            rows={3}
            placeholder="AI, sensors, data analytics..."
            className={textInputClass}
          />
          <span className={helpClass}>
            Add technologies to improve call matching.
          </span>
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Keywords
          <textarea
            value={draft.keywords}
            onChange={(event) =>
              setDraft({ ...draft, keywords: event.target.value })
            }
            rows={2}
            placeholder="sustainability, AI, sensors, climate..."
            className={textInputClass}
          />
        </label>
      </div>
      <div className="mt-8 space-y-8">
        <SectorStep draft={draft} setDraft={setDraft} />
        <StageStep draft={draft} setDraft={setDraft} />
        <FundingStep draft={draft} setDraft={setDraft} />
      </div>
    </div>
  );
}

function CompletenessStep({
  completeness,
  generatedProfile,
  setStepIndex,
}: {
  completeness: ProfileCompleteness;
  generatedProfile: ReturnType<typeof buildProfileFields>;
  setStepIndex: (index: number) => void;
}) {
  return (
    <div className="animate-[fadeIn_180ms_ease-out]">
      <StepHeading
        title="Profile completeness preview"
        description="Review missing inputs before saving. You can still save a draft and refine it later."
      />
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Completeness
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {generatedProfile.name || "Untitled project"}
            </p>
          </div>
          <span className="text-3xl font-semibold text-slate-950">
            {completeness.percent}%
          </span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-300"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CompletenessList
          title="Missing fields"
          items={completeness.missing}
          emptyText="All core fields are covered."
        />
        <CompletenessList
          title="Suggestions"
          items={completeness.suggestions}
          emptyText="This profile is ready for a first scan."
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setStepIndex(2)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Refine profile
        </button>
      </div>
    </div>
  );
}

function SectorStep({
  draft,
  setDraft,
}: {
  draft: GuidedProjectDraft;
  setDraft: (draft: GuidedProjectDraft) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Choose sectors or industries"
        description="Pick the areas this project fits. This helps the scanner find relevant programmes."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sectorOptions.map((sector) => {
          const selected = draft.sectors.includes(sector);

          return (
            <button
              key={sector}
              type="button"
              onClick={() => {
                setDraft({
                  ...draft,
                  sectors: selected
                    ? draft.sectors.filter((item) => item !== sector)
                    : [...draft.sectors, sector],
                });
              }}
              className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                selected
                  ? "border-teal-300 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {sector}
            </button>
          );
        })}
      </div>
      <label className={`${labelClass} mt-6 block`}>
        Other sectors or keywords
        <textarea
          value={draft.customSectors}
          onChange={(event) =>
            setDraft({ ...draft, customSectors: event.target.value })
          }
          rows={3}
          placeholder="Add anything missing, separated by commas."
          className={textInputClass}
        />
      </label>
    </div>
  );
}

function StageStep({
  draft,
  setDraft,
}: {
  draft: GuidedProjectDraft;
  setDraft: (draft: GuidedProjectDraft) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Select the current stage"
        description="Choose the closest option. The scan uses this to avoid calls that are too early or too late."
      />
      <div className="mt-6 grid gap-3">
        {projectStageSchema.options.map((stage) => {
          const selected = draft.stage === stage;

          return (
            <button
              key={stage}
              type="button"
              onClick={() => setDraft({ ...draft, stage })}
              className={`rounded-md border px-4 py-3 text-left transition ${
                selected
                  ? "border-teal-300 bg-teal-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span className="text-sm font-semibold text-slate-950">
                {stageLabels[stage]}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {stageDescriptions[stage]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FundingStep({
  draft,
  setDraft,
}: {
  draft: GuidedProjectDraft;
  setDraft: (draft: GuidedProjectDraft) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Choose funding preferences"
        description="Select every funding format the project would seriously consider."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {fundingTypeSchema.options.map((type) => {
          const selected = draft.preferredFundingTypes.includes(type);

          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setDraft({
                  ...draft,
                  preferredFundingTypes: selected
                    ? draft.preferredFundingTypes.filter((item) => item !== type)
                    : [...draft.preferredFundingTypes, type],
                });
              }}
              className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                selected
                  ? "border-teal-300 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {fundingTypeLabels[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmationStep({
  draft,
  generatedProfile,
  setDraft,
}: {
  draft: GuidedProjectDraft;
  generatedProfile: ReturnType<typeof buildProfileFields>;
  setDraft: (draft: GuidedProjectDraft) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Confirm before saving"
        description="Review and edit these suggestions. Use the steps on the left to adjust sector, stage, or funding preferences."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SummaryItem label="Name" value={generatedProfile.name} />
        <SummaryItem label="Country" value={generatedProfile.country} />
        <SummaryItem label="Stage" value={stageLabels[generatedProfile.stage]} />
        <SummaryItem
          label="Funding preferences"
          value={generatedProfile.preferredFundingTypes
            .map((type) => fundingTypeLabels[type])
            .join(", ")}
        />
        <SummaryItem
          label="Sectors"
          value={generatedProfile.sectors.join(", ")}
        />
        <SummaryItem
          label="Technologies"
          value={generatedProfile.technologies.join(", ")}
        />
        <div className="md:col-span-2">
          <SummaryItem
            label="Project idea"
            value={draft.ideaDescription.trim()}
          />
        </div>
      </div>
      <div className="mt-6 grid gap-5">
        <EditableField
          label="Short description"
          value={generatedProfile.shortDescription}
          rows={3}
          onChange={(value) => setDraft({ ...draft, shortDescription: value })}
        />
        <EditableField
          label="Problem solved"
          value={generatedProfile.problemSolved}
          rows={3}
          onChange={(value) => setDraft({ ...draft, problemSolved: value })}
        />
        <EditableField
          label="Solution"
          value={generatedProfile.solution}
          rows={3}
          onChange={(value) => setDraft({ ...draft, solution: value })}
        />
        <EditableField
          label="Keywords"
          value={generatedProfile.keywords.join(", ")}
          rows={2}
          onChange={(value) => setDraft({ ...draft, keywords: value })}
          help="Use commas or new lines."
        />
      </div>
    </div>
  );
}

function HiddenProjectFields({
  generatedProfile,
}: {
  generatedProfile: ReturnType<typeof buildProfileFields>;
}) {
  return (
    <>
      <input type="hidden" name="name" value={generatedProfile.name} />
      <input type="hidden" name="country" value={generatedProfile.country} />
      <input
        type="hidden"
        name="shortDescription"
        value={generatedProfile.shortDescription}
      />
      <input
        type="hidden"
        name="sectors"
        value={generatedProfile.sectors.join(", ")}
      />
      <input
        type="hidden"
        name="technologies"
        value={generatedProfile.technologies.join(", ")}
      />
      <input
        type="hidden"
        name="targetUsers"
        value={generatedProfile.targetUsers}
      />
      <input
        type="hidden"
        name="problemSolved"
        value={generatedProfile.problemSolved}
      />
      <input type="hidden" name="solution" value={generatedProfile.solution} />
      <input type="hidden" name="stage" value={generatedProfile.stage} />
      <input type="hidden" name="trl" value={generatedProfile.trl ?? ""} />
      {generatedProfile.preferredFundingTypes.map((type) => {
        return (
          <input
            key={type}
            type="hidden"
            name="preferredFundingTypes"
            value={type}
          />
        );
      })}
      <input
        type="hidden"
        name="keywords"
        value={generatedProfile.keywords.join(", ")}
      />
      <input type="hidden" name="avoid" value="" />
      {Object.entries(defaultScoringWeights).map(([key, value]) => {
        return <input key={key} type="hidden" name={key} value={value} />;
      })}
    </>
  );
}

function StepHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
        Step
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-950">
        {value || "Not provided"}
      </p>
    </div>
  );
}

type ProfileCompleteness = {
  percent: number;
  missing: string[];
  suggestions: string[];
};

function ProfilePreviewCard({
  generatedProfile,
  completeness,
}: {
  generatedProfile: ReturnType<typeof buildProfileFields>;
  completeness: ProfileCompleteness;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
        Live profile
      </p>
      <h3 className="mt-3 break-words text-lg font-semibold text-slate-950">
        {generatedProfile.name || "Untitled project"}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {generatedProfile.shortDescription || "Add a short project description."}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-300"
          style={{ width: `${completeness.percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {completeness.percent}% complete
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {generatedProfile.sectors.slice(0, 4).map((sector) => (
          <span
            key={sector}
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
          >
            {sector}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompletenessList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">{emptyText}</p>
      )}
    </div>
  );
}

function EditableField({
  label,
  value,
  rows,
  help,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  help?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={textInputClass}
      />
      {help ? <span className={helpClass}>{help}</span> : null}
    </label>
  );
}

function buildProfileFields(draft: GuidedProjectDraft) {
  const idea = draft.ideaDescription.trim();
  const sectors = uniqueValues([
    ...draft.sectors,
    ...parseList(draft.customSectors),
  ]);
  const technologies = parseList(draft.technologies);
  const fallbackSectors = sectors.length > 0 ? sectors : ["innovation"];
  const fallbackTechnologies =
    technologies.length > 0 ? technologies : ["not specified"];
  const targetUsers = draft.targetUsers.trim() || "General project stakeholders";
  const shortDescription = draft.shortDescription.trim() || idea;
  const problemSolved =
    draft.problemSolved.trim() || `The project addresses this need: ${idea}`;
  const solution =
    draft.solution.trim() || `The proposed solution is described as: ${idea}`;
  const keywords = parseList(draft.keywords);

  return {
    name: draft.name.trim(),
    country: draft.country.trim(),
    shortDescription,
    sectors: fallbackSectors,
    technologies: fallbackTechnologies,
    targetUsers,
    problemSolved,
    solution,
    stage: draft.stage,
    trl: draft.trl ? Number(draft.trl) : undefined,
    preferredFundingTypes: draft.preferredFundingTypes,
    keywords:
      keywords.length > 0
        ? keywords
        : uniqueValues([
            ...fallbackSectors,
            ...fallbackTechnologies,
            ...draft.preferredFundingTypes,
          ]),
  };
}

function getProfileCompleteness(draft: GuidedProjectDraft): ProfileCompleteness {
  const checks = [
    { label: "Project name", ok: draft.name.trim().length >= 2 },
    { label: "Project description", ok: draft.ideaDescription.trim().length >= 10 },
    { label: "Target country", ok: draft.country.trim().length >= 2 },
    {
      label: "Sectors",
      ok: draft.sectors.length > 0 || draft.customSectors.trim().length > 0,
    },
    { label: "Technologies", ok: parseList(draft.technologies).length > 0 },
    { label: "Target users", ok: draft.targetUsers.trim().length >= 2 },
    { label: "Problem solved", ok: buildProfileFields(draft).problemSolved.length >= 10 },
    { label: "Solution", ok: buildProfileFields(draft).solution.length >= 10 },
    { label: "Funding preferences", ok: draft.preferredFundingTypes.length > 0 },
    { label: "Keywords", ok: parseList(draft.keywords).length > 0 },
  ];
  const missing = checks.filter((check) => !check.ok).map((check) => check.label);
  const suggestions = [
    !draft.country.trim()
      ? "Add target country to improve eligibility matching."
      : null,
    parseList(draft.technologies).length === 0
      ? "Add technologies to improve call matching."
      : null,
    !draft.trl ? "Add TRL if you know it to improve stage matching." : null,
    parseList(draft.keywords).length === 0
      ? "Add keywords that funders would use in call text."
      : null,
  ].filter((item): item is string => Boolean(item));

  return {
    percent: Math.round(((checks.length - missing.length) / checks.length) * 100),
    missing,
    suggestions,
  };
}

function applySuggestionToDraft(
  draft: GuidedProjectDraft,
  suggestion: ProjectProfileExtraction,
): GuidedProjectDraft {
  const suggestedKnownSectors = suggestion.sectors.filter((sector) => {
    return sectorOptions.includes(sector);
  });
  const suggestedCustomSectors = suggestion.sectors.filter((sector) => {
    return !sectorOptions.includes(sector);
  });

  return {
    ...draft,
    name: suggestion.name,
    shortDescription: suggestion.shortDescription,
    sectors: suggestedKnownSectors,
    customSectors: suggestedCustomSectors.join(", "),
    technologies: suggestion.technologies.join(", "),
    targetUsers: suggestion.targetUsers,
    problemSolved: suggestion.problemSolved,
    solution: suggestion.solution,
    stage: suggestion.stage,
    keywords: suggestion.keywords.join(", "),
    preferredFundingTypes: suggestion.preferredFundingTypes,
  };
}

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getExtractorErrorMessage(payload: unknown) {
  if (isRecord(payload)) {
    if (
      payload.errorCode === "missing_gemini_key" ||
      payload.errorCode === "missing_openai_key"
    ) {
      return "AI suggestions are not configured yet.";
    }

    if (payload.errorCode === "gemini_quota_or_rate_limit") {
      return "AI suggestions are temporarily unavailable due to Gemini API quota or rate limits.";
    }

    if (payload.errorCode === "openai_quota_or_rate_limit") {
      return "AI suggestions are temporarily unavailable due to OpenAI API quota or rate limits.";
    }

    if (payload.errorCode === "gemini_invalid_key") {
      return "AI suggestions are unavailable because the Gemini API key is invalid.";
    }

    if (payload.errorCode === "openai_invalid_key") {
      return "AI suggestions are unavailable because the OpenAI API key is invalid.";
    }

    if (
      payload.errorCode === "gemini_response_invalid" ||
      payload.errorCode === "openai_response_invalid"
    ) {
      return "AI suggestions returned an unexpected format. Please try again.";
    }
  }

  return "AI suggestions are unavailable right now. Your draft is safe; continue manually or try again later.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getCanContinue(
  step: (typeof steps)[number],
  draft: GuidedProjectDraft,
) {
  if (step === "Describe") {
    return (
      draft.ideaDescription.trim().length >= 10
    );
  }

  if (step === "Refine") {
    return draft.preferredFundingTypes.length > 0;
  }

  return true;
}

const stageDescriptions: Record<ProjectStage, string> = {
  idea: "You have a concept or early plan, but no working prototype yet.",
  prototype: "You have a first working version or proof of concept.",
  pilot: "You are testing with users, partners, or a real environment.",
  early_revenue: "You have first paying users, sales, or committed customers.",
  scaling: "You are expanding into more markets, customers, or regions.",
};
