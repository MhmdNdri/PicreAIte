// Browser-only test entry: the real editor renders against fake external services.
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import PromptPage from "../../src/app/playground/[name]/page";
import { IMAGE_MODELS } from "../../src/lib/image-models";
import { useApiKeys } from "../../src/hooks/useApiKeys";

const canvas = document.createElement("canvas");
canvas.width = 480;
canvas.height = 320;
const context = canvas.getContext("2d")!;
context.fillStyle = "#1a1e33";
context.fillRect(0, 0, 480, 320);
context.fillStyle = "#00cbd5";
context.beginPath();
context.arc(240, 160, 100, 0, Math.PI * 2);
context.fill();
const sample = canvas.toDataURL("image/png");
const smoke = {
  requests: [] as Record<string, unknown>[],
  uploads: [] as { name: string; type: string; size: number }[],
  pending: false,
  rotateKey: (provider: string, key: string) => {
    void provider;
    void key;
  },
  finish: (status: string, mime: string) => {
    void status;
    void mime;
  },
  sample,
};
Object.assign(window, { __uiSmoke: smoke });
const nativeFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = String(input);
  if (url.startsWith("/api/prompts/")) {
    return Response.json({
      name: "Studio Portrait",
      type: "Photography",
      promptDesc: "Create a studio portrait.",
      description:
        "A clean studio portrait with soft light and natural detail.",
      imageUrl: sample,
      originalImage: sample,
    });
  }
  if (url.startsWith("/api/generateImage")) {
    const form = init?.body as FormData;
    const fields = Object.fromEntries(form.entries());
    smoke.requests.push(fields);
    smoke.pending = true;
    return new Promise<Response>((resolve) => {
      smoke.finish = (status, mime) => {
        const key = fields.model as keyof typeof IMAGE_MODELS;
        const image = canvas.toDataURL(mime).split(",")[1];
        smoke.pending = false;
        resolve(
          Response.json({
            data: [{ b64_json: image, mime_type: mime }],
            model: IMAGE_MODELS[key].id,
            provider: fields.keySource,
            settings: {
              quality: fields.quality,
              resolution: fields.resolution,
              size: fields.size,
            },
            cost: {
              status,
              ...(status === "unavailable" ? {} : { amountUsd: 0.033634 }),
              note:
                status === "partial"
                  ? "Missing input usage; the final charge may be higher."
                  : "Fixture usage at published model rates.",
              lineItems:
                status === "estimated" || status === "partial"
                  ? [
                      {
                        label: "Output image tokens",
                        quantity: 1120,
                        unit: "tokens",
                        rateUsd: 0.00003,
                        amountUsd: 0.0336,
                      },
                    ]
                  : [],
              tokens: { total: 1134 },
              sourceUrl: IMAGE_MODELS[key].pricingUrl,
              checkedAt: "2026-09-17",
            },
          }),
        );
      };
    });
  }
  return nativeFetch(input, init);
};

function KeyBridge() {
  const { setApiKey } = useApiKeys();
  smoke.rotateKey = (provider, key) => setApiKey(provider as "openai", key);
  return null;
}

const params = Promise.resolve({ name: "studio-portrait" });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <KeyBridge />
    <Suspense fallback={<p>Loading editor...</p>}>
      <PromptPage params={params} />
    </Suspense>
    <Toaster />
  </QueryClientProvider>,
);
