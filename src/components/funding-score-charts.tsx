"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FundingMatch, FundingMatchScores } from "@/lib/schemas";

const scoreLabels: Array<{
  key: keyof FundingMatchScores;
  label: string;
}> = [
  { key: "topicFit", label: "Topic" },
  { key: "eligibilityFit", label: "Eligibility" },
  { key: "fundingFit", label: "Funding" },
  { key: "stageFit", label: "Stage" },
  { key: "deadlineFit", label: "Deadline" },
  { key: "competitionRisk", label: "Risk" },
  { key: "strategicValue", label: "Strategy" },
];

export function ScoreBreakdownChart({ scores }: { scores: FundingMatchScores }) {
  const data = scoreLabels.map((item) => ({
    label: item.label,
    score: safeScore(scores[item.key]),
  }));

  return (
    <div className="h-56 w-full" aria-label="Score breakdown chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
            formatter={(value) => [`${value}`, "Score"]}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#0f766e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopMatchesComparisonChart({
  matches,
}: {
  matches: FundingMatch[];
}) {
  const data = matches.slice(0, 5).map((match, index) => ({
    name: `#${index + 1}`,
    title: match.call.title,
    score: safeScore(match.scores.finalScore),
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No scan results are available to chart yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full" aria-label="Top funding opportunities chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
            formatter={(value) => [`${value}`, "Final score"]}
            labelFormatter={(_, payload) => {
              return payload?.[0]?.payload?.title ?? "Funding opportunity";
            }}
          />
          <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#14b8a6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function safeScore(value: number | undefined) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? Number(value) : 0));
}
