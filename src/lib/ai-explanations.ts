import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
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
  usedOpenAI: boolean;
  unavailableReason?: string;
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
  options: { skipOpenAI?: boolean } = {},
): Promise<FundingMatchExplanationResult> {
  if (options.skipOpenAI) {
    return {
      explanation: buildFallbackFundingMatchExplanation(
        project,
        call,
        scores,
        verdict,
      ),
      usedOpenAI: false,
      unavailableReason: "openai_skipped",
    };
  }

  const client = getOpenAIClient();

  if (!client) {
    return {
      explanation: buildFallbackFundingMatchExplanation(
        project,
        call,
        scores,
        verdict,
      ),
      usedOpenAI: false,
      unavailableReason: "missing_api_key",
    };
  }

  try {
    const response = await client.responses.create({
      model: getOpenAIModel(),
      input: [
        {
          role: "system",
          content:
            "You explain EU funding matches for startup and project profiles. The scoring has already been calculated deterministically by software. Do not invent or change scores, eligibility facts, deadlines, or the verdict. Return concise practical JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
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
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "funding_match_explanation",
          strict: true,
          schema: explanationJsonSchema,
        },
      },
    });

    const content = response.output_text;
    const parsed = JSON.parse(content);

    return {
      explanation: fundingMatchExplanationSchema.parse(parsed),
      usedOpenAI: true,
    };
  } catch (error) {
    const summary = summarizeOpenAIError(error);
    console.error("OpenAI explanation failed", summary);

    return {
      explanation: buildFallbackFundingMatchExplanation(
        project,
        call,
        scores,
        verdict,
      ),
      usedOpenAI: false,
      unavailableReason: summary.code ?? summary.type ?? "openai_error",
    };
  }
}

function summarizeOpenAIError(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as {
      status?: number;
      code?: string;
      type?: string;
      message?: string;
    };

    return {
      status: maybeError.status,
      code: maybeError.code,
      type: maybeError.type,
      message: maybeError.message,
    };
  }

  return { message: "Unknown OpenAI error" };
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
