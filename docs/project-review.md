# PicreAIte review and model upgrade

Reviewed 17 September 2026, starting at commit `dccc4f5` on `main`.

## Product and current state

PicreAIte is a bring-your-own-key photo transformation app: sign in, choose an
admin-curated style, upload one photo (up to 4 MB), choose an image model, transform,
then download or explicitly save to a personal gallery. Preset prompts live in
PostgreSQL, not in this repository. It is not currently a free-form image editor,
model comparison bench, or multi-turn editing application.

The code has evolved beyond its original 2025 version. The latest commit added
GPT Image 2 on 26 April 2026. The principal pieces are:

| Area           | Implementation                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| App/UI         | Next.js 15 App Router, React 19, TypeScript, Tailwind, Radix UI                                         |
| Authentication | Clerk, with user records synchronized by signed webhooks                                                |
| Styles         | `prompts` table; public read APIs and an admin editing interface                                        |
| Image editing  | Three authenticated Next.js routes for OpenAI, Gemini, xAI; OpenRouter used when a direct key is absent |
| Keys           | Stored in browser localStorage, forwarded to the selected API through the application server            |
| State          | TanStack Query for API data/mutations; local React state for editing                                    |
| Storage        | UploadThing files plus `saved_images` metadata in PostgreSQL/Drizzle                                    |
| Gallery        | Per-user images with 24-hour expiry                                                                     |
| Analytics      | PostHog page views                                                                                      |

Flow: browser → preset/photo/model/settings → authenticated API route → selected
provider → base64 result → download or UploadThing → gallery metadata.

## Findings at the starting commit

1. **Model selection was misleading with OpenRouter.** Gemini and Grok selections
   called `openai/gpt-image-1`; newer OpenAI failures could silently fall back to
   GPT Image 1. The selected model therefore did not identify the executed model.
2. **Provider contracts had drifted.** OpenRouter's current dedicated image API is
   `POST /api/v1/images` with JSON reference images. The implementation used
   multipart `/images/edits`.
3. **Pricing was unreliable.** Result cost used old GPT Image 1 rates, assumed Mini
   was exactly three times cheaper, and added an unexplained 35%. Gemini was
   treated as zero cost. These values cannot be used to compare current models.
4. **Controls and output handling were inconsistent.** Landscape/portrait labels
   specified 3:2/2:3 but Gemini and Grok requests used other ratios. All output was
   labeled PNG, including JPEG from xAI. Gemini returned the first inline image
   without excluding thought images. Gemini/xAI routes had only a 60-second budget.
5. **Critical deployment issue outside the model migration:** POST/PUT/DELETE
   `/api/prompts` have no server-side authorization. The admin UI only checks a
   cookie equal to `true`; it is not a signed administrator session. Add a verified
   Clerk admin role or a signed session and enforce it on every mutation before
   public deployment. `clerkMiddleware()` alone does not protect these routes.
6. **Gallery expiry is incomplete.** Reading the gallery deletes expired database
   rows without deleting UploadThing files. A separate cleanup function exists
   but has no scheduler in the repository. Store provider/model/prompt/settings
   with saved results if reproducibility and comparisons are desired.
7. **Setup and maintenance gaps.** README documents split database variables but
   runtime requires DATABASE_URL; `.env.example` and checked-in migrations are
   absent. There was no test suite or CI, and `.gitignore` excluded tests and new
   Markdown. Unused provider/mask/key-hook scaffolding remains. Dependencies and
   authentication deserve a separate maintenance pass.
8. **Key storage tradeoff:** localStorage persists keys and is readable by scripts
   on this origin. The UI should accurately explain that keys also transit the
   application server. Consider session-only storage as an optional future mode.

## Model choices and sources

These are the latest applicable image-editing models verified for the existing
providers on the review date. This is not a claim to list every image model on the
market. Account access and actual visual quality still require live evaluation.

| Choice                 | API model                     | Benefit/role                                  | Standard direct API pricing (USD)                                                     |
| ---------------------- | ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| GPT Image 2.5 Sunburst | `gpt-image-2.5-sunburst`      | Precise edits, detailed work                  | Per 1M tokens: text input $5; image input $8; image output $30                        |
| GPT Image 2.5 Flare    | `gpt-image-2.5-flare`         | Faster everyday work                          | Same token rates as Sunburst; token usage and per-image totals can differ             |
| GPT Image 1 Mini       | `gpt-image-1-mini`            | Retained OpenAI budget tier                   | Per 1M tokens: text input $2; image input $2.50; image output $8                      |
| Nano Banana 2          | `gemini-3.1-flash-image`      | General-purpose balance, up to 4K             | Image output about $0.067 at 1K, $0.101 at 2K, $0.151 at 4K, plus input/text/thinking |
| Nano Banana 2 Lite     | `gemini-3.1-flash-lite-image` | Low latency/cost, 1K only                     | Image output $0.0336 at 1K, plus input/text/thinking                                  |
| Nano Banana Pro        | `gemini-3-pro-image`          | Complex edits and professional assets         | Image output $0.134 at 1K/2K, $0.24 at 4K, plus input/text/thinking                   |
| Grok Imagine Image 2.0 | `grok-imagine-image-2.0`      | xAI editing with two quality/resolution tiers | $0.04–$0.08 per output plus $0.01 per input image                                     |

Rates exclude taxes, discounts, caching, and any intermediary/account fees.
OpenRouter pricing is provider-specific; its reported `usage.cost` is displayed
when available. No direct-provider cost is fabricated from incomplete usage.

Official sources:

- [OpenAI image generation and 2.5 controls](https://developers.openai.com/api/docs/guides/image-generation)
- [Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst), [Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare), [Mini](https://developers.openai.com/api/docs/models/gpt-image-1-mini)
- [Google model selection](https://ai.google.dev/gemini-api/docs/image-generation), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [generateContent request contract](https://ai.google.dev/gemini-api/docs/generate-content/image-generation)
- [Grok 2.0 model/pricing](https://docs.x.ai/developers/models/grok-imagine-image-2.0), [editing contract](https://docs.x.ai/developers/model-capabilities/images/editing)
- [OpenRouter image API](https://openrouter.ai/docs/guides/overview/multimodal/image-generation), [live image catalog](https://openrouter.ai/api/v1/images/models)

All seven OpenRouter slugs and endpoint capabilities were checked against its
public image catalog. Prefixes are `openai/`, `google/`, and `x-ai/` respectively.
Gemini 2.5 Flash Image is listed for shutdown on 2 October 2026; the new Lite tier
replaces its budget role. Pro moves from the preview ID to its stable ID.

## Implementation plan

1. Centralize model identity, direct/OpenRouter mapping, benefits, price sources,
   and accepted quality/resolution controls. Preserve the existing providers and
   the one-photo workflow, with distinct budget, fast, and detailed choices.
2. Update provider adapters and server validation together. Route the exact
   selected model through OpenRouter, never silently change models, preserve MIME
   types, and use a consistent request timeout.
3. Update the picker and settings to show supported controls and pricing context.
  Show the executed model, reported charges or usage-based cost estimates, with
  an explicit distinction between full and partial accounting.
4. Add offline contract regressions, run TypeScript and a production build, and
   distinguish offline checks from paid end-to-end/image-quality validation.
5. Next: secure prompt administration, repair expiry cleanup and setup docs, then
   benchmark real presets/photos across models before recommending defaults.

## Product direction

Keep the simple style-first interaction. The most valuable next feature is a
side-by-side comparison of the same photo and preset across chosen models, with
recorded latency, settings, actual billed cost where available, and a user rating
for identity preservation, style adherence, artifacts, and text accuracy. Newer
model names alone cannot establish better results for the project's real presets.

Build a small evaluation set first: portraits, groups, pets, products, scenes,
and text-bearing photos. Run each chosen style/model combination at least three
times; compare outcomes and failures as well as speed/cost. Actual prompt contents
and production behavior were not accessible from this clone.

## Implemented locally

- Added the seven-choice catalog in `src/lib/image-models.ts`; direct keys take
  precedence and OpenRouter preserves the selected model.
- Replaced three duplicated route implementations with shared authentication,
  validation, and error handling plus distinct provider adapters.
- Updated Gemini to its documented stable v1 REST request contract; removed the
  two unused Google SDK dependencies and the dormant, outdated provider selector.
- Added model-specific quality/resolution controls, correct 3:2/2:3 mappings,
  MIME-preserving downloads/uploads, final-image selection for Gemini, and an
  authenticated OpenRouter key validation endpoint.
- Replaced fabricated cost calculations with model-specific input, output and
  thinking-token accounting. OpenRouter and xAI billed costs take priority;
  missing metadata is partial or unavailable. Results include a price breakdown,
  source/date, and immutable settings. See [cost accounting](model-pricing.md).
- Unified picker/drop upload validation and HEIC conversion, removed browser
  Buffer usage, cleaned up preview URLs, preserved output formats, and prevented
  duplicate gallery saves. Oversized gallery saves offer full-quality Download.
- Synchronized changed/deleted keys across components and tabs; requests read the
  current key at submission. Fixed narrow-screen action wrapping and button contrast.
- Streamed completed large image JSON responses in 64 KiB chunks. A local HTTP
  check covers payloads over 4.5 MB; deployment-host behavior remains unverified.
- Added `.env.example`, corrected setup instructions, and added test/typecheck
  commands. No database, prompt content, or production infrastructure was changed.

## Validation and remaining limits

- Baseline TypeScript check passed before changes.
- Updated TypeScript check and `git diff --check` pass.
- **103 offline regressions pass**: seven direct routes, seven OpenRouter mappings,
  capabilities, invalid inputs, upstream failures without model substitution,
  Gemini safety/text-only responses, output MIME, key selection, precise pricing,
  missing/invalid usage, multiple image accounting, uploads and large responses.
- `bun install --frozen-lockfile` succeeds after dependency cleanup.
- Full production build passes with process-local placeholder credentials and
  Next's font test mock using cached Inter bytes. Environment validation stays
  enabled; production authentication is unchanged. This verifies compilation and
  prerendering, not live credentials. The pre-existing HEIC dependency emits a
  Webpack warning; Browserslist data is also outdated.
- `bun run lint` is now noninteractive and passes with 41 retained warnings and
  no newly introduced warnings (the starting source has 50 with the same config).
- **68 browser assertions pass**, with no console errors or horizontal overflow
  at 1365, 768, 390 and 320 px. Light/dark screenshots were visually inspected.
  Browser smoke tests run the actual editor components with fake external
  authentication, prompt/provider responses and gallery transport. They exercise
  the model controls, key changes, uploads, cost states, downloads, pending states,
  and responsive layout. They do not replace a live authenticated integration run.
- No paid image calls, authenticated browser flow, gallery persistence, or visual
  quality benchmark was run. No application credentials or database presets are
  configured in this clone. Provider documentation and the public OpenRouter
  catalog were checked live; successful paid calls and improved output quality
  still need to be verified with this application's actual accounts and presets.
- Changes are committed locally on `main` in focused commits; nothing was pushed
  or deployed.

The next concrete step is to configure the existing app credentials, run a small
cross-model photo/preset comparison, then fix prompt-administration authorization
and gallery cleanup before deploying. The model migration does not fix those
separate existing issues.
