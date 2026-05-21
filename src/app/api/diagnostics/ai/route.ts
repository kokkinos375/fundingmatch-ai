import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openAI: {
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    },
    projectProfileExtractor: {
      routeConfigured: true,
    },
  });
}
