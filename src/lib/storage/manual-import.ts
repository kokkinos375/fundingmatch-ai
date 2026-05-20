import { z } from "zod";
import { getStorage } from "@/lib/storage";
import type { AppStorage } from "@/lib/storage/types";
import { fundingCallInputSchema } from "@/lib/storage/types";

export type ManualFundingCallImportValidationError = {
  index: number | null;
  id?: string;
  title?: string;
  messages: string[];
};

export type ManualFundingCallImportResult = {
  totalSubmitted: number;
  importedCount: number;
  validationErrors: ManualFundingCallImportValidationError[];
};

export async function importManualFundingCallsFromJson(
  jsonText: string,
  storage: AppStorage = getStorage(),
): Promise<ManualFundingCallImportResult> {
  const parsedJson = parseManualFundingCallsJson(jsonText);

  if (!parsedJson.success) {
    return {
      totalSubmitted: 0,
      importedCount: 0,
      validationErrors: [
        {
          index: null,
          messages: [parsedJson.message],
        },
      ],
    };
  }

  const validationErrors: ManualFundingCallImportValidationError[] = [];
  let importedCount = 0;

  for (const [index, item] of parsedJson.items.entries()) {
    const input = fundingCallInputSchema.safeParse(item);

    if (!input.success) {
      validationErrors.push(buildValidationError(index, item, input.error));
      continue;
    }

    try {
      await storage.createManualFundingCall(input.data);
      importedCount += 1;
    } catch (error) {
      validationErrors.push({
        index,
        id: isRecord(item) ? getOptionalString(item.id) : undefined,
        title: isRecord(item) ? getOptionalString(item.title) : undefined,
        messages: [
          error instanceof Error
            ? error.message
            : "The funding call could not be imported.",
        ],
      });
    }
  }

  return {
    totalSubmitted: parsedJson.items.length,
    importedCount,
    validationErrors,
  };
}

function parseManualFundingCallsJson(jsonText: string):
  | { success: true; items: unknown[] }
  | { success: false; message: string } {
  try {
    const parsed = JSON.parse(jsonText) as unknown;

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        message: "Import payload must be a JSON array of funding call objects.",
      };
    }

    return { success: true, items: parsed };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `JSON could not be parsed: ${error.message}`
          : "JSON could not be parsed.",
    };
  }
}

function buildValidationError(
  index: number,
  candidate: unknown,
  error: z.ZodError,
): ManualFundingCallImportValidationError {
  return {
    index,
    id: isRecord(candidate) ? getOptionalString(candidate.id) : undefined,
    title: isRecord(candidate) ? getOptionalString(candidate.title) : undefined,
    messages: error.issues.map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "record";

      return `${field}: ${issue.message}`;
    }),
  };
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
