import type { FundingSource } from "@/lib/funding-sources/types";
import { getStorage } from "@/lib/storage";
import type { AppStorage } from "@/lib/storage/types";
import { MANUAL_FUNDING_SOURCE_NAME } from "@/lib/storage/types";

export class ManualFundingSource implements FundingSource {
  name = MANUAL_FUNDING_SOURCE_NAME;
  type = "manual" as const;

  constructor(private readonly storage: AppStorage = getStorage()) {}

  async searchCalls() {
    return this.storage.listManualFundingCalls();
  }
}
