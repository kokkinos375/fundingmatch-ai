import Link from "next/link";
import { createManualFundingCallAction } from "@/app/funding-calls/actions";
import { ManualFundingCallForm } from "@/components/manual-funding-call-form";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewFundingCallPage() {
  await requireUser("/funding-calls/new");

  return (
    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Add a funding call
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Store a manually curated opportunity and make it available to the
            funding scanner.
          </p>
        </div>
        <Link
          href="/funding-calls"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          Back to funding calls
        </Link>
      </div>

      <ManualFundingCallForm
        action={createManualFundingCallAction}
        submitLabel="Save funding call"
      />
    </section>
  );
}
