import "server-only";

import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import {
  projectProfileExtractionSchema,
  type ProjectProfileExtraction,
} from "@/lib/project-profile-extraction-schema";

export type ProjectProfileExtractorErrorCode =
  | "missing_openai_key"
  | "openai_quota_or_rate_limit"
  | "openai_invalid_key"
  | "openai_response_invalid"
  | "unknown_error";

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
  const client = getOpenAIClient();

  if (!client) {
    return buildExtractorFailure("missing_openai_key", 503, {
      cause: "OPENAI_API_KEY is not configured",
    });
  }

  try {
    const response = await client.responses.create({
      model: getOpenAIModel(),
      input: [
        {
          role: "system",
          content:
            "You extract structured startup or project profile fields from a user's free-text project idea for an EU funding matching app. Return concise JSON only. Keep the result generic, practical, and faithful to the user's text. Do not claim facts that are not supported by the text; when a detail is missing, infer only a conservative generic label that helps the user edit the profile.",
        },
        {
          role: "user",
          content: JSON.stringify({
            idea,
            instruction:
              "Suggest project profile fields for user review before saving. Choose the closest project stage and suitable preferred funding types from the allowed enum values. Keep arrays short and useful.",
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "project_profile_extraction",
          strict: true,
          schema: extractionJsonSchema,
        },
      },
    });

    let parsed: unknown;

    try {
      parsed = JSON.parse(response.output_text);
    } catch {
      return buildExtractorFailure("openai_response_invalid", 502, {
        cause: "model_response_json_parse_failed",
      });
    }

    const suggestion = projectProfileExtractionSchema.safeParse(parsed);

    if (!suggestion.success) {
      return buildExtractorFailure("openai_response_invalid", 502, {
        cause: "model_response_schema_validation_failed",
        validationIssues: suggestion.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    return {
      ok: true,
      suggestion: suggestion.data,
    };
  } catch (error) {
    return classifyOpenAIError(error);
  }
}

export function getProjectProfileExtractorSafeMessage(
  errorCode: ProjectProfileExtractorErrorCode,
) {
  if (errorCode === "missing_openai_key") {
    return "AI suggestions are not configured yet.";
  }

  if (errorCode === "openai_quota_or_rate_limit") {
    return "AI suggestions are temporarily unavailable due to API quota or rate limits.";
  }

  return "AI suggestions are unavailable right now. Your draft is safe; continue manually or try again later.";
}

function classifyOpenAIError(error: unknown): ProjectProfileExtractionResult {
  const summary = summarizeOpenAIError(error);
  const searchableMessage = [
    summary.code,
    summary.type,
    summary.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    summary.status === 429 ||
    searchableMessage.includes("rate_limit") ||
    searchableMessage.includes("rate limit") ||
    searchableMessage.includes("quota") ||
    searchableMessage.includes("insufficient_quota")
  ) {
    return buildExtractorFailure("openai_quota_or_rate_limit", 503, summary);
  }

  if (
    summary.status === 401 ||
    summary.status === 403 ||
    searchableMessage.includes("invalid_api_key") ||
    searchableMessage.includes("incorrect api key") ||
    searchableMessage.includes("authentication")
  ) {
    return buildExtractorFailure("openai_invalid_key", 503, summary);
  }

  return buildExtractorFailure("unknown_error", 503, summary);
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

function summarizeOpenAIError(
  error: unknown,
): ProjectProfileExtractorDiagnostics {
  if (error && typeof error === "object") {
    const maybeError = error as {
      status?: number;
      code?: string;
      type?: string;
      message?: string;
    };

    return {
      status: maybeError.status,
      code: sanitizeDiagnosticValue(maybeError.code),
      type: sanitizeDiagnosticValue(maybeError.type),
      message: sanitizeDiagnosticValue(maybeError.message),
    };
  }

  return { message: "Unknown OpenAI error" };
}

function sanitizeDiagnosticValue(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/supabase_[A-Za-z0-9_-]+/gi, "supabase_***")
    .slice(0, 300);
}
