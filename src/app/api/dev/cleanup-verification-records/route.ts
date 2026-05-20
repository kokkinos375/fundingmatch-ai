import { NextResponse } from "next/server";
import { cleanupVerificationRecords } from "@/lib/storage/portable-data";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "Development cleanup tools are disabled in production.",
      },
      { status: 403 },
    );
  }

  const result = await cleanupVerificationRecords();

  return NextResponse.json(result);
}
