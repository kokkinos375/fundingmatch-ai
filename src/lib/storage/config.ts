import type { StorageDriver } from "@/lib/storage/types";

export function getConfiguredStorageDriver(): StorageDriver {
  const value = process.env.STORAGE_DRIVER?.trim().toLowerCase();

  if (value === "supabase" || value === "supabase_placeholder") {
    return "supabase";
  }

  return "local_json";
}

export function getSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() || null;
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function hasRequiredSupabaseConfiguration() {
  return Boolean(getSupabaseUrl() && hasSupabaseServiceRoleKey());
}
