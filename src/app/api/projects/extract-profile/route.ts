import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { extractProjectProfileFromText } from "@/lib/project-profile-extractor";

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
    return NextResponse.json(
      {
        error: result.message,
        reason: result.reason,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    suggestion: result.suggestion,
  });
}
