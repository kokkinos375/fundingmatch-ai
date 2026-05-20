import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { importManualFundingCallsFromJson } from "@/lib/storage/manual-import";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Log in to import manual funding calls." },
      { status: 401 },
    );
  }

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

  const result = await importManualFundingCallsFromJson(
    body.json,
    getStorageForUser(user.id),
  );
  const hasImportedCalls = result.importedCount > 0;
  const status = hasImportedCalls || result.validationErrors.length === 0 ? 200 : 400;

  return NextResponse.json(result, { status });
}
