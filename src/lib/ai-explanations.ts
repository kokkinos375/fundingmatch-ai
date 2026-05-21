import {
  generateStructuredJson,
  type AIProvider,
  type AIProviderErrorCode,
} from "@/lib/ai-provider";
import {
  fundingMatchExplanationSchema,
  type FundingCall,
  type FundingMatchExplanation,
  type FundingMatchScores,
  type ProjectProfile,
  type Verdict,
} from "@/lib/schemas";

export type FundingMatchExplanationResult = {
  explanation: FundingMatchExplanation;
  usedAI: boolean;
  usedOpenAI: boolean;
  provider?: AIProvider;
  unavailableReason?: AIProviderErrorCode | "ai_skipped";
};

const explanationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["whyItFits", "risks", "missingInfo", "recommendedNextStep"],
  properties: {
    whyItFits: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    risks: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    missingInfo: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    recommendedNextStep: {
      type: "string",
    },
  },
} as const;

export async function explainFundingMatch(
  project: ProjectProfile,
  call: FundingCall,
  scores: FundingMatchScores,
  verdict: Verdict,
  options: { skipAI?: boolean } = {},
): Promise<FundingMatchExplanationResult> {
  if (options.skipAI) {
    return {
      explanation: buildFallbackFundingMatchExplanation(
        project,
        call,
        scores,
        verdict,
      ),
      usedAI: false,
      usedOpenAI: false,
      unavailableReason: "ai_skipped",
    };
  }

  const result = await generateStructuredJson({
    purpose: "funding_match_explanation",
    systemPrompt:
      "You explain EU funding matches for startup and project profiles. The scoring has already been calculated by software and is the source of truth. Do not invent or change scores, eligibility facts, deadlines, budgets, URLs, programme names, or the verdict. Return concise practical JSON only.",
    userPrompt: JSON.stringify({
      project: {
        name: project.name,
        country: project.country,
        sectors: project.sectors,
        technologies: project.technologies,
        stage: project.stage,
        trl: project.trl,
        preferredFundingTypes: project.preferredFundingTypes,
        keywords: project.keywords,
        avoid: project.avoid,
        problemSolved: project.problemSolved,
        solution: project.solution,
      },
      call,
      scores,
      verdict,
      instruction:
        "Explain why this call fits or does not fit, identify practical risks and missing information, and suggest one next step. Use only the project, call, scores, and verdict provided here. Do not invent deadlines, budgets, URLs, eligibility rules, programme names, or external policy facts. If a fact is missing, put it in missingInfo instead of guessing. Keep it generic and reusable for any startup/project profile.",
    }),
    schema: explanationJsonSchema,
  });

  if (!result.ok) {
    logExplanationFailure(result);

    return {
      explanation: buildFallbackFundingMatchExplanation(
        project,
        call,
        scores,
        verdict,
      ),
      usedAI: false,
      usedOpenAI: false,
      provider: result.provider,
      unavailableReason: result.errorCode,
    };
  }

  const explanation = fundingMatchExplanationSchema.safeParse(result.data);

  if (!explanation.success) {
    logExplanationFailure({
      ok: false,
      provider: result.provider,
      errorCode:
        result.provider === "gemini"
          ? "gemini_response_invalid"
          : "openai_response_invalid",
      statusCode: 502,
      diagnostics: {
        cause: "model_response_schema_validation_failed",
      },
    });

    return {
      explanation: buildFallbackFundingMatchExplanation(
        project,
        call,
        scores,
        verdict,
      ),
      usedAI: false,
      usedOpenAI: false,
      provider: result.provider,
      unavailableReason:
        result.provider === "gemini"
          ? "gemini_response_invalid"
          : "openai_response_invalid",
    };
  }

  return {
    explanation: explanation.data,
    usedAI: true,
    usedOpenAI: result.provider === "openai",
    provider: result.provider,
  };
}

export function buildFallbackFundingMatchExplanation(
  project: ProjectProfile,
  call: FundingCall,
  scores: FundingMatchScores,
  verdict: Verdict,
): FundingMatchExplanation {
  const strongestSignals = [
    scores.topicFit >= 70
      ? `${call.programme} appears aligned with ${project.name}'s topic and keywords.`
      : `${call.programme} has only partial overlap with the project topic.`,
    scores.fundingFit >= 70
      ? `The funding format maps to the preferred types: ${project.preferredFundingTypes.join(", ")}.`
      : "The funding format may not match the project's preferred funding types.",
    scores.stageFit >= 70
      ? `The call looks compatible with a ${project.stage.replace("_", " ")} project stage.`
      : `The project stage may need stronger evidence for this call.`,
  ];

  return {
    whyItFits: strongestSignals,
    risks: [
      scores.competitionRisk >= 70
        ? "Competition risk is high, so the application would need a sharp differentiation story."
        : "Competition risk looks manageable, but partner fit and call scope still need review.",
      scores.eligibilityFit < 65
        ? "Eligibility should be checked before investing in a full proposal."
        : "Eligibility appears plausible based on the mock call text, but official rules should be verified.",
    ],
    missingInfo: [
      project.trl
        ? "Confirm validation evidence, partner readiness, and budget assumptions."
        : "Add a TRL estimate and validation evidence to improve stage matching.",
      "Check the official call document for exact consortium, country, and cost eligibility rules.",
    ],
    recommendedNextStep:
      verdict === "excellent_match" || verdict === "good_match"
        ? "Prepare a one-page fit memo and verify the official call text before drafting."
        : "Use this as a watchlist item unless the project can close the noted fit gaps.",
  };
}

function logExplanationFailure(
  result: Extract<
    Awaited<ReturnType<typeof generateStructuredJson>>,
    { ok: false }
  >,
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn("[funding-match-ai] AI explanation fallback", {
    provider: result.provider,
    errorCode: result.errorCode,
    diagnostics: result.diagnostics,
  });
}
