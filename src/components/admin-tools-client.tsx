"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ToolResult = {
  title: string;
  body: unknown;
};

const defaultImportJson = `{
  "projects": [],
  "manualFundingCalls": []
}`;

export function AdminToolsClient() {
  const router = useRouter();
  const [result, setResult] = useState<ToolResult | null>(null);
  const [importJson, setImportJson] = useState(defaultImportJson);
  const [isBusy, setIsBusy] = useState(false);

  async function runSeed() {
    setIsBusy(true);

    try {
      const response = await fetch("/api/dev/seed", {
        method: "POST",
        cache: "no-store",
      });
      const body = await response.json();
      setResult({ title: `Seed result (${response.status})`, body });
      router.refresh();
    } catch (error) {
      setResult({
        title: "Seed failed",
        body: error instanceof Error ? error.message : "Seed request failed.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function runVerificationCleanup() {
    const confirmed = window.confirm(
      "Remove only records whose ids start with supabase-verification-project or verify-supabase?",
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await fetch("/api/dev/cleanup-verification-records", {
        method: "POST",
        cache: "no-store",
      });
      const body = await response.json();
      setResult({
        title: `Verification cleanup result (${response.status})`,
        body,
      });
      router.refresh();
    } catch (error) {
      setResult({
        title: "Verification cleanup failed",
        body:
          error instanceof Error
            ? error.message
            : "Verification cleanup request failed.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function runImport() {
    setIsBusy(true);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: importJson,
      });
      const body = await response.json();
      setResult({ title: `Import result (${response.status})`, body });
      router.refresh();
    } catch (error) {
      setResult({
        title: "Import failed",
        body:
          error instanceof Error ? error.message : "Import request failed.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <a
            href="/api/diagnostics/storage/health"
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Health check
          </a>
          <button
            type="button"
            onClick={runSeed}
            disabled={isBusy}
            className="primary-action inline-flex justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Seed example project
          </button>
          <a
            href="/api/export"
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export data
          </a>
          <button
            type="button"
            onClick={runImport}
            disabled={isBusy || importJson.trim().length === 0}
            className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={runVerificationCleanup}
            disabled={isBusy}
            className="inline-flex justify-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Clean test records
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Import JSON</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Paste an export payload with <code>projects</code> and{" "}
          <code>manualFundingCalls</code>.
        </p>
        <textarea
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
          rows={10}
          className="mt-4 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </section>

      {result ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            {result.title}
          </h2>
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-50">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
