import Link from "next/link";
import { Badge } from "@/components/badge";
import { ManualCallImporter } from "@/components/manual-call-importer";
import { fundingSourceTypeLabels } from "@/lib/labels";
import { getStorage, getStorageDiagnostics } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function FundingCallsPage() {
  const [calls, storageDiagnostics] = await Promise.all([
    getStorage().listManualFundingCalls(),
    getStorageDiagnostics(),
  ]);
  const validationErrorCount =
    storageDiagnostics.validationErrorCounts.manualFundingCalls ?? 0;

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Manual funding calls
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Curate real opportunities from official programme pages and include
            them in the same deterministic scanner as the demo source.
          </p>
        </div>
        <Link
          href="/funding-calls/new"
          className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Add funding call
        </Link>
      </div>

      {validationErrorCount > 0 ? (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Some local manual calls were skipped</p>
          <p className="mt-2">
            {validationErrorCount} invalid manual funding call records were
            rejected by storage validation. Check the development console for
            field-level details.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Curated database
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {calls.length} manual calls loaded from local JSON.
              </p>
            </div>
            <Badge tone="green">{fundingSourceTypeLabels.manual}</Badge>
          </div>

          {calls.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                No manual funding calls yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Add one manually or import a JSON array. Mock data remains
                available while this curated list is empty.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Programme</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Deadline</th>
                    <th className="px-4 py-3 font-semibold">Retrieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {calls.map((call) => {
                    return (
                      <tr key={call.id} className="align-top">
                        <td className="min-w-72 px-4 py-4">
                          <Link
                            href={`/funding-calls/${call.id}`}
                            className="font-medium text-slate-950 hover:text-teal-700"
                          >
                            {call.title}
                          </Link>
                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {call.topicId}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {call.programme}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {call.status}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {call.deadline}
                        </td>
                        <td className="min-w-40 px-4 py-4 text-slate-600">
                          {call.retrievedAt
                            ? new Date(call.retrievedAt).toLocaleString()
                            : "Not available"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ManualCallImporter />
      </div>
    </section>
  );
}
