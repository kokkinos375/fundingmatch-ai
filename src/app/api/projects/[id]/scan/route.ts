import { NextResponse } from "next/server";
import { fundingMatchAgent } from "@/lib/funding-match-agent";
import { searchEnabledFundingSources } from "@/lib/funding-sources";
import { isLegacyPrivateDemoProjectId } from "@/lib/public-demo";
import { getStorage } from "@/lib/storage";

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

  const project = await getStorage().getProject(id);

  if (!project) {
    return NextResponse.json(
      { error: `Project profile "${id}" was not found.` },
      { status: 404 },
    );
  }

  const calls = await searchEnabledFundingSources(project);
  const result = await fundingMatchAgent(project, calls);

  return NextResponse.json(result);
}
