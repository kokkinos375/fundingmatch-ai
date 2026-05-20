import { NextResponse } from "next/server";
import { getFundingSourceDiagnostics } from "@/lib/funding-sources";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics = await getFundingSourceDiagnostics();

  return NextResponse.json({
    ...diagnostics,
    openAI: {
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    },
  });
}
