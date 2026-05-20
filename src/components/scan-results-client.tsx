"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/badge";
import { MatchCard } from "@/components/match-card";
import { fundingScanResultSchema, type FundingScanResult } from "@/lib/schemas";
import {
  fundingSourceTypeLabels,
  verdictLabels,
  verdictTone,
} from "@/lib/labels";
import { getOfficialCallUrl } from "@/lib/funding-call-links";

type ScanState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; scan: FundingScanResult };

export function ScanResultsClient({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [scanState, setScanState] = useState<ScanState>({ status: "loading" });
  const [scanRun, setScanRun] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadScan() {
      setScanState({ status: "loading" });

      try {
        const response = await fetch(`/api/projects/${projectId}/scan`, {
          method: "POST",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message =
            typeof body?.error === "string"
              ? body.error
              : `Scan request failed with status ${response.status}.`;

          throw new Error(message);
        }

        const payload = await response.json();
        const scan = fundingScanResultSchema.parse(payload);
        setScanState({ status: "success", scan });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setScanState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "The funding scan could not be completed.",
        });
      }
    }

    loadScan();

    return () => {
      controller.abort();
    };
  }, [projectId, scanRun]);

  if (scanState.status === "loading") {
    return <ScanLoadingState />;
  }

  if (scanState.status === "error") {
    return (
      <ScanErrorState
        message={scanState.message}
        onRetry={() => setScanRun((current) => current + 1)}
      />
    );
  }

  const { scan } = scanState;
  const topMatch = scan.matches[0];
  const usesMockCalls = scan.matches.some(
    (match) => match.call.sourceType === "mock",
  );
  const usesManualCalls = scan.matches.some(
    (match) => match.call.sourceType === "manual",
  );

  return (
    <div className="mt-8 space-y-8">
      {usesMockCalls ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          This scan is currently using demo funding data. Real EU Funding Portal
          integration is not enabled yet.
        </div>
      ) : null}

      {usesManualCalls ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          Some results come from manually curated funding data. Verify official
          details before applying.
        </div>
      ) : null}

      {!scan.usedOpenAI ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">AI explanations unavailable</p>
          <p className="mt-1">
            The scanner is using local fallback explanations. Deterministic
            scores, rankings, deadlines, budgets, URLs, and eligibility text
            still come from the product data and scoring module.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          <p className="font-semibold">OpenAI explanations active</p>
          <p className="mt-1">
            Scores remain deterministic; OpenAI generated only the explanatory
            text fields for this scan.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryMetric label="Matches scanned" value={scan.matches.length} />
        <SummaryMetric
          label="Top score"
          value={topMatch ? topMatch.scores.finalScore : 0}
        />
        <SummaryMetric
          label="Generated"
          value={new Date(scan.generatedAt).toLocaleTimeString()}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Comparison table
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Matches for {projectName}, sorted by final score descending.
            </p>
          </div>
          <Badge tone="slate">Deterministic ranking</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Funding call</th>
                <th className="px-4 py-3 font-semibold">Programme</th>
                <th className="px-4 py-3 font-semibold">Official link</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Budget</th>
                <th className="px-4 py-3 font-semibold">Retrieved</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scan.matches.map((match, index) => {
                const officialCallUrl = getOfficialCallUrl(match.call);

                return (
                  <tr key={match.call.id} className="align-top">
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {index + 1}
                    </td>
                    <td className="min-w-72 px-4 py-4 font-medium text-slate-950">
                      {match.call.title}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {match.call.programme}
                    </td>
                    <td className="min-w-40 px-4 py-4">
                      {officialCallUrl ? (
                        <a
                          href={officialCallUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 hover:text-teal-900"
                        >
                          View official call
                        </a>
                      ) : (
                        <span className="text-slate-500">
                          No official link provided
                        </span>
                      )}
                    </td>
                    <td className="min-w-44 px-4 py-4 text-slate-600">
                      <div className="flex flex-col gap-2">
                        <span>{match.call.sourceName ?? "Unknown source"}</span>
                        {match.call.sourceType ? (
                          <Badge tone={sourceTone(match.call.sourceType)}>
                            {fundingSourceTypeLabels[match.call.sourceType]}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {match.call.deadline}
                    </td>
                    <td className="min-w-48 px-4 py-4 text-slate-600">
                      {match.call.budget}
                    </td>
                    <td className="min-w-40 px-4 py-4 text-slate-600">
                      {match.call.retrievedAt
                        ? new Date(match.call.retrievedAt).toLocaleString()
                        : "Not available"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={scoreTone(match.scores.finalScore)}>
                        {match.scores.finalScore}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={verdictTone[match.verdict]}>
                        {verdictLabels[match.verdict]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Ranked funding match cards
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Expand each section to inspect fit, risks, missing inputs, and
              the recommended next step.
            </p>
          </div>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            Back to profile
          </Link>
        </div>
        <div className="mt-4 space-y-5">
          {scan.matches.map((match, index) => {
            return (
              <MatchCard key={match.call.id} match={match} rank={index + 1} />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ScanLoadingState() {
  return (
    <div className="mt-8 space-y-6" aria-live="polite" aria-busy="true">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-44 rounded bg-slate-200" />
        <div className="mt-3 h-3 w-full max-w-xl rounded bg-slate-100" />
        <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-20 rounded bg-slate-100" />
          <div className="h-20 rounded bg-slate-100" />
          <div className="h-20 rounded bg-slate-100" />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-56 rounded bg-slate-200" />
        <div className="mt-5 space-y-3">
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ScanErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-950">
      <h2 className="text-base font-semibold">Funding scan failed</h2>
      <p className="mt-2">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
      >
        Retry scan
      </button>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function scoreTone(score: number): BadgeTone {
  if (score >= 85) {
    return "green";
  }

  if (score >= 70) {
    return "teal";
  }

  if (score >= 55) {
    return "amber";
  }

  return "slate";
}

function sourceTone(
  sourceType: NonNullable<
    FundingScanResult["matches"][number]["call"]["sourceType"]
  >,
): BadgeTone {
  if (sourceType === "eu_portal") {
    return "blue";
  }

  if (sourceType === "manual") {
    return "green";
  }

  return "slate";
}
