import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fundingMatchAgent } from "@/lib/funding-match-agent";
import { searchEnabledFundingSources } from "@/lib/funding-sources";
import {
  getPublicDemoProjectId,
  getPublicDemoProjectProfile,
  isLegacyPrivateDemoProjectId,
} from "@/lib/public-demo";
import { getStorageForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

type ScanRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ScanRouteContext) {
  return handleScan(context);
}

export async function POST(_request: Request, context: ScanRouteContext) {
  return handleScan(context);
}

async function handleScan({ params }: ScanRouteContext) {
  const { id } = await params;

  if (isLegacyPrivateDemoProjectId(id)) {
    return NextResponse.json(
      { error: `Project profile "${id}" was not found.` },
      { status: 404 },
    );
  }

  const user = await getCurrentUser();
  const storage = getStorageForUser(user?.id ?? null);
  const project =
    (await storage.getProject(id)) ??
    (id === getPublicDemoProjectId() ? getPublicDemoProjectProfile() : null);

  if (!project) {
    return NextResponse.json(
      { error: `Project profile "${id}" was not found.` },
      { status: 404 },
    );
  }

  const calls = await searchEnabledFundingSources(project, { storage });
  const result = await fundingMatchAgent(project, calls);

  return NextResponse.json(result);
}
