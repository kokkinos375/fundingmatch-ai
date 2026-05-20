import Link from "next/link";
import {
  MANUAL_FUNDING_SOURCE_NAME,
  type FundingCallInput,
} from "@/lib/storage/types";
import type { FundingCall } from "@/lib/schemas";

const textInputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

const labelClass = "text-sm font-semibold text-slate-800";
const helpClass = "mt-1 text-xs leading-5 text-slate-500";

export function ManualFundingCallForm({
  action,
  call,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  call?: FundingCall;
  submitLabel: string;
}) {
  const defaults = getManualFundingCallDefaults(call);

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Call basics</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextField
            name="title"
            label="Title"
            required
            minLength={2}
            defaultValue={defaults.title}
          />
          <TextField
            name="programme"
            label="Programme"
            required
            minLength={2}
            defaultValue={defaults.programme}
          />
          <TextField
            name="topicId"
            label="Topic ID"
            required
            defaultValue={defaults.topicId}
          />
          <TextField
            name="status"
            label="Status"
            required
            defaultValue={defaults.status}
          />
          <TextField
            name="deadline"
            label="Deadline"
            required
            defaultValue={defaults.deadline}
          />
          <TextField
            name="budget"
            label="Budget"
            required
            defaultValue={defaults.budget}
          />
          <label className={`${labelClass} md:col-span-2`}>
            URL
            <input
              name="url"
              type="url"
              required
              defaultValue={defaults.url}
              className={textInputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Description and eligibility
        </h2>
        <div className="mt-5 grid gap-5">
          <label className={labelClass}>
            Description
            <textarea
              name="description"
              required
              minLength={10}
              rows={5}
              defaultValue={defaults.description}
              className={textInputClass}
            />
          </label>
          <label className={labelClass}>
            Eligibility
            <textarea
              name="eligibility"
              required
              minLength={10}
              rows={5}
              defaultValue={defaults.eligibility}
              className={textInputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Manual source metadata
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextField
            name="sourceName"
            label="Source name"
            required
            defaultValue={defaults.sourceName ?? ""}
          />
          <label className={labelClass}>
            Source URL
            <input
              name="sourceUrl"
              type="url"
              defaultValue={defaults.sourceUrl ?? ""}
              className={textInputClass}
            />
            <span className={helpClass}>
              Usually the official programme or call page used for curation.
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={call ? `/funding-calls/${call.id}` : "/funding-calls"}
          className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  required = false,
  minLength,
}: {
  name: keyof FundingCallInput;
  label: string;
  defaultValue: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
        className={textInputClass}
      />
    </label>
  );
}

function getManualFundingCallDefaults(call?: FundingCall): FundingCallInput {
  return {
    title: call?.title ?? "",
    programme: call?.programme ?? "",
    topicId: call?.topicId ?? "",
    status: call?.status ?? "Open",
    deadline: call?.deadline ?? "",
    budget: call?.budget ?? "",
    url: call?.url ?? "",
    description: call?.description ?? "",
    eligibility: call?.eligibility ?? "",
    sourceName: call?.sourceName ?? MANUAL_FUNDING_SOURCE_NAME,
    sourceUrl: call?.sourceUrl ?? call?.url ?? "",
  };
}
