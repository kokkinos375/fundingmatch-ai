import { NextResponse } from "next/server";
import { seedExampleProject } from "@/lib/storage/portable-data";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "Development seed tools are disabled in production.",
      },
      { status: 403 },
    );
  }

  const result = await seedExampleProject();

  return NextResponse.json(result);
}

export async function GET() {
  return POST();
}
