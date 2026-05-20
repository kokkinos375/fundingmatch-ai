import {
  getEUPortalApiBaseUrl,
  getEUPortalApiTimeoutMs,
} from "@/lib/funding-sources/config";
import type { FundingSource } from "@/lib/funding-sources/types";
import type { FundingCall } from "@/lib/schemas";

export class EUFundingPortalSource implements FundingSource {
  name = "EU Funding & Tenders Portal";
  type = "eu_portal" as const;

  async searchCalls(): Promise<FundingCall[]> {
    const configuredBaseUrl = getEUPortalApiBaseUrl();
    const timeoutMs = getEUPortalApiTimeoutMs();

    void configuredBaseUrl;
    void timeoutMs;

    // TODO: Enable this source only after verifying official European
    // Commission / EU Funding & Tenders Portal API documentation for:
    // - the stable public endpoint URL,
    // - authentication requirements, if any,
    // - request parameters for opportunity search,
    // - response fields for title, programme, topic id, status, deadline,
    //   budget, URL, description, and eligibility.
    //
    // Current official pages verified during implementation describe the
    // Funding & Tenders Portal as the Commission-managed single entry point,
    // but did not verify a stable public API contract. This source therefore
    // returns no calls and deliberately avoids scraping or inventing data.
    return [];
  }
}
