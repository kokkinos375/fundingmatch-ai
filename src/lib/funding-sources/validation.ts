import { fundingCallSchema, type FundingCall } from "@/lib/schemas";

export function validateMappedFundingCalls(
  candidates: unknown[],
): FundingCall[] {
  const calls: FundingCall[] = [];

  for (const candidate of candidates) {
    const result = fundingCallSchema.safeParse(candidate);

    if (result.success) {
      calls.push(result.data);
    }
  }

  return calls;
}
