import { NextResponse } from "next/server";
import { importManualFundingCallsFromJson } from "@/lib/storage/manual-import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.json !== "string") {
    return NextResponse.json(
      {
        totalSubmitted: 0,
        importedCount: 0,
        validationErrors: [
          {
            index: null,
            messages: ["Request body must include a string field named json."],
          },
        ],
      },
      { status: 400 },
    );
  }

  const result = await importManualFundingCallsFromJson(body.json);
  const hasImportedCalls = result.importedCount > 0;
  const status = hasImportedCalls || result.validationErrors.length === 0 ? 200 : 400;

  return NextResponse.json(result, { status });
}
