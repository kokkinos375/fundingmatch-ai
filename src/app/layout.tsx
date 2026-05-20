import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FundingMatch AI",
  description: "Create project profiles and scan EU funding opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200/80 bg-white/86 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-3 font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
                FM
              </span>
              <span>FundingMatch AI</span>
            </Link>
            <nav className="grid w-full grid-cols-3 gap-2 text-sm text-slate-600 sm:flex sm:w-auto sm:items-center sm:justify-end">
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
                href="/projects/new"
                className="primary-action rounded-md bg-slate-950 px-3 py-2 text-center font-medium text-white hover:bg-slate-800"
              >
                Create project
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
