"use server";

import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = getText(formData, "email");
  const password = getText(formData, "password");
  const nextPath = sanitizeNextPath(formData.get("next"));

  if (!email || !password) {
    redirect(
      `/auth/login?message=${encodeURIComponent("Email and password are required.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      `/auth/login?message=${encodeURIComponent("Supabase Auth is not configured for this deployment.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/auth/login?message=${encodeURIComponent(error.message)}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  redirect(nextPath);
}

export async function signupAction(formData: FormData) {
  const email = getText(formData, "email");
  const password = getText(formData, "password");

  if (!email || !password) {
    redirect(
      `/auth/signup?message=${encodeURIComponent("Email and password are required.")}`,
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      `/auth/signup?message=${encodeURIComponent("Supabase Auth is not configured for this deployment.")}`,
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/signup?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
