import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(nextPath = "/projects") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

export function sanitizeNextPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return "/projects";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/projects";
  }

  return value;
}
