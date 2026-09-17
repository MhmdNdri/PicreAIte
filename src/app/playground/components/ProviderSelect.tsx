"use client";

import { useEffect } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  IMAGE_MODELS,
  IMAGE_MODEL_KEYS,
  MODEL_CATALOG_CHECKED_AT,
  resolveKeySource,
  type ImageModelKey,
  type ApiKeySource,
} from "@/lib/image-models";

export type ProviderType = ImageModelKey;
export type { ApiKeySource } from "@/lib/image-models";

interface ProviderSelectProps {
  onProviderSelect: (
    provider: ProviderType,
    apiKey: string,
    keySource: ApiKeySource,
  ) => void;
  selectedProvider?: ProviderType;
  disabled?: boolean;
}

export function ProviderSelect({
  onProviderSelect,
  selectedProvider,
  disabled = false,
}: ProviderSelectProps) {
  const { hasApiKey, getApiKey, isLoaded } = useApiKeys();
  const availableModels = IMAGE_MODEL_KEYS.filter((key) =>
    resolveKeySource(key, hasApiKey),
  );

  useEffect(() => {
    if (
      !isLoaded ||
      disabled ||
      (selectedProvider && resolveKeySource(selectedProvider, hasApiKey))
    )
      return;
    // Preserve the app's budget-first default for existing direct-key users.
    const defaults: ProviderType[] = [
      "openai-mini",
      "gemini-nano-banana",
      "grok-imagine",
      "openai",
    ];
    const initial =
      defaults.find((key) => hasApiKey(IMAGE_MODELS[key].provider)) ??
      (hasApiKey("openrouter") ? "openai" : undefined);
    if (!initial) return;
    const source = resolveKeySource(initial, hasApiKey)!;
    const key = getApiKey(source);
    if (key) onProviderSelect(initial, key, source);
  }, [
    isLoaded,
    disabled,
    selectedProvider,
    hasApiKey,
    getApiKey,
    onProviderSelect,
  ]);

  if (!isLoaded)
    return <div className="h-11 animate-pulse rounded-md bg-muted" />;
  if (!availableModels.length)
    return (
      <p className="text-sm text-muted-foreground">
        Add a provider key or one OpenRouter key in{" "}
        <Link href="/api-key" className="underline">
          API Key Settings
        </Link>
        .
      </p>
    );

  const selected = selectedProvider
    ? IMAGE_MODELS[selectedProvider]
    : undefined;
  const source = selectedProvider
    ? resolveKeySource(selectedProvider, hasApiKey)
    : null;

  return (
    <div className="space-y-3">
      <Label htmlFor="image-model">Image model</Label>
      <Select
        value={selectedProvider ?? ""}
        disabled={disabled}
        onValueChange={(value) => {
          const model = value as ProviderType;
          const keySource = resolveKeySource(model, hasApiKey);
          if (!keySource) return;
          const apiKey = getApiKey(keySource);
          if (apiKey) onProviderSelect(model, apiKey, keySource);
        }}
      >
        <SelectTrigger
          id="image-model"
          className="w-full min-w-0 h-auto min-h-11 text-left [&>span]:truncate"
        >
          <SelectValue placeholder="Choose a model" />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((key) => (
            <SelectItem key={key} value={key} className="py-3">
              {IMAGE_MODELS[key].name} · {IMAGE_MODELS[key].tier}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{selected.tier}</Badge>
            <span className="text-xs text-muted-foreground">
              {source === "openrouter"
                ? "Via OpenRouter"
                : "Direct provider API"}
            </span>
          </div>
          <p className="text-sm">{selected.description}</p>
          <p className="text-xs text-muted-foreground">
            Direct API rates (USD): {selected.pricing}
          </p>
          <p className="text-xs text-muted-foreground">
            Rates checked {MODEL_CATALOG_CHECKED_AT}; taxes and account fees may
            apply.{" "}
            <a
              href={selected.pricingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Provider pricing
            </a>
            {source === "openrouter" && (
              <>
                {" "}
                ·{" "}
                <a
                  href={`https://openrouter.ai/${selected.openRouterId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  OpenRouter pricing
                </a>
                . OpenRouter rates may differ; reported request cost appears
                with the result.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
