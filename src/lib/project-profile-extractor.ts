import "server-only";

import {
  generateStructuredJson,
  type AIProvider,
  type AIProviderErrorCode,
} from "@/lib/ai-provider";
import {
  projectProfileExtractionSchema,
  type ProjectProfileExtraction,
} from "@/lib/project-profile-extraction-schema";

export type ProjectProfileExtractorErrorCode = AIProviderErrorCode;

export type ProjectProfileExtractorDiagnostics = {
  status?: number;
  code?: string;
  type?: string;
  message?: string;
  cause?: string;
  validationIssues?: Array<{
    path: string;
    message: string;
  }>;
};

export type ProjectProfileExtractionResult =
  | {
      ok: true;
      suggestion: ProjectProfileExtraction;
    }
  | {
      ok: false;
      errorCode: ProjectProfileExtractorErrorCode;
      message: string;
      statusCode: number;
      diagnostics?: ProjectProfileExtractorDiagnostics;
    };

const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "shortDescription",
    "sectors",
    "technologies",
    "targetUsers",
    "problemSolved",
    "solution",
    "stage",
    "keywords",
    "preferredFundingTypes",
  ],
  properties: {
    name: { type: "string" },
    shortDescription: { type: "string" },
    sectors: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: { type: "string" },
    },
    technologies: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: { type: "string" },
    },
    targetUsers: { type: "string" },
    problemSolved: { type: "string" },
    solution: { type: "string" },
    stage: {
      type: "string",
      enum: ["idea", "prototype", "pilot", "early_revenue", "scaling"],
    },
    keywords: {
      type: "array",
      minItems: 1,
      maxItems: 16,
      items: { type: "string" },
    },
    preferredFundingTypes: {
      type: "array",
      minItems: 1,
      maxItems: 7,
      items: {
        type: "string",
        enum: [
          "grant",
          "equity",
          "loan",
          "voucher",
          "pilot",
          "accelerator",
          "procurement",
        ],
      },
    },
  },
} as const;

export async function extractProjectProfileFromText(
  idea: string,
): Promise<ProjectProfileExtractionResult> {
  const result = await generateStructuredJson({
    purpose: "project_profile_extraction",
    systemPrompt:
      "You extract structured startup or project profile fields from a user's free-text project idea for an EU funding matching app. Return concise JSON only. Keep the result generic, practical, and faithful to the user's text. Do not claim facts that are not supported by the text; when a detail is missing, infer only a conservative generic label that helps the user edit the profile.",
    userPrompt: JSON.stringify({
      idea,
      instruction:
        "Suggest project profile fields for user review before saving. Choose the closest project stage and suitable preferred funding types from the allowed enum values. Keep arrays short and useful.",
    }),
    schema: extractionJsonSchema,
  });

  if (!result.ok) {
    return buildExtractorFailure(
      result.errorCode,
      result.statusCode,
      result.diagnostics,
    );
  }

  const suggestion = projectProfileExtractionSchema.safeParse(result.data);

  if (!suggestion.success) {
    return buildExtractorFailure(
      getResponseInvalidCode(result.provider),
      502,
      {
        cause: "model_response_schema_validation_failed",
        validationIssues: suggestion.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    );
  }

  return {
    ok: true,
    suggestion: suggestion.data,
  };
}

export function getProjectProfileExtractorSafeMessage(
  errorCode: ProjectProfileExtractorErrorCode,
) {
  if (
    errorCode === "missing_gemini_key" ||
    errorCode === "missing_openai_key"
  ) {
    return "AI suggestions are not configured yet.";
  }

  if (errorCode === "gemini_quota_or_rate_limit") {
    return "AI suggestions are temporarily unavailable due to Gemini API quota or rate limits.";
  }

  if (errorCode === "openai_quota_or_rate_limit") {
    return "AI suggestions are temporarily unavailable due to OpenAI API quota or rate limits.";
  }

  if (errorCode === "gemini_invalid_key") {
    return "AI suggestions are unavailable because the Gemini API key is invalid.";
  }

  if (errorCode === "openai_invalid_key") {
    return "AI suggestions are unavailable because the OpenAI API key is invalid.";
  }

  if (
    errorCode === "gemini_response_invalid" ||
    errorCode === "openai_response_invalid"
  ) {
    return "AI suggestions returned an unexpected format. Please try again.";
  }

  return "AI suggestions are unavailable right now. Your draft is safe; continue manually or try again later.";
}

function buildExtractorFailure(
  errorCode: ProjectProfileExtractorErrorCode,
  statusCode: number,
  diagnostics?: ProjectProfileExtractorDiagnostics,
): ProjectProfileExtractionResult {
  return {
    ok: false,
    errorCode,
    message: getProjectProfileExtractorSafeMessage(errorCode),
    statusCode,
    diagnostics,
  };
}

function getResponseInvalidCode(
  provider: AIProvider,
): ProjectProfileExtractorErrorCode {
  return provider === "gemini"
    ? "gemini_response_invalid"
    : "openai_response_invalid";
}
