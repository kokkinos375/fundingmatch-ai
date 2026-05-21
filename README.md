# FundingMatch AI

FundingMatch AI is a Next.js + TypeScript MVP for creating generic startup or project profiles and scanning them against source-based funding-call datasets.

The app includes one generic public example profile, EcoSmart Demo, but the schema, form, scoring, and scan flow are generic.

The MVP now includes Supabase Auth. Public visitors can view and scan the generic EcoSmart Demo, while signed-in users get private project profiles, manual funding calls, and saved scan reports.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod validation
- Google Gemini API for project extraction, match explanations, and risk notes
- Optional OpenAI provider support
- Supabase Auth for email/password accounts
- Local JSON storage abstraction for the MVP
- Funding source abstraction for mock/manual/portal sources

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local development, prefer opening the same host that the dev server was
started with, usually [http://localhost:3000](http://localhost:3000). The app
also allows `127.0.0.1` as a development origin in `next.config.ts` to avoid
local cross-origin dev-server warnings.

## AI provider configuration

Gemini is the default AI provider for project-profile extraction and match explanation fields. The scan still works without an AI key by using local fallback explanations.

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Gemini API keys are available through Google AI Studio. The free tier can be useful for MVP testing, but it has rate limits, so the app keeps clean fallback messages when quota or rate limits are reached.

OpenAI remains available as an optional provider. When `AI_PROVIDER=gemini`,
the app will try Gemini first and can fall back to OpenAI only if
`OPENAI_API_KEY` is present. To use OpenAI as the primary provider instead, set:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

Scores are always calculated by local code in `src/lib/scoring.ts`. AI providers are only asked to extract editable project profile suggestions and explain the calculated match, identify risks, list missing information, and recommend a next step.

Never commit `GEMINI_API_KEY`, `OPENAI_API_KEY`, or any other secret. Do not create `NEXT_PUBLIC_GEMINI_API_KEY`; any variable prefixed with `NEXT_PUBLIC_` is exposed to browser code.

## Storage architecture

The app now reads and writes through an `AppStorage` interface in `src/lib/storage`:

```ts
interface AppStorage {
  listProjects(): Promise<ProjectProfile[]>;
  getProject(id: string): Promise<ProjectProfile | null>;
  createProject(input: ProjectProfileInput): Promise<ProjectProfile>;
  updateProject(id: string, input: ProjectProfileInput): Promise<ProjectProfile>;
  deleteProject(id: string): Promise<void>;

  listManualFundingCalls(): Promise<FundingCall[]>;
  getManualFundingCall(id: string): Promise<FundingCall | null>;
  createManualFundingCall(input: FundingCallInput): Promise<FundingCall>;
  updateManualFundingCall(id: string, input: FundingCallInput): Promise<FundingCall>;
  deleteManualFundingCall(id: string): Promise<void>;

  listSavedScans(): Promise<SavedScan[]>;
  getSavedScan(id: string): Promise<SavedScan | null>;
  createSavedScan(input: SavedScanInput): Promise<SavedScan>;
  deleteSavedScan(id: string): Promise<void>;
}
```

Default local mode:

```bash
STORAGE_DRIVER=local_json
```

Local JSON files:

```text
src/data/projects.json
src/data/manual-funding-calls.json
```

`LocalJsonStorage` validates every read with Zod, skips invalid records safely, and logs development-only warnings. The EcoSmart Demo example profile is stored in `src/data/projects.json`; `manual-funding-calls.json` stays empty until calls are added or imported.

Local JSON storage is useful for MVP development, but it is not suitable for production persistence on serverless deployments. Serverless file systems can be read-only, ephemeral, or isolated per instance, so production storage should move to PostgreSQL/Supabase or another durable backend.

Supabase/PostgreSQL mode is available through `SupabaseStorage`:

```bash
STORAGE_DRIVER=supabase
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The app does not require Supabase credentials for local development. If `STORAGE_DRIVER=supabase` is set but either Supabase environment variable is missing, the app falls back to `local_json` and reports the configuration problem in `/api/diagnostics/storage`.

To set up Supabase:

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `docs/supabase-schema.sql`.
4. For an existing database, run `docs/supabase-auth-migration.sql`.
5. Run `docs/supabase-seed-ecosmart-demo.sql` if you want the public EcoSmart Demo project available in Supabase.
6. Add `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `STORAGE_DRIVER=supabase` to your environment.
7. Restart the app.

`SUPABASE_SERVICE_ROLE_KEY` must remain server-only. Do not expose it through `NEXT_PUBLIC_` variables, browser code, README examples, logs, diagnostics, or client components.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by Supabase Auth and are safe browser configuration. The service role key is not safe for the browser and must never use a `NEXT_PUBLIC_` prefix.

The SQL schema enables Row Level Security on `public.projects`,
`public.manual_funding_calls`, and `public.saved_scans`. Authenticated users can
select, insert, update, and delete only rows where `user_id = auth.uid()`. The
generic `ecosmart-demo` project is public read-only demo data. Existing rows
without `user_id` are not publicly readable unless they are the EcoSmart Demo.

For Vercel deployment, add `STORAGE_DRIVER`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as encrypted project environment variables. Use `local_json` only for local MVP work; use Supabase or another durable database for production persistence.

The PostgreSQL table design is in:

```text
docs/supabase-schema.sql
```

The generic public demo seed is in:

```text
docs/supabase-seed-ecosmart-demo.sql
```

## Supabase Auth and private data

Auth pages:

```text
/auth/login
/auth/signup
/auth/callback
/account
```

Supabase email/password authentication is used through `@supabase/ssr`.
In the Supabase Dashboard, open **Authentication -> URL Configuration** and
configure:

```text
Site URL:
https://fundingmatch-ai.vercel.app

Redirect URLs:
https://fundingmatch-ai.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

`NEXT_PUBLIC_SUPABASE_URL` should use the same value as `SUPABASE_URL`.
`NEXT_PUBLIC_SUPABASE_ANON_KEY` must use the Supabase anon/publishable key,
not the service role key. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must
never be imported into client components.

Private routes require a signed-in user:

```text
/projects/new
/projects/[id]/edit
/funding-calls
/funding-calls/new
/saved-scans
/account
```

Public routes stay available:

```text
/
/projects
/projects/ecosmart-demo
/projects/ecosmart-demo/scan
/auth/login
/auth/signup
```

`/projects` shows the public EcoSmart Demo to logged-out users. Signed-in users
see their own private projects plus the public demo. The legacy private demo id
is blocked from public routes and is not seeded.

Saved scans are stored in `public.saved_scans` and are private per user. On a
scan page, signed-in users can save the current result snapshot; logged-out
users see a prompt to log in before saving.

## Funding sources

The scanner now uses a funding source interface:

```ts
interface FundingSource {
  name: string;
  type: "mock" | "eu_portal" | "manual";
  searchCalls(project: ProjectProfile): Promise<FundingCall[]>;
}
```

Current default mode uses both `MockFundingSource` and `ManualFundingSource`:

- `MockFundingSource` wraps the demo calls in `src/lib/mock-data.ts` and annotates them with source metadata.
- `ManualFundingSource` loads locally curated calls from `src/data/manual-funding-calls.json`, validates them with `FundingCallSchema`, and skips invalid records safely.

Source flags:

```bash
PUBLIC_DEMO_PROJECT_ID=ecosmart-demo
ENABLE_MOCK_SOURCE=true
ENABLE_MANUAL_SOURCE=true
ENABLE_EU_PORTAL_SOURCE=false
EU_PORTAL_API_BASE_URL=
EU_PORTAL_API_TIMEOUT_MS=10000
```

Defaults:

- `ENABLE_MOCK_SOURCE` defaults to `true`.
- `ENABLE_MANUAL_SOURCE` defaults to `true`.
- `ENABLE_EU_PORTAL_SOURCE` defaults to `false`.

The planned `EUFundingPortalSource` is intentionally disabled and returns no calls until an official European Commission / EU Funding & Tenders Portal API endpoint, request parameters, authentication rules, and response field mapping are verified. The app avoids inventing real EU funding data, deadlines, budgets, URLs, eligibility, or programme names because those fields must come from official source data.

## Manual funding calls

Manual and curated calls are managed at:

```text
/funding-calls
```

You can add a call through `/funding-calls/new`, edit it from the call detail page, delete it, or import a JSON array on `/funding-calls`.

The local JSON file lives at:

```text
src/data/manual-funding-calls.json
```

Each imported item should contain these fields:

```json
[
  {
    "title": "Official call title",
    "programme": "Programme name",
    "topicId": "TOPIC-ID",
    "status": "Open",
    "deadline": "YYYY-MM-DD or official deadline text",
    "budget": "Official budget text",
    "url": "https://example.com/official-call-page",
    "description": "At least ten characters.",
    "eligibility": "At least ten characters.",
    "sourceName": "Manual Funding Calls",
    "sourceUrl": "https://example.com/official-source-page"
  }
]
```

Use `url` for the official call/application URL. The scan results use `url`
first, then `sourceUrl`, when displaying the "View official call" link.

The app generates a local `id`, sets `sourceType` to `manual`, and stamps `retrievedAt` with the current ISO timestamp. Imported and hand-entered calls must still validate against `FundingCallSchema` before they are stored. Invalid import rows are rejected with visible validation errors; invalid rows already present in the JSON file are skipped and counted in diagnostics.

Manual entries must be curated from official programme pages or trusted source documents. The app does not verify the truth of manually entered deadlines, budgets, URLs, programme names, or eligibility rules, so those details should be checked before applying.

## EU Funding & Tenders Portal API verification

Date of verification: 2026-05-19.

Official documentation checked:

- [EU Funding & Tenders Portal eProcurement wiki homepage](https://wikis.ec.europa.eu/spaces/FTPortal/overview)
- [Connect to the Portal, EXACT External Wiki](https://wikis.ec.europa.eu/spaces/ExactExternalWiki/pages/44171158/Connect%2Bto%2Bthe%2BPortal)
- [Find calls for tender, European Commission](https://commission.europa.eu/funding-tenders/find-calls-tender_en)
- [EU Funding & Tenders Portal terms and conditions](https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/common/ftp/tc_v6.0_en.pdf)

Verified from official sources:

- The Funding & Tenders Portal is an official European Commission-managed entry point for funding programmes and tenders.
- Public users can search funding and tender opportunities through the portal.
- The official pages above do not provide a stable, documented Grants & Tenders search API contract that is sufficient to safely map live results into this app.

Not verified yet:

- Stable API endpoint URL.
- Request method.
- Search parameters for keywords, sectors, technologies, status, and call type.
- Authentication requirements.
- Response fields for title, programme, topic id, status, deadline, budget, URL, description, and eligibility.
- Pagination, rate limits, timeout expectations, and error schema.

Implementation status:

- `EUFundingPortalSource` remains disabled by default.
- `EUFundingPortalSource` returns `[]` until the official API contract is verified.
- The source has TODO comments listing the exact official details required before enabling live data.
- The source must not scrape the visual portal UI or infer fields from undocumented network calls.

Developer diagnostics are available at:

```text
/api/diagnostics/sources
/api/diagnostics/storage
/api/diagnostics/storage/health
```

These endpoints report enabled/disabled sources, active storage driver, loaded record counts, validation error counts, Supabase configuration booleans, and whether an OpenAI key is present without exposing secrets.

`/api/diagnostics/storage/health` is the live storage check for switching from `local_json` to Supabase. It reports whether Supabase was selected, whether Supabase URL, anon key, and service role key are present as booleans only, whether the adapter is ready, whether projects and manual funding calls can be listed, record counts when accessible, and a sanitized error if a check fails.

## Admin and data portability tools

Development tools are available at:

```text
/admin/tools
```

This page shows the current storage driver, project count, manual funding call count, OpenAI key presence, and Supabase readiness. It also links to the storage health check, seeds the example project, exports data, and imports portable JSON.

The admin page is not meant for public use. In production, admin actions are disabled from the UI, `/api/dev/seed` and `/api/dev/cleanup-verification-records` return `403`, and `/api/export` plus `/api/import` require a trusted request with `x-admin-secret` matching `ADMIN_SECRET` when that variable is configured. Protect or remove `/admin/tools` before a public launch.

Development seed endpoint:

```text
POST /api/dev/seed
```

In development mode, this seeds the configured public demo project only when it is missing. It does not duplicate records and does not create fake funding calls.

By default, the seeded project is `ecosmart-demo` / EcoSmart Demo. Set
`PUBLIC_DEMO_PROJECT_ID` only if you create another generic, non-confidential
demo profile.

Verification cleanup endpoint:

```text
POST /api/dev/cleanup-verification-records
```

In development mode, this removes only records whose IDs start with
`supabase-verification-project` or `verify-supabase`. It does not delete
normal user-created projects or funding calls.
In production, this endpoint returns `403`.

Export endpoint:

```text
GET /api/export
```

The export payload is clean JSON:

```json
{
  "exportedAt": "2026-05-19T12:00:00.000Z",
  "projects": [],
  "manualFundingCalls": [],
  "savedScans": []
}
```

Import endpoint:

```text
POST /api/import
```

The import endpoint accepts the same shape:

```json
{
  "projects": [],
  "manualFundingCalls": []
}
```

Every imported project and manual funding call is validated with Zod. Valid records are upserted by `id`; duplicate IDs inside a single payload are skipped; invalid records are rejected with clear validation errors. Partial imports do not crash the app.

To move data from local JSON to Supabase:

1. Run `docs/supabase-schema.sql` in the Supabase SQL editor.
2. Run `docs/supabase-seed-ecosmart-demo.sql` if you want the generic public demo available in production.
3. Run `docs/supabase-auth-migration.sql` for existing databases.
4. Add `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to the server environment.
5. Restart the app.
6. Open `/api/diagnostics/storage/health` and confirm Supabase is ready and list operations work.
7. Export from the local app with `/api/export`.
8. Import the exported JSON into the Supabase-backed app with `/api/import` or `/admin/tools`.

Private startup ideas should be stored only after login. Generic demo data such
as EcoSmart Demo is safe for public examples.

For Vercel, set these as encrypted project environment variables. Keep the service role key server-only and never expose it in client components, logs, README examples, diagnostics output, or `NEXT_PUBLIC_` variables.

## Deploy to Vercel

Do not deploy automatically from this repository until the Supabase schema and
environment variables are ready. The app is prepared for Vercel, but secrets
must be added through Vercel project environment variables, not committed files.

Required Vercel environment variables:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=
PUBLIC_DEMO_PROJECT_ID=ecosmart-demo
STORAGE_DRIVER=supabase
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENABLE_MOCK_SOURCE=true
ENABLE_MANUAL_SOURCE=true
ENABLE_EU_PORTAL_SOURCE=false
```

Optional AI provider variables:

```bash
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

Optional production admin variable:

```bash
ADMIN_SECRET=
```

Brand assets:

```text
public/brand/fundingmatch-ai-logo.png
src/app/icon.png
```

The logo is used in the site header and homepage hero. The PNG app icon is a
cropped brand mark for browser/app favicon metadata.

Deployment notes:

- Run `docs/supabase-schema.sql` in Supabase before deploying.
- Run `docs/supabase-seed-ecosmart-demo.sql` to add or refresh the generic
  public demo project.
- Keep RLS enabled on `public.projects`, `public.manual_funding_calls`, and
  `public.saved_scans`.
- Run `docs/supabase-auth-migration.sql` when upgrading an existing database.
- Add `AI_PROVIDER=gemini` and `GEMINI_API_KEY` in Vercel for AI project
  extraction and explanation fields.
- Supabase Auth uses the public anon key; private data access remains scoped by
  server-side storage code and RLS policies.
- `SUPABASE_SERVICE_ROLE_KEY` must be server-only.
- Do not prefix secrets with `NEXT_PUBLIC_`; those variables are exposed to the
  browser bundle.
- Do not add `NEXT_PUBLIC_GEMINI_API_KEY`.
- Do not commit `.env.local` or any `.env.*.local` file.
- Private startup ideas should be stored only after login. Public pages should
  continue to use generic demo data such as EcoSmart Demo.
- Keep `ENABLE_EU_PORTAL_SOURCE=false` until the official EU Funding & Tenders
  Portal API contract is verified.
- `/admin/tools` is not a public product surface. Protect or remove it before
  public launch.

Suggested Vercel flow:

1. Create or link the Vercel project.
2. Add the required environment variables in the Vercel dashboard or with
   `vercel env add`.
3. Run `npm run lint` and `npm run build` locally.
4. Deploy a preview and verify `/api/diagnostics/storage/health`.
5. Promote or deploy to production only after the readiness checklist below is
   complete.

## Production readiness checklist

- [ ] Supabase schema applied.
- [ ] EcoSmart Demo seed applied if the public demo should be available.
- [ ] RLS enabled on `public.projects`.
- [ ] RLS enabled on `public.manual_funding_calls`.
- [ ] RLS enabled on `public.saved_scans`.
- [ ] Supabase Auth email/password enabled.
- [ ] Gemini key configured.
- [ ] AI provider set to `gemini`.
- [ ] Supabase URL configured.
- [ ] Supabase anon key configured.
- [ ] Supabase service/secret key configured.
- [ ] Storage driver set to `supabase`.
- [ ] Mock source enabled or disabled intentionally.
- [ ] Manual source enabled.
- [ ] EU portal source disabled until verified.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Verification/test records cleaned up.
- [ ] Secrets rotated after any accidental exposure.

## Useful commands

```bash
npm run lint
npm run build
```

## MVP notes

- Project profiles are stored in `src/data/projects.json` in local JSON mode.
- Manual funding calls are stored in `src/data/manual-funding-calls.json`.
- Saved scan snapshots are stored in `src/data/saved-scans.json` in local JSON mode.
- Funding calls come from every enabled source, then are deduplicated before matching.
- The scan API is available at `GET` or `POST /api/projects/[id]/scan`.
- Payments are intentionally not included.
