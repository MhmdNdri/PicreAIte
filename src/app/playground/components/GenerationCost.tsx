import type { ImageCost } from "@/lib/image-pricing";

const titles = {
  reported: "Reported request cost",
  estimated: "Estimated request cost",
  partial: "Partial cost estimate",
  unavailable: "Cost unavailable",
};
const usd = (amount: number) =>
  `$${amount.toFixed(6).replace(/0+$/, "").replace(/\.$/, ".00")}`;

export function GenerationCost({ cost }: { cost: ImageCost }) {
  return (
    <section
      aria-label="Generation cost"
      className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2"
    >
      <div className="flex flex-wrap justify-between gap-2 font-medium">
        <span>{titles[cost.status]}</span>
        {cost.amountUsd !== undefined && <span>{usd(cost.amountUsd)} USD</span>}
      </div>
      <p className="text-xs text-muted-foreground">{cost.note}</p>
      {!!cost.lineItems.length && (
        <details className="text-xs">
          <summary className="cursor-pointer py-1">
            Usage and price breakdown
          </summary>
          <dl className="space-y-3 mt-2">
            {cost.lineItems.map((item) => (
              <div key={item.label} className="flex justify-between gap-3">
                <div className="min-w-0">
                  <dt>{item.label}</dt>
                  <dd className="text-muted-foreground">
                    {item.quantity.toLocaleString("en-US")} {item.unit} ×{" "}
                    {usd(
                      item.rateUsd * (item.unit === "tokens" ? 1_000_000 : 1),
                    )}
                    {item.unit === "tokens" ? " / 1M tokens" : " / image"}
                  </dd>
                </div>
                <dd className="shrink-0">{usd(item.amountUsd)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {cost.tokens?.total !== undefined && (
        <p className="text-xs text-muted-foreground">
          Total reported usage: {cost.tokens.total.toLocaleString("en-US")}{" "}
          tokens
          {cost.tokens.thinking !== undefined
            ? ` (including ${cost.tokens.thinking.toLocaleString("en-US")} thinking tokens)`
            : ""}
          .
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <a
          className="underline"
          href={cost.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Pricing source
        </a>{" "}
        · Rates checked {cost.checkedAt}
      </p>
    </section>
  );
}
