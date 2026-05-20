import { explainFundingMatch } from "@/lib/ai-explanations";
import { calculateFundingMatchScores, verdictFromScore } from "@/lib/scoring";
import {
  fundingScanResultSchema,
  type FundingCall,
  type FundingMatch,
  type FundingScanResult,
  type ProjectProfile,
} from "@/lib/schemas";

export async function fundingMatchAgent(
  project: ProjectProfile,
  calls: FundingCall[],
): Promise<FundingScanResult> {
  // Deterministic scoring is the source of truth. AI never chooses, edits, or
  // randomizes scores, verdicts, call metadata, deadlines, budgets, or URLs.
  const scoredMatches = calls
    .map((call) => {
      const scores = calculateFundingMatchScores(project, call);

      return {
        call,
        scores,
        verdict: verdictFromScore(scores.finalScore),
      };
    })
    .sort((first, second) => {
      return second.scores.finalScore - first.scores.finalScore;
    });

  const matches: FundingMatch[] = [];
  let usedOpenAI = false;
  let skipOpenAI = false;

  for (const match of scoredMatches) {
    // AI is limited to explanatory prose. The strict schema excludes source
    // funding-call fields, and the UI displays those fields only from mock data.
    const result = await explainFundingMatch(
      project,
      match.call,
      match.scores,
      match.verdict,
      { skipOpenAI },
    );

    usedOpenAI = usedOpenAI || result.usedOpenAI;

    if (
      result.unavailableReason === "missing_api_key" ||
      result.unavailableReason === "insufficient_quota"
    ) {
      skipOpenAI = true;
    }

    matches.push({
      ...match,
      ...result.explanation,
    });
  }

  return fundingScanResultSchema.parse({
    projectId: project.id,
    generatedAt: new Date().toISOString(),
    matches,
    usedOpenAI,
  });
}
