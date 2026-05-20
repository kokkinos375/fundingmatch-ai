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

export function getSupabasePublicUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    null
  );
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
}

export function hasSupabaseAnonKey() {
  return Boolean(getSupabaseAnonKey());
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
