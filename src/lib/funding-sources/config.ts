export function isMockSourceEnabled() {
  return parseBooleanFlag(process.env.ENABLE_MOCK_SOURCE, true);
}

export function isManualSourceEnabled() {
  return parseBooleanFlag(process.env.ENABLE_MANUAL_SOURCE, true);
}

export function isEUPortalSourceEnabled() {
  return parseBooleanFlag(process.env.ENABLE_EU_PORTAL_SOURCE, false);
}

export function isEUPortalIntegrationVerified() {
  return false;
}

export function getEUPortalApiBaseUrl() {
  return process.env.EU_PORTAL_API_BASE_URL?.trim() || null;
}

export function getEUPortalApiTimeoutMs() {
  const rawValue = process.env.EU_PORTAL_API_TIMEOUT_MS;
  const parsedValue = rawValue ? Number(rawValue) : 10_000;

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 10_000;
}

export function hasRequiredEUPortalConfiguration() {
  return Boolean(getEUPortalApiBaseUrl());
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
