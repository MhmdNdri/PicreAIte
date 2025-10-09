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

type ProviderType = "openai" | "openai-mini" | "gemini";

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
    badge: "Standard",
    description: "High-quality image generation",
  },
  "openai-mini": {
    name: "OpenAI gpt-image-1-mini",
    icon: <Zap className="h-4 w-4" />,
    color: "text-emerald-500",
    badge: "Cheaper",
    description: "Cost-effective image generation",
  },
  gemini: {
    name: "Google Imagen 3",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-blue-600",
    badge: "Fast",
    description: "May not be available in all countries",
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
      if (hasApiKey("openai")) {
        providers.push("openai");
        providers.push("openai-mini");
      }
      if (hasApiKey("gemini")) providers.push("gemini");
      setAvailableProviders(providers);
    }
  }, [isLoaded, hasApiKey]);

  const handleProviderChange = (provider: string) => {
    const typedProvider = provider as ProviderType;
    // Both openai and openai-mini use the same OpenAI API key
    const keyType = typedProvider === "openai-mini" ? "openai" : typedProvider;
    const apiKey = getApiKey(keyType as "openai" | "gemini");
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
                <Badge
                  variant={provider === "openai-mini" ? "outline" : "secondary"}
                  className={`ml-2 ${
                    provider === "openai-mini"
                      ? "border-emerald-500 text-emerald-600"
                      : ""
                  }`}
                >
                  {PROVIDERS[provider].badge}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {PROVIDERS[provider].description}
              </p>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
