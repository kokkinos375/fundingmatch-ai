import type { FundingCall } from "@/lib/schemas";

export function getOfficialCallUrl(
  call: Pick<FundingCall, "url" | "sourceUrl" | "sourceType">,
) {
  if (call.sourceType === "mock") {
    return null;
  }

  return getValidWebUrl(call.url) ?? getValidWebUrl(call.sourceUrl);
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
