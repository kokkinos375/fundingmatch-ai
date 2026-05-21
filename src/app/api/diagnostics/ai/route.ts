import { NextResponse } from "next/server";
import { getAIDiagnostics } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics = getAIDiagnostics();

  return NextResponse.json({
    ...diagnostics,
    projectProfileExtractor: {
      routeConfigured: true,
    },
  });
}
