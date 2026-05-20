import { NextResponse } from "next/server";
import { getStorageHealth } from "@/lib/storage/portable-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getStorageHealth();

  return NextResponse.json(health);
}
