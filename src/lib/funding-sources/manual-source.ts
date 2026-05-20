import type { FundingSource } from "@/lib/funding-sources/types";
import { getStorage } from "@/lib/storage";
import { MANUAL_FUNDING_SOURCE_NAME } from "@/lib/storage/types";

export class ManualFundingSource implements FundingSource {
  name = MANUAL_FUNDING_SOURCE_NAME;
  type = "manual" as const;

  async searchCalls() {
    return getStorage().listManualFundingCalls();
  }
}
