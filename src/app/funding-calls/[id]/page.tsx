import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteManualFundingCallAction } from "@/app/funding-calls/actions";
import { Badge } from "@/components/badge";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { requireUser } from "@/lib/auth";
import { fundingSourceTypeLabels } from "@/lib/labels";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function FundingCallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/funding-calls/${id}`);
  const call = await getStorageForUser(user.id).getManualFundingCall(id);

  if (!call) {
    notFound();
  }

  const deleteAction = deleteManualFundingCallAction.bind(null, call.id);

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/funding-calls"
            className="text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            Manual funding calls
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="green">{fundingSourceTypeLabels.manual}</Badge>
            <Badge tone="slate">{call.status}</Badge>
            <Badge tone="blue">{call.programme}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {call.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {call.description}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/funding-calls/${call.id}/edit`}
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          <ConfirmDeleteForm
            action={deleteAction}
            label="Delete"
            message={`Delete funding call "${call.title}"? This cannot be undone.`}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.68fr_0.32fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Call details
            </h2>
            <dl className="mt-5 grid gap-5 md:grid-cols-2">
              <Detail label="Topic ID" value={call.topicId} mono />
              <Detail label="Deadline" value={call.deadline} />
              <Detail label="Budget" value={call.budget} />
              <Detail label="Status" value={call.status} />
              <Detail label="Source name" value={call.sourceName ?? ""} />
              <Detail
                label="Retrieved"
                value={
                  call.retrievedAt
                    ? new Date(call.retrievedAt).toLocaleString()
                    : "Not available"
                }
              />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Eligibility
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {call.eligibility}
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Links
            </h2>
            <div className="mt-4 space-y-3">
              <a
                href={call.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:text-teal-900"
              >
                Open call URL
              </a>
              {call.sourceUrl ? (
                <a
                  href={call.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:text-teal-900"
                >
                  Open source URL
                </a>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd
        className={`mt-1 text-sm leading-6 text-slate-950 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
