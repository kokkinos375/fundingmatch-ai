import "server-only";

import { GoogleGenAI } from "@google/genai";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";

export type AIProvider = "gemini" | "openai";

export type AIProviderErrorCode =
  | "missing_gemini_key"
  | "gemini_quota_or_rate_limit"
  | "gemini_invalid_key"
  | "gemini_response_invalid"
  | "missing_openai_key"
  | "openai_quota_or_rate_limit"
  | "openai_invalid_key"
  | "openai_response_invalid"
  | "unknown_error";

export type AIProviderDiagnostics = {
  status?: number;
  code?: string;
  type?: string;
  message?: string;
  cause?: string;
};

export type GenerateStructuredJsonInput = {
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  purpose: string;
};

export type GenerateStructuredJsonResult =
  | {
      ok: true;
      provider: AIProvider;
      data: unknown;
    }
  | {
      ok: false;
      provider: AIProvider;
      errorCode: AIProviderErrorCode;
      statusCode: number;
      diagnostics?: AIProviderDiagnostics;
    };

let geminiClient: GoogleGenAI | null = null;

export function getConfiguredAIProvider(): AIProvider {
  return process.env.AI_PROVIDER?.toLowerCase() === "openai"
    ? "openai"
    : "gemini";
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
}

export function getAIDiagnostics() {
  return {
    aiProvider: getConfiguredAIProvider(),
    gemini: {
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    },
    openAI: {
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    },
  };
}

export async function generateStructuredJson({
  systemPrompt,
  userPrompt,
  schema,
  purpose,
}: GenerateStructuredJsonInput): Promise<GenerateStructuredJsonResult> {
  const provider = getConfiguredAIProvider();
  const input = {
    systemPrompt,
    userPrompt,
    schema,
    purpose,
  };
  const primaryResult = await generateStructuredJsonWithProvider(
    provider,
    input,
  );

  if (primaryResult.ok) {
    return primaryResult;
  }

  if (provider === "gemini" && process.env.OPENAI_API_KEY) {
    const fallbackResult = await generateStructuredJsonWithProvider(
      "openai",
      input,
    );

    if (fallbackResult.ok) {
      return fallbackResult;
    }
  }

  return primaryResult;
}

function generateStructuredJsonWithProvider(
  provider: AIProvider,
  input: GenerateStructuredJsonInput,
) {
  if (provider === "openai") {
    return generateOpenAIStructuredJson(input);
  }

  return generateGeminiStructuredJson(input);
}

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return geminiClient;
}

async function generateGeminiStructuredJson({
  systemPrompt,
  userPrompt,
  schema,
}: Omit<GenerateStructuredJsonInput, "purpose">): Promise<GenerateStructuredJsonResult> {
  const provider = "gemini" satisfies AIProvider;
  const client = getGeminiClient();

  if (!client) {
    return buildProviderFailure(provider, "missing_gemini_key", 503, {
      cause: "GEMINI_API_KEY is not configured",
    });
  }

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    });

    return parseStructuredJson(provider, response.text);
  } catch (error) {
    return classifyProviderError(provider, error);
  }
}

async function generateOpenAIStructuredJson({
  systemPrompt,
  userPrompt,
  schema,
  purpose,
}: GenerateStructuredJsonInput): Promise<GenerateStructuredJsonResult> {
  const provider = "openai" satisfies AIProvider;
  const client = getOpenAIClient();

  if (!client) {
    return buildProviderFailure(provider, "missing_openai_key", 503, {
      cause: "OPENAI_API_KEY is not configured",
    });
  }

  try {
    const response = await client.responses.create({
      model: getOpenAIModel(),
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: normalizeSchemaName(purpose),
          strict: true,
          schema,
        },
      },
    });

    return parseStructuredJson(provider, response.output_text);
  } catch (error) {
    return classifyProviderError(provider, error);
  }
}

function parseStructuredJson(
  provider: AIProvider,
  text: string | undefined,
): GenerateStructuredJsonResult {
  if (!text) {
    return buildProviderFailure(
      provider,
      getResponseInvalidCode(provider),
      502,
      { cause: "model_response_empty" },
    );
  }

  try {
    return {
      ok: true,
      provider,
      data: JSON.parse(text),
    };
  } catch {
    return buildProviderFailure(
      provider,
      getResponseInvalidCode(provider),
      502,
      { cause: "model_response_json_parse_failed" },
    );
  }
}

function classifyProviderError(
  provider: AIProvider,
  error: unknown,
): GenerateStructuredJsonResult {
  const summary = summarizeProviderError(error);
  const searchableMessage = [summary.code, summary.type, summary.message]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    summary.status === 429 ||
    searchableMessage.includes("rate_limit") ||
    searchableMessage.includes("rate limit") ||
    searchableMessage.includes("quota") ||
    searchableMessage.includes("insufficient_quota") ||
    searchableMessage.includes("resource_exhausted") ||
    searchableMessage.includes("too many requests")
  ) {
    return buildProviderFailure(
      provider,
      provider === "gemini"
        ? "gemini_quota_or_rate_limit"
        : "openai_quota_or_rate_limit",
      503,
      summary,
    );
  }

  if (
    summary.status === 401 ||
    summary.status === 403 ||
    searchableMessage.includes("invalid_api_key") ||
    searchableMessage.includes("api key not valid") ||
    searchableMessage.includes("incorrect api key") ||
    searchableMessage.includes("authentication") ||
    searchableMessage.includes("unauthenticated")
  ) {
    return buildProviderFailure(
      provider,
      provider === "gemini" ? "gemini_invalid_key" : "openai_invalid_key",
      503,
      summary,
    );
  }

  return buildProviderFailure(provider, "unknown_error", 503, summary);
}

function buildProviderFailure(
  provider: AIProvider,
  errorCode: AIProviderErrorCode,
  statusCode: number,
  diagnostics?: AIProviderDiagnostics,
): GenerateStructuredJsonResult {
  return {
    ok: false,
    provider,
    errorCode,
    statusCode,
    diagnostics,
  };
}

function getResponseInvalidCode(provider: AIProvider): AIProviderErrorCode {
  return provider === "gemini"
    ? "gemini_response_invalid"
    : "openai_response_invalid";
}

function summarizeProviderError(error: unknown): AIProviderDiagnostics {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const nestedError =
      typeof record.error === "object" && record.error !== null
        ? (record.error as Record<string, unknown>)
        : null;

    return {
      status:
        getNumber(record.status) ??
        getNumber(record.statusCode) ??
        getNumber(nestedError?.code),
      code:
        getString(record.code) ??
        getString(record.statusText) ??
        getString(nestedError?.status),
      type: getString(record.type) ?? getString(nestedError?.type),
      message: sanitizeDiagnosticValue(
        getString(record.message) ?? getString(nestedError?.message),
      ),
    };
  }

  return { message: "Unknown AI provider error" };
}

function getString(value: unknown) {
  return typeof value === "string" ? sanitizeDiagnosticValue(value) : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function normalizeSchemaName(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  return normalized || "structured_response";
}

function sanitizeDiagnosticValue(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "AIza***")
    .replace(/supabase_[A-Za-z0-9_-]+/gi, "supabase_***")
    .slice(0, 300);
}
