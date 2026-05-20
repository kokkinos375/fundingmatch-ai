import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getPublicDemoProjectId,
  getPublicDemoProjectProfile,
} from "@/lib/public-demo";
import { fundingScanResultSchema } from "@/lib/schemas";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

type SavedScanRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: SavedScanRouteContext) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Log in to save this scan." },
      { status: 401 },
    );
  }

  const storage = getStorageForUser(user.id);
  const project =
    (await storage.getProject(id)) ??
    (id === getPublicDemoProjectId() ? getPublicDemoProjectProfile() : null);

  if (!project) {
    return NextResponse.json(
      { error: `Project profile "${id}" was not found.` },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  const result = fundingScanResultSchema.safeParse(body?.result);

  if (!result.success || result.data.projectId !== id) {
    return NextResponse.json(
      { error: "Request body must include a valid scan result for this project." },
      { status: 400 },
    );
  }

  const savedScan = await storage.createSavedScan({
    projectId: id,
    projectName: project.name,
    result: result.data,
  });

  return NextResponse.json({
    savedScan: {
      id: savedScan.id,
      projectId: savedScan.projectId,
      createdAt: savedScan.createdAt,
    },
  });
}
