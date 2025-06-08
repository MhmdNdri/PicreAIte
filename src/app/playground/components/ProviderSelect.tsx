"use client";

import { useState, useEffect } from "react";
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
import { Zap, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

type ProviderType = "openai" | "gemini";

interface ProviderSelectProps {
  onProviderSelect: (provider: ProviderType, apiKey: string) => void;
  selectedProvider?: ProviderType;
  disabled?: boolean;
}

const PROVIDERS = {
  openai: {
    name: "OpenAI gpt-image-1",
    icon: <Zap className="h-4 w-4" />,
    color: "text-emerald-600",
  },
  gemini: {
    name: "Google Imagen 3",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-blue-600",
  },
};

export function ProviderSelect({
  onProviderSelect,
  selectedProvider,
  disabled = false,
}: ProviderSelectProps) {
  const { hasApiKey, getApiKey, isLoaded } = useApiKeys();
  const [availableProviders, setAvailableProviders] = useState<ProviderType[]>(
    []
  );

  useEffect(() => {
    if (isLoaded) {
      const providers: ProviderType[] = [];
      if (hasApiKey("openai")) providers.push("openai");
      if (hasApiKey("gemini")) providers.push("gemini");
      setAvailableProviders(providers);
    }
  }, [isLoaded, hasApiKey]);

  const handleProviderChange = (provider: string) => {
    const typedProvider = provider as ProviderType;
    const apiKey = getApiKey(typedProvider);
    if (apiKey) {
      onProviderSelect(typedProvider, apiKey);
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <Label>AI Provider</Label>
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <div className="space-y-2">
        <Label>AI Provider</Label>
        <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                No API keys configured.{" "}
                <Link href="/api-key" className="underline font-medium">
                  Set them up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>AI Provider</Label>
      <Select
        value={selectedProvider || ""}
        onValueChange={handleProviderChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI provider" />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((provider) => (
            <SelectItem key={provider} value={provider}>
              <div className="flex items-center gap-2">
                <span className={PROVIDERS[provider].color}>
                  {PROVIDERS[provider].icon}
                </span>
                <span>{PROVIDERS[provider].name}</span>
                <Badge variant="secondary" className="ml-2">
                  {hasApiKey(provider) ? "✓ Ready" : "Setup Required"}
                </Badge>
              </div>
              {provider === "gemini" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Gemini image generation may not be available in all
                  countries
                </p>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
