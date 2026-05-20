import Link from "next/link";
import { AdminToolsClient } from "@/components/admin-tools-client";
import { Badge, type BadgeTone } from "@/components/badge";
import {
  isEUPortalSourceEnabled,
  isManualSourceEnabled,
  isMockSourceEnabled,
} from "@/lib/funding-sources/config";
import { getStorageDiagnostics } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const diagnostics = await getStorageDiagnostics();
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Admin tools
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Verify storage health, seed the example profile, and move data
            between local JSON and Supabase.
          </p>
        </div>
        <Link
          href="/projects"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          Back to projects
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
        <p className="font-semibold">
          Development/admin tools are not a public product surface. Do not
          expose this page in production.
        </p>
        {isProduction ? (
          <p className="mt-1">
            This app is running with <code>NODE_ENV=production</code>. Protect
            or disable this route before public launch.
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Storage driver" value={diagnostics.activeDriver} />
        <Metric
          label="Projects"
          value={diagnostics.projectsLoaded ?? "Unavailable"}
        />
        <Metric
          label="Manual calls"
          value={diagnostics.manualFundingCallsLoaded ?? "Unavailable"}
        />
        <Metric
          label="OpenAI key"
          value={process.env.OPENAI_API_KEY ? "Present" : "Missing"}
          tone={process.env.OPENAI_API_KEY ? "green" : "amber"}
        />
        <Metric
          label="Supabase"
          value={diagnostics.supabase.ready ? "Ready" : "Not ready"}
          tone={diagnostics.supabase.ready ? "green" : "slate"}
        />
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Environment status
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Booleans and non-secret mode labels only. Raw environment values
              are intentionally hidden.
            </p>
          </div>
          <Badge tone={isProduction ? "red" : "green"}>
            NODE_ENV: {process.env.NODE_ENV ?? "development"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusMetric
            label="OpenAI key present"
            active={Boolean(process.env.OPENAI_API_KEY)}
          />
          <StatusMetric
            label="Supabase URL present"
            active={diagnostics.supabase.hasUrl}
          />
          <StatusMetric
            label="Supabase anon key present"
            active={diagnostics.supabase.hasAnonKey ?? false}
          />
          <StatusMetric
            label="Supabase service key present"
            active={diagnostics.supabase.hasServiceRoleKey}
          />
          <Metric label="Storage driver" value={diagnostics.activeDriver} />
          <StatusMetric label="Mock source enabled" active={isMockSourceEnabled()} />
          <StatusMetric
            label="Manual source enabled"
            active={isManualSourceEnabled()}
          />
          <StatusMetric
            label="EU portal source enabled"
            active={isEUPortalSourceEnabled()}
            activeTone="amber"
          />
          <Metric
            label="Runtime"
            value={process.env.NODE_ENV ?? "development"}
            tone={isProduction ? "red" : "green"}
          />
        </div>
      </section>

      <div className="mt-8">
        <AdminToolsClient disabled={isProduction} />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  tone?: BadgeTone;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <div className="mt-2">
        <Badge tone={tone}>{value}</Badge>
      </div>
    </div>
  );
}

function StatusMetric({
  label,
  active,
  activeTone = "green",
}: {
  label: string;
  active: boolean;
  activeTone?: BadgeTone;
}) {
  return (
    <Metric
      label={label}
      value={active ? "true" : "false"}
      tone={active ? activeTone : "slate"}
    />
  );
}
