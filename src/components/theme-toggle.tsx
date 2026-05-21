"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const nextTheme =
    theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const label =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      aria-label={`Theme: ${label}. Switch theme mode.`}
      title={`Theme: ${label}`}
      suppressHydrationWarning
    >
      {resolvedTheme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
