import { NextResponse } from "next/server";
import {
  adminToolForbiddenResponse,
  isAdminToolRequestAllowed,
} from "@/lib/admin-tools";
import { exportPortableAppData } from "@/lib/storage/portable-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminToolRequestAllowed(request)) {
    return adminToolForbiddenResponse();
  }

  const data = await exportPortableAppData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": "attachment; filename=\"fundingmatch-export.json\"",
    },
  });
}
