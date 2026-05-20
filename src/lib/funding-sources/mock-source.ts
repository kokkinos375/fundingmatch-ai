import { mockFundingCalls } from "@/lib/mock-data";
import type { FundingSource } from "@/lib/funding-sources/types";
import type { FundingCall } from "@/lib/schemas";

export class MockFundingSource implements FundingSource {
  name = "Demo EU funding dataset";
  type = "mock" as const;

  async searchCalls(): Promise<FundingCall[]> {
    const retrievedAt = new Date().toISOString();

    return mockFundingCalls.map((call) => {
      return {
        ...call,
        sourceName: this.name,
        sourceType: this.type,
        sourceUrl:
          "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
        retrievedAt,
      };
    });
  }
}
