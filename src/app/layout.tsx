import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "FundingMatch AI",
  description: "Create project profiles and scan EU funding opportunities.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200/80 bg-white/86 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-3 font-semibold">
              <Image
                src="/brand/fundingmatch-ai-logo.png"
                alt="FundingMatch AI logo"
                width={1689}
                height={931}
                priority
                className="h-auto w-32 sm:w-40"
              />
            </Link>
            <nav className="grid w-full grid-cols-2 gap-2 text-sm text-slate-600 sm:flex sm:w-auto sm:items-center sm:justify-end">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                  >
                    Projects
                  </Link>
                  <Link
                    href="/funding-calls"
                    className="rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                  >
                    Funding calls
                  </Link>
                  <Link
                    href="/saved-scans"
                    className="rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                  >
                    Saved scans
                  </Link>
                  <Link
                    href="/account"
                    className="rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                  >
                    Account
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                    >
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/projects"
                    className="rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                  >
                    Projects
                  </Link>
                  <Link
                    href="/auth/login"
                    className="rounded-md px-3 py-2 text-center font-medium hover:bg-slate-100 hover:text-slate-950"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="primary-action rounded-md bg-slate-950 px-3 py-2 text-center font-medium text-white hover:bg-slate-800"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
