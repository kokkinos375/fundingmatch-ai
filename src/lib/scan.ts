import { fundingMatchAgent } from "@/lib/funding-match-agent";
import { mockFundingCalls } from "@/lib/mock-data";
import type {
  FundingCall,
  FundingScanResult,
  ProjectProfile,
} from "@/lib/schemas";

export async function runFundingScan(
  project: ProjectProfile,
  calls: FundingCall[] = mockFundingCalls,
): Promise<FundingScanResult> {
  return fundingMatchAgent(project, calls);
}
