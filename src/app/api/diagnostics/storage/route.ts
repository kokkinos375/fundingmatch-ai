import { NextResponse } from "next/server";
import { getStorageDiagnostics } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics = await getStorageDiagnostics();

  return NextResponse.json({
    ...diagnostics,
    openAI: {
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    },
  });
}
