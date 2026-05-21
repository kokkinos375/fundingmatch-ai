import type { FundingCall } from "@/lib/schemas";

type FundingCallLinkInput = Pick<
  FundingCall,
  "url" | "sourceUrl" | "sourceType"
>;

export type FundingCallLinkQuality =
  | "official"
  | "source"
  | "demo"
  | "missing";

export type FundingCallLinkInfo = {
  href: string | null;
  buttonLabel: "View official call" | "View official source" | null;
  fallbackLabel: "Demo call — no official link" | "Missing official link" | null;
  quality: FundingCallLinkQuality;
  statusLabel:
    | "Official link available"
    | "Source link available"
    | "Demo call"
    | "Missing official link";
  shouldWarnBeforeApplying: boolean;
};

export function getFundingCallLinkInfo(
  call: FundingCallLinkInput,
): FundingCallLinkInfo {
  if (call.sourceType === "mock") {
    return {
      href: null,
      buttonLabel: null,
      fallbackLabel: "Demo call — no official link",
      quality: "demo",
      statusLabel: "Demo call",
      shouldWarnBeforeApplying: false,
    };
  }

  const officialUrl = getValidWebUrl(call.url);

  if (officialUrl) {
    return {
      href: officialUrl,
      buttonLabel: "View official call",
      fallbackLabel: null,
      quality: "official",
      statusLabel: "Official link available",
      shouldWarnBeforeApplying: false,
    };
  }

  const sourceUrl = getValidWebUrl(call.sourceUrl);

  if (sourceUrl) {
    return {
      href: sourceUrl,
      buttonLabel: "View official source",
      fallbackLabel: null,
      quality: "source",
      statusLabel: "Source link available",
      shouldWarnBeforeApplying: true,
    };
  }

  return {
    href: null,
    buttonLabel: null,
    fallbackLabel: "Missing official link",
    quality: "missing",
    statusLabel: "Missing official link",
    shouldWarnBeforeApplying: true,
  };
}

export function getOfficialCallUrl(
  call: Pick<FundingCall, "url" | "sourceUrl" | "sourceType">,
) {
  return getFundingCallLinkInfo(call).href;
}

function getValidWebUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
