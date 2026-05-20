import {
  getConfiguredStorageDriver,
  hasRequiredSupabaseConfiguration,
  hasSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/storage/config";
import { LocalJsonStorage } from "@/lib/storage/local-json-storage";
import { SupabaseStorage } from "@/lib/storage/supabase-storage";
import type { AppStorage, StorageDiagnostics } from "@/lib/storage/types";

let localJsonStorage: LocalJsonStorage | null = null;
let supabaseStorage: SupabaseStorage | null = null;

export function getStorage(): AppStorage {
  const configuredDriver = getConfiguredStorageDriver();

  if (configuredDriver === "supabase") {
    const canUseSupabase = hasRequiredSupabaseConfiguration();

    if (canUseSupabase) {
      return getSupabaseStorage();
    }

    logStorageDebug("Supabase storage requested; using local JSON fallback", {
      hasSupabaseConfiguration: canUseSupabase,
    });
  }

  return getLocalJsonStorage();
}

export async function getStorageDiagnostics(): Promise<StorageDiagnostics> {
  const configuredDriver = getConfiguredStorageDriver();
  const activeDriver =
    configuredDriver === "supabase" && hasRequiredSupabaseConfiguration()
      ? "supabase"
      : "local_json";

  if (activeDriver === "supabase") {
    return getSupabaseDiagnostics(configuredDriver, activeDriver);
  }

  return getLocalJsonDiagnostics(configuredDriver, activeDriver);
}

async function getLocalJsonDiagnostics(
  configuredDriver: StorageDiagnostics["configuredDriver"],
  activeDriver: StorageDiagnostics["activeDriver"],
): Promise<StorageDiagnostics> {
  const localDiagnostics = await getLocalJsonStorage().getValidationDiagnostics();
  const projectErrorCount = localDiagnostics.validationErrors.filter(
    (error) => error.collection === "projects",
  ).length;
  const manualCallErrorCount = localDiagnostics.validationErrors.filter(
    (error) => error.collection === "manualFundingCalls",
  ).length;
  const supabaseSelected = configuredDriver === "supabase";
  const supabaseReady = hasRequiredSupabaseConfiguration();

  return {
    configuredDriver,
    activeDriver,
    localJsonActive: activeDriver === "local_json",
    supabase: {
      selected: supabaseSelected,
      hasUrl: Boolean(getSupabaseUrl()),
      hasServiceRoleKey: hasSupabaseServiceRoleKey(),
      ready: supabaseReady,
      accessible: null,
      error:
        supabaseSelected && !supabaseReady
          ? "STORAGE_DRIVER=supabase was requested, but Supabase configuration is incomplete. Falling back to local_json."
          : undefined,
    },
    projectsLoaded: localDiagnostics.projectsLoaded,
    manualFundingCallsLoaded: localDiagnostics.manualFundingCallsLoaded,
    validationErrorCounts: {
      projects: projectErrorCount,
      manualFundingCalls: manualCallErrorCount,
    },
  };
}

async function getSupabaseDiagnostics(
  configuredDriver: StorageDiagnostics["configuredDriver"],
  activeDriver: StorageDiagnostics["activeDriver"],
): Promise<StorageDiagnostics> {
  try {
    const diagnostics = await getSupabaseStorage().getValidationDiagnostics();

    return {
      configuredDriver,
      activeDriver,
      localJsonActive: false,
      supabase: {
        selected: true,
        hasUrl: Boolean(getSupabaseUrl()),
        hasServiceRoleKey: hasSupabaseServiceRoleKey(),
        ready: true,
        accessible: true,
      },
      projectsLoaded: diagnostics.projectsLoaded,
      manualFundingCallsLoaded: diagnostics.manualFundingCallsLoaded,
      validationErrorCounts: {
        projects: diagnostics.validationErrors.filter(
          (error) => error.collection === "projects",
        ).length,
        manualFundingCalls: diagnostics.validationErrors.filter(
          (error) => error.collection === "manualFundingCalls",
        ).length,
      },
    };
  } catch (error) {
    return {
      configuredDriver,
      activeDriver,
      localJsonActive: false,
      supabase: {
        selected: true,
        hasUrl: Boolean(getSupabaseUrl()),
        hasServiceRoleKey: hasSupabaseServiceRoleKey(),
        ready: true,
        accessible: false,
        error: sanitizeStorageError(error),
      },
      projectsLoaded: null,
      manualFundingCallsLoaded: null,
      validationErrorCounts: {
        projects: null,
        manualFundingCalls: null,
      },
    };
  }
}

function getLocalJsonStorage() {
  if (!localJsonStorage) {
    localJsonStorage = new LocalJsonStorage();
  }

  return localJsonStorage;
}

function getSupabaseStorage() {
  if (!supabaseStorage) {
    supabaseStorage = new SupabaseStorage();
  }

  return supabaseStorage;
}

function logStorageDebug(message: string, metadata: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[storage] ${message}`, metadata);
}

function sanitizeStorageError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Supabase storage could not be reached.";
}
