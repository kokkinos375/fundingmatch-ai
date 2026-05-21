import { EUFundingPortalSource } from "@/lib/funding-sources/eu-funding-portal-source";
import {
  getEUPortalApiBaseUrl,
  getEUPortalApiTimeoutMs,
  hasRequiredEUPortalConfiguration,
  isEUPortalIntegrationVerified,
  isEUPortalSourceEnabled,
  isManualSourceEnabled,
  isMockSourceEnabled,
} from "@/lib/funding-sources/config";
import { ManualFundingSource } from "@/lib/funding-sources/manual-source";
import { MockFundingSource } from "@/lib/funding-sources/mock-source";
import type {
  FundingSource,
  FundingSourceDiagnostics,
} from "@/lib/funding-sources/types";
import type { FundingCall, ProjectProfile } from "@/lib/schemas";
import { getStorageDiagnostics } from "@/lib/storage";
import {
  MANUAL_FUNDING_SOURCE_NAME,
  type AppStorage,
} from "@/lib/storage/types";

export async function getFundingSourceDiagnostics() {
  const storageDiagnostics = await getStorageDiagnostics();
  const euPortalEffectivelyEnabled =
    isEUPortalSourceEnabled() && isEUPortalIntegrationVerified();
  const allSources: FundingSourceDiagnostics[] = [
    {
      name: "Demo EU funding dataset",
      type: "mock",
      enabled: isMockSourceEnabled(),
    },
    {
      name: MANUAL_FUNDING_SOURCE_NAME,
      type: "manual",
      enabled: isManualSourceEnabled(),
    },
    {
      name: "EU Funding & Tenders Portal",
      type: "eu_portal",
      enabled: euPortalEffectivelyEnabled,
    },
  ];

  return {
    enabledSources: allSources.filter((source) => source.enabled),
    disabledSources: allSources.filter((source) => !source.enabled),
    flags: {
      enableMockSource: isMockSourceEnabled(),
      enableManualSource: isManualSourceEnabled(),
      enableEUPortalSource: isEUPortalSourceEnabled(),
    },
    manual: {
      enabled: isManualSourceEnabled(),
      callCount: storageDiagnostics.manualFundingCallsLoaded ?? 0,
      validationErrorCount:
        storageDiagnostics.validationErrorCounts.manualFundingCalls ?? 0,
    },
    euPortal: {
      configured: hasRequiredEUPortalConfiguration(),
      verified: isEUPortalIntegrationVerified(),
      requestedEnabled: isEUPortalSourceEnabled(),
      effectivelyEnabled: euPortalEffectivelyEnabled,
      hasBaseUrl: Boolean(getEUPortalApiBaseUrl()),
      timeoutMs: getEUPortalApiTimeoutMs(),
    },
    storage: storageDiagnostics,
  };
}

export function getEnabledFundingSources(storage?: AppStorage): FundingSource[] {
  const sources: FundingSource[] = [];

  if (isMockSourceEnabled()) {
    sources.push(new MockFundingSource());
  }

  if (isManualSourceEnabled()) {
    sources.push(new ManualFundingSource(storage));
  }

  if (isEUPortalSourceEnabled() && isEUPortalIntegrationVerified()) {
    sources.push(new EUFundingPortalSource());
  }

  return sources;
}

export async function searchEnabledFundingSources(
  project: ProjectProfile,
  options: { storage?: AppStorage } = {},
) {
  const sources = getEnabledFundingSources(options.storage);

  logSourceDebug("Selected funding sources", {
    sources: sources.map((source) => ({
      name: source.name,
      type: source.type,
    })),
  });

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const calls = await source.searchCalls(project);

        logSourceDebug("Funding source calls fetched", {
          sourceName: source.name,
          sourceType: source.type,
          callCount: calls.length,
        });

        return calls;
      } catch (error) {
        logSourceDebug("Funding source search failed", {
          sourceName: source.name,
          sourceType: source.type,
          message:
            error instanceof Error ? error.message : "Unknown source error",
        });

        return [];
      }
    }),
  );

  const dedupedCalls = deduplicateFundingCalls(results.flat());

  logSourceDebug("Funding calls after dedupe", {
    callCount: dedupedCalls.length,
  });

  return dedupedCalls;
}

export function deduplicateFundingCalls(calls: FundingCall[]) {
  const seen = new Set<string>();
  const uniqueCalls: FundingCall[] = [];

  for (const call of calls) {
    const key = buildDedupeKey(call);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueCalls.push(call);
  }

  return uniqueCalls;
}

function buildDedupeKey(call: FundingCall) {
  const topicId = normalizeKey(call.topicId);
  const title = normalizeKey(call.title);
  const url = normalizeKey(call.url);

  if (topicId) {
    return `topic:${topicId}`;
  }

  if (url) {
    return `url:${url}`;
  }

  return `title:${title}`;
}

function normalizeKey(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function logSourceDebug(message: string, metadata: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[funding-sources] ${message}`, metadata);
}
