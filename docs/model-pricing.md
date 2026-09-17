# Image generation cost accounting

Rates checked **17 September 2026**. Prices below are standard synchronous paid
API rates in USD. `src/lib/image-pricing.ts` calculates a cost only after a
successful response. Counts come from that response; estimates never use prompt
character counts or an arbitrary multiplier.

| Model                          | Text input / 1M | Image input / 1M | Text + thinking output / 1M | Image output / 1M |
| ------------------------------ | --------------: | ---------------: | --------------------------: | ----------------: |
| GPT Image 2.5 Sunburst / Flare |              $5 |               $8 |                  Not billed |               $30 |
| GPT Image 1 Mini               |              $2 |            $2.50 |           Image output only |                $8 |
| Gemini 3.1 Flash Image         |           $0.50 |            $0.50 |                          $3 |               $60 |
| Gemini 3.1 Flash Lite Image    |           $0.25 |            $0.25 |                       $1.50 |               $30 |
| Gemini 3 Pro Image             |              $2 |               $2 |                         $12 |              $120 |

Sources: [Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst),
[Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare),
[Mini](https://developers.openai.com/api/docs/models/gpt-image-1-mini),
[Google pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Response contract

Generation responses include `cost`, the executed `model` and `provider`, and a
snapshot of the submitted `settings`. `cost` has:

- `status`: `reported`, `estimated`, `partial`, or `unavailable`.
- `amountUsd`: only present when a reported charge or meaningful estimate exists.
- `lineItems`: quantities, units, unrounded rates and amounts for calculated costs.
- `tokens`: available input/output/thinking/total counters (unknown stays absent).
- `note`, `sourceUrl`, `checkedAt`: basis, limitations and source of the rates.

`partial` amounts exclude unreported categories and must never be presented as
the complete request total. An absent charge is not zero; a provider-reported
zero is valid. Invalid or inconsistent counters cannot produce a complete
estimate. `costUsd` remains an optional compatibility field for reported charges
only. The cost covers the upstream request, even if it returns additional images
and the editor displays the first final image.

## Provider calculations

**OpenAI:** price `input_tokens_details.text_tokens` and `.image_tokens`
separately. Prefer `output_tokens_details.image_tokens`; use `output_tokens`
only when the modality breakdown is absent. Each line is `tokens × rate / 1M`.
Text output on 2.5 is not billed. Missing categories produce a partial estimate
or unavailable state. [Images API usage](https://developers.openai.com/api/reference/resources/images/methods/edit)

OpenAI publishes cached text/image input rates of $1.25/$2 for 2.5 and
$0.20/$0.25 for Mini. Its Images API does not document a modality cache-usage
breakdown in this response, so calculated amounts use standard input rates and
explicitly state that caching can lower the bill. They are not billed totals.

**Gemini:** price `promptTokenCount` at the input rate. Sum IMAGE entries in
`candidatesTokensDetails` at the image rate; price the remaining
`candidatesTokenCount` as text. Add `thoughtsTokenCount` at the text/thinking
rate once. When omitted, infer thinking from a consistent total where possible;
otherwise the optional omitted thinking count is zero. Google defines total as
prompt + candidates + thoughts. [Usage metadata](https://ai.google.dev/api/generate-content#UsageMetadata)

When image modality details are missing, the calculator explicitly estimates
image tokens from the requested resolution and number of returned final images:

| Model | 1K tokens / cost | 2K tokens / cost | 4K tokens / cost |
| ----- | ---------------- | ---------------- | ---------------- |
| Flash | 1120 / $0.0672   | 1680 / $0.1008   | 2520 / $0.1512   |
| Lite  | 1120 / $0.0336   | Unsupported      | Unsupported      |
| Pro   | 1120 / $0.1344   | 1120 / $0.1344   | 2000 / $0.24     |

These are output-only costs; input, text and thinking are additional. Missing
usage produces only a partial output estimate. These image models do not support
context caching; no cache discount is invented. Provider model/pricing links
above document these token counts.

**xAI:** prefer reported `usage.cost_in_usd_ticks / 10,000,000,000`, which includes
provider discounts. Without that value, estimate one input image at $0.01 plus
one output: 1K low $0.04; 2K low or 1K medium $0.06; 2K medium $0.08. This tariff
is per image, not per token. [Cost tracking](https://docs.x.ai/developers/cost-tracking),
[model pricing](https://docs.x.ai/developers/models/grok-imagine-image-2.0)

**OpenRouter:** use its returned `usage.cost`. Aggregate token counts alone do
not identify the routed provider's image/modality tariff; if cost is absent,
show unavailable and direct users to OpenRouter Activity. Do not silently apply
direct-provider prices. [Image API](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)

## Maintenance and verification

Update the catalog, calculator rates, checked date, independent literal test
fixtures, and this document together when a provider changes its rates. Preserve
full numeric precision in the API; round only for display. Tests exercise all
seven direct models, all OpenRouter routes, missing and invalid metadata, zero
charges, thinking, multiple images, and resolution-specific output costs.

Live invoices, account discounts, taxes, fees, failed requests that an upstream
provider charges for, and gallery storage are outside this generation-cost
estimate. No paid generation or invoice reconciliation was possible without the
application's actual accounts. A failed provider call never appears as a free
successful generation.
