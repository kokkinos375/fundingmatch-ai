import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  extractProjectProfileFromText,
  type ProjectProfileExtractionResult,
} from "@/lib/project-profile-extractor";

export const dynamic = "force-dynamic";

const extractRequestSchema = z.object({
  idea: z.string().trim().min(10).max(6000),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Log in to use AI project suggestions." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const input = extractRequestSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json(
      {
        error:
          "Paste at least a short project idea before requesting AI suggestions.",
      },
      { status: 400 },
    );
  }

  const result = await extractProjectProfileFromText(input.data.idea);

  if (!result.ok) {
    logExtractorFailure(result);

    return NextResponse.json(
      {
        error: result.message,
        errorCode: result.errorCode,
      },
      { status: result.statusCode },
    );
  }

  return NextResponse.json({
    suggestion: result.suggestion,
  });
}

function logExtractorFailure(
  result: Extract<ProjectProfileExtractionResult, { ok: false }>,
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const labels = {
    missing_openai_key: "missing OPENAI_API_KEY",
    openai_quota_or_rate_limit: "OpenAI quota or rate-limit failure",
    openai_invalid_key: "invalid OpenAI API key",
    openai_response_invalid: "malformed model response",
    unknown_error: "unexpected extractor error",
  } satisfies Record<
    Extract<ProjectProfileExtractionResult, { ok: false }>["errorCode"],
    string
  >;

  console.warn(`[project-profile-extractor] ${labels[result.errorCode]}`, {
    errorCode: result.errorCode,
    diagnostics: result.diagnostics,
  });
}
