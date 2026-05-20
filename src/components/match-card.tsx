import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/badge";
import { ScoreBar } from "@/components/score-bar";
import {
  fundingSourceTypeLabels,
  verdictLabels,
  verdictTone,
} from "@/lib/labels";
import { getOfficialCallUrl } from "@/lib/funding-call-links";
import type { FundingMatch } from "@/lib/schemas";

export function MatchCard({
  match,
  rank,
}: {
  match: FundingMatch;
  rank: number;
}) {
  const officialCallUrl = getOfficialCallUrl(match.call);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="slate">#{rank}</Badge>
            <Badge tone={verdictTone[match.verdict]}>
              {verdictLabels[match.verdict]}
            </Badge>
            <Badge tone={scoreTone(match.scores.finalScore)}>
              Final score {match.scores.finalScore}
            </Badge>
            <Badge tone="blue">{match.call.programme}</Badge>
            {match.call.sourceType ? (
              <Badge tone={sourceTone(match.call.sourceType)}>
                {fundingSourceTypeLabels[match.call.sourceType]}
              </Badge>
            ) : null}
          </div>
          <h2 className="mt-3 break-words text-xl font-semibold tracking-tight text-slate-950">
            {match.call.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {match.call.description}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Topic ID</dt>
              <dd className="mt-1 font-mono text-xs text-slate-900">
                {match.call.topicId}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Deadline</dt>
              <dd className="mt-1 text-slate-900">{match.call.deadline}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Budget</dt>
              <dd className="mt-1 text-slate-900">{match.call.budget}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-slate-900">{match.call.status}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Source</dt>
              <dd className="mt-1 text-slate-900">
                {match.call.sourceName ?? "Unknown source"}
              </dd>
            </div>
            {match.call.retrievedAt ? (
              <div>
                <dt className="font-medium text-slate-500">Retrieved</dt>
                <dd className="mt-1 text-slate-900">
                  {new Date(match.call.retrievedAt).toLocaleString()}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="w-full shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:w-72">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Final score
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
            {match.scores.finalScore}
          </p>
          <div className="mt-4 space-y-3">
            <ScoreBar label="Topic fit" value={match.scores.topicFit} />
            <ScoreBar
              label="Eligibility"
              value={match.scores.eligibilityFit}
            />
            <ScoreBar label="Funding" value={match.scores.fundingFit} />
            <ScoreBar label="Stage" value={match.scores.stageFit} />
            <ScoreBar label="Deadline" value={match.scores.deadlineFit} />
            <ScoreBar
              label="Competition risk"
              value={match.scores.competitionRisk}
              inverse
            />
            <ScoreBar
              label="Strategic value"
              value={match.scores.strategicValue}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <ExpandableSection title="Why it fits" defaultOpen>
          <InsightList items={match.whyItFits} />
        </ExpandableSection>
        <ExpandableSection title="Risks">
          <InsightList items={match.risks} />
        </ExpandableSection>
        <ExpandableSection title="Missing info">
          <InsightList items={match.missingInfo} />
        </ExpandableSection>
        <ExpandableSection title="Recommended next step" defaultOpen>
          <p className="text-sm leading-6 text-slate-600">
            {match.recommendedNextStep}
          </p>
        </ExpandableSection>
      </div>

      {officialCallUrl ? (
        <a
          href={officialCallUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 hover:text-teal-900"
        >
          View official call
        </a>
      ) : (
        <p className="mt-4 text-sm font-medium text-slate-500">
          No official link provided
        </p>
      )}
    </article>
  );
}

function ExpandableSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-950">
        {title}
        <span className="text-lg leading-none text-slate-400 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function InsightList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-600">
      {items.map((item) => {
        return <li key={item}>{item}</li>;
      })}
    </ul>
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

function sourceTone(sourceType: FundingMatch["call"]["sourceType"]): BadgeTone {
  if (sourceType === "eu_portal") {
    return "blue";
  }

  if (sourceType === "manual") {
    return "green";
  }

  return "slate";
}
