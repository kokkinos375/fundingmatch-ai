import Link from "next/link";
import { notFound } from "next/navigation";
import { updateManualFundingCallAction } from "@/app/funding-calls/actions";
import { ManualFundingCallForm } from "@/components/manual-funding-call-form";
import { requireUser } from "@/lib/auth";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function EditFundingCallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/funding-calls/${id}/edit`);
  const call = await getStorageForUser(user.id).getManualFundingCall(id);

  if (!call) {
    notFound();
  }

  const action = updateManualFundingCallAction.bind(null, call.id);

  return (
    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Edit funding call
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Update the curated record used by the manual funding source.
          </p>
        </div>
        <Link
          href={`/funding-calls/${call.id}`}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          Back to call
        </Link>
      </div>

      <ManualFundingCallForm
        action={action}
        call={call}
        submitLabel="Update funding call"
      />
    </section>
  );
}
