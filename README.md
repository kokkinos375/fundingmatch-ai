# FundingMatch AI

FundingMatch AI is a Next.js + TypeScript MVP for creating generic startup or project profiles and scanning them against source-based funding-call datasets.

The app includes one generic public example profile, EcoSmart Demo, but the schema, form, scoring, and scan flow are generic.

This MVP does not yet include authentication. Any public deployment should use generic demo data only, or add authentication before storing private startup ideas.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod validation
- OpenAI API for match explanations and risk notes
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

## Optional OpenAI configuration

The scan works without an API key by using deterministic local explanations. To enable AI explanations, set:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

Scores are always calculated by local code in `src/lib/scoring.ts`. OpenAI is only asked to explain the calculated match, identify risks, list missing information, and recommend a next step.

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
SUPABASE_SERVICE_ROLE_KEY=
```

The app does not require Supabase credentials for local development. If `STORAGE_DRIVER=supabase` is set but either Supabase environment variable is missing, the app falls back to `local_json` and reports the configuration problem in `/api/diagnostics/storage`.

To set up Supabase:

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `docs/supabase-schema.sql`.
4. Run `docs/supabase-seed-ecosmart-demo.sql` if you want the public EcoSmart Demo project available in Supabase.
5. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `STORAGE_DRIVER=supabase` to your server environment.
6. Restart the app.

`SUPABASE_SERVICE_ROLE_KEY` must remain server-only. Do not expose it through `NEXT_PUBLIC_` variables, browser code, README examples, logs, diagnostics, or client components.

The SQL schema enables Row Level Security on `public.projects` and
`public.manual_funding_calls` by default. It intentionally does not create
public `anon` or `authenticated` policies yet. The app currently accesses
Supabase only through server-side `SupabaseStorage` using the service/secret
key, which must never be exposed to the browser. Add authentication and
explicit user-scoped RLS policies before allowing direct client access.

For Vercel deployment, add `STORAGE_DRIVER`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` as encrypted project environment variables. Use `local_json` only for local MVP work; use Supabase or another durable database for production persistence.

The PostgreSQL table design is in:

```text
docs/supabase-schema.sql
```

The generic public demo seed is in:

```text
docs/supabase-seed-ecosmart-demo.sql
```

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

`/api/diagnostics/storage/health` is the live storage check for switching from `local_json` to Supabase. It reports whether Supabase was selected, whether `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present as booleans only, whether the adapter is ready, whether projects and manual funding calls can be listed, record counts when accessible, and a sanitized error if a check fails.

## Admin and data portability tools

Development tools are available at:

```text
/admin/tools
```

This page shows the current storage driver, project count, manual funding call count, OpenAI key presence, and Supabase readiness. It also links to the storage health check, seeds the example project, exports data, and imports portable JSON.

The admin page is not protected yet. Do not expose `/admin/tools` in production until authentication and authorization are added. In production, `/api/dev/seed` returns `403`, but the admin page itself still needs route protection before public launch.

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
  "manualFundingCalls": []
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
3. Add `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` to the server environment.
4. Restart the app.
5. Open `/api/diagnostics/storage/health` and confirm Supabase is ready and list operations work.
6. Export from the local app with `/api/export`.
7. Import the exported JSON into the Supabase-backed app with `/api/import` or `/admin/tools`.

Do not store private startup ideas in public deployments without
authentication. Generic demo data such as EcoSmart Demo is safe for public
examples; private project records should live only in private/protected
deployments.

For Vercel, set these as encrypted project environment variables. Keep the service role key server-only and never expose it in client components, logs, README examples, diagnostics output, or `NEXT_PUBLIC_` variables.

## Deploy to Vercel

Do not deploy automatically from this repository until the Supabase schema and
environment variables are ready. The app is prepared for Vercel, but secrets
must be added through Vercel project environment variables, not committed files.

Required Vercel environment variables:

```bash
OPENAI_API_KEY=
PUBLIC_DEMO_PROJECT_ID=ecosmart-demo
STORAGE_DRIVER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ENABLE_MOCK_SOURCE=true
ENABLE_MANUAL_SOURCE=true
ENABLE_EU_PORTAL_SOURCE=false
```

Deployment notes:

- Run `docs/supabase-schema.sql` in Supabase before deploying.
- Run `docs/supabase-seed-ecosmart-demo.sql` to add or refresh the generic
  public demo project.
- Keep RLS enabled on `public.projects` and `public.manual_funding_calls`.
- No public Supabase `anon` or `authenticated` policies are used yet; the app
  accesses Supabase through server-side `SupabaseStorage`.
- `SUPABASE_SERVICE_ROLE_KEY` must be server-only.
- Do not prefix secrets with `NEXT_PUBLIC_`; those variables are exposed to the
  browser bundle.
- Do not commit `.env.local` or any `.env.*.local` file.
- Use only generic demo data on public deployments until authentication is
  added.
- Do not store private startup ideas in public deployments without
  authentication.
- Keep `ENABLE_EU_PORTAL_SOURCE=false` until the official EU Funding & Tenders
  Portal API contract is verified.
- `/admin/tools` is not protected yet. Protect or disable it before public
  launch.

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
- [ ] OpenAI key configured.
- [ ] Supabase URL configured.
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
- Funding calls come from every enabled source, then are deduplicated before matching.
- The scan API is available at `GET` or `POST /api/projects/[id]/scan`.
- Authentication and payments are intentionally not included.
