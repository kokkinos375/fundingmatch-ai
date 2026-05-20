"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportValidationError = {
  index: number | null;
  id?: string;
  title?: string;
  messages: string[];
};

type ImportResult = {
  totalSubmitted: number;
  importedCount: number;
  validationErrors: ImportValidationError[];
};

const samplePlaceholder = `[
  {
    "title": "",
    "programme": "",
    "topicId": "",
    "status": "Open",
    "deadline": "",
    "budget": "",
    "url": "https://example.com/official-call-page",
    "description": "",
    "eligibility": "",
    "sourceName": "Manual Funding Calls",
    "sourceUrl": "https://example.com/official-call-page"
  }
]`;

export function ManualCallImporter() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleImport() {
    setIsImporting(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/funding-calls/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ json: jsonText }),
      });
      const payload = (await response.json()) as ImportResult;

      setResult(payload);

      if (!response.ok && payload.validationErrors.length === 0) {
        setErrorMessage("Import failed before validation could run.");
      }

      if (payload.importedCount > 0) {
        setJsonText("");
        router.refresh();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The JSON import request could not be completed.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Import JSON
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Paste a JSON array of curated funding calls. Valid rows are added;
            invalid rows are reported and rejected.
          </p>
        </div>
        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting || jsonText.trim().length === 0}
          className="primary-action inline-flex justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isImporting ? "Importing..." : "Import calls"}
        </button>
      </div>

      <textarea
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
        rows={10}
        placeholder={samplePlaceholder}
        className="mt-4 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />

      {errorMessage ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-950">
          {errorMessage}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            Imported {result.importedCount} of {result.totalSubmitted} submitted
            calls.
          </div>

          {result.validationErrors.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              <p className="font-semibold">Validation errors</p>
              <ul className="mt-2 space-y-2">
                {result.validationErrors.map((validationError, index) => {
                  const label =
                    validationError.index === null
                      ? "JSON payload"
                      : `Item ${validationError.index + 1}`;

                  return (
                    <li key={`${label}-${index}`}>
                      <span className="font-medium">{label}</span>
                      {validationError.title ? `, ${validationError.title}` : ""}
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {validationError.messages.map((message) => {
                          return <li key={message}>{message}</li>;
                        })}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
