import "server-only";

import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import {
  projectProfileExtractionSchema,
  type ProjectProfileExtraction,
} from "@/lib/project-profile-extraction-schema";

export type ProjectProfileExtractionResult =
  | {
      ok: true;
      suggestion: ProjectProfileExtraction;
    }
  | {
      ok: false;
      reason: "missing_api_key" | "openai_error";
      message: string;
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
    return {
      ok: false,
      reason: "missing_api_key",
      message:
        "AI suggestions are unavailable right now. You can continue manually.",
    };
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

    const parsed = JSON.parse(response.output_text);

    return {
      ok: true,
      suggestion: projectProfileExtractionSchema.parse(parsed),
    };
  } catch (error) {
    const summary = summarizeOpenAIError(error);
    console.error("OpenAI project profile extraction failed", summary);

    return {
      ok: false,
      reason: "openai_error",
      message:
        "AI suggestions are unavailable right now. Your draft is safe; continue manually or try again later.",
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
