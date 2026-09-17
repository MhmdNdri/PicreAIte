# PicreAIte

A style-first photo editor built with Next.js, React, PostgreSQL/Drizzle, Clerk,
and UploadThing. Choose a preset, upload a photo, select an image model with your
own API key, and download the result or save it to your 24-hour gallery.

## Current model lineup

Reviewed on **17 September 2026**:

- OpenAI: GPT Image 2.5 Sunburst (precision), Flare (speed), and GPT Image 1 Mini (budget).
- Google: Nano Banana 2 (balanced), Nano Banana 2 Lite (budget/speed), and Nano Banana Pro (complex edits).
- xAI: Grok Imagine Image 2.0.
- OpenRouter: access the same selected models when a direct provider key is absent.

The picker shows model-specific benefits, capabilities, published direct pricing,
and pricing links. Results show OpenRouter/xAI reported charges or model-specific
estimates from returned usage. Incomplete usage produces a clearly labeled partial
estimate or unavailable state. Expand the result's breakdown to see quantities and
rates. See [cost accounting](docs/model-pricing.md) for formulas and limitations.

Model IDs, routing, controls, and price notes live in
[src/lib/image-models.ts](src/lib/image-models.ts).
See [the project review and upgrade plan](docs/project-review.md) for the
architecture, findings, official model sources, and next steps.

## Local setup

1. Install Node.js 20+ and Bun 1.3.4+.
2. Run `bun install --frozen-lockfile`.
3. Copy `.env.example` to `.env.local` and fill in PostgreSQL, Clerk, and UploadThing credentials.
   The database adapter currently requires SSL.
4. For a **new development database**, run `bun run db:push` to apply the schema.
   Review schema changes before applying them to an existing database. No migration
   history or style seeds are currently checked in.
5. Configure the Clerk webhook at `/api/webhooks/clerk` for user created, updated,
   and deleted events. Gallery saves require the synchronized database user record.
6. Run `bun run dev`, sign in, and add your image-provider key under `/api-key`.
7. Populate development styles through `/admin` (requires `ADMIN_PASSWORD`).
   Existing production presets must come from your database.

The optional PostHog variables configure analytics. Image editing uses browser-saved
user keys; setting a server `OPENAI_API_KEY` alone does not configure the app.

**Before public deployment:** fix the existing server-side authorization gap on
prompt mutations described in the review. The admin page's client-side guard
does not authorize `/api/prompts` writes.

## Development commands

- `bun run dev` — development server.
- `bun run build` / `bun run start` — production build/server; requires valid app environment.
- `bun run typecheck` — TypeScript checks.
- `bun run test` — offline provider, pricing, upload and response regressions; no paid API calls.
- `bun run lint` — noninteractive Next.js/TypeScript ESLint checks.
- `bun run test:ui` — editor browser smoke checks with fake external services.
  Install Chromium once with `bunx playwright install chromium`, or use an installed
  browser via `BROWSER_CHANNEL=msedge` (PowerShell: `$env:BROWSER_CHANNEL='msedge'`).
  Screenshots and reports are written to ignored `coverage/ui-smoke`.
- `bun run db:generate`, `bun run db:migrate`, `bun run db:push`, `bun run db:studio` — database tooling.

The editing endpoints accept a multipart form containing `model` (catalog key or
current direct model ID), `apiKey`, `keySource`, `prompt`, one `image`, `size`, and
the selected model's optional `quality`/`resolution`. Unsupported options are
rejected. Results include base64 bytes, MIME type, executed model, provider, and
cost details, and the submitted settings. Successful large JSON responses are
streamed in chunks; clients still consume them with `response.json()`.

Provider calls are bounded to 280 seconds with a 300-second route budget. Check
that your deployment plan supports that duration. The app keeps a one-photo,
4 MB input limit; larger model capabilities are not all exposed by this UI.
Gallery saves have an 8 MB limit; Download preserves larger results at full quality.
