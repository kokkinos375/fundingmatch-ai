import { NextResponse } from "next/server";
import { importPortableAppData } from "@/lib/storage/portable-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch((error: unknown) => {
    return {
      __parseError:
        error instanceof Error ? error.message : "JSON body could not be parsed.",
    };
  });

  if (
    typeof payload === "object" &&
    payload !== null &&
    "__parseError" in payload
  ) {
    return NextResponse.json(
      {
        counts: {
          projects: {
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 1,
          },
          manualFundingCalls: {
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 1,
          },
        },
        validationErrors: [
          {
            collection: "payload",
            index: null,
            messages: [`Invalid JSON: ${String(payload.__parseError)}`],
          },
        ],
      },
      { status: 400 },
    );
  }

  const result = await importPortableAppData(payload);
  const status =
    result.validationErrors.length > 0 &&
    result.counts.projects.created +
      result.counts.projects.updated +
      result.counts.manualFundingCalls.created +
      result.counts.manualFundingCalls.updated ===
      0
      ? 400
      : 200;

  return NextResponse.json(result, { status });
}
