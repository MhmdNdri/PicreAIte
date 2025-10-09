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
    name: "gpt-image-1",
    displayName: "OpenAI Standard",
    icon: <Zap className="h-4 w-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
    badge: "Standard",
    badgeColor:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    description: "High-quality image generation",
  },
  "openai-mini": {
    name: "gpt-image-1-mini",
    displayName: "OpenAI Mini",
    icon: <Zap className="h-4 w-4" />,
    color: "text-emerald-500 dark:text-emerald-400",
    badge: "3x Cheaper",
    badgeColor:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    description: "Cost-effective image generation",
  },
  gemini: {
    name: "Imagen 3",
    displayName: "Google Gemini",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
    badge: "Fast",
    badgeColor:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
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
        <Label className="text-sm font-medium">AI Provider</Label>
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
      </div>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">AI Provider</Label>
        <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                No API keys configured.{" "}
                <Link
                  href="/api-key"
                  className="underline font-medium hover:text-orange-800 dark:hover:text-orange-200"
                >
                  Set them up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedProviderData = selectedProvider
    ? PROVIDERS[selectedProvider]
    : null;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">AI Provider</Label>
      <Select
        value={selectedProvider || ""}
        onValueChange={handleProviderChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          {selectedProviderData ? (
            <div className="flex items-center gap-2 w-full">
              <span className={selectedProviderData.color}>
                {selectedProviderData.icon}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {selectedProviderData.displayName}
              </span>
              <Badge
                className={`ml-auto ${selectedProviderData.badgeColor} border-0`}
              >
                {selectedProviderData.badge}
              </Badge>
            </div>
          ) : (
            <SelectValue placeholder="Select AI provider" />
          )}
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          {availableProviders.map((provider) => (
            <SelectItem
              key={provider}
              value={provider}
              className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800 py-3"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className={PROVIDERS[provider].color}>
                    {PROVIDERS[provider].icon}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {PROVIDERS[provider].displayName}
                  </span>
                  <Badge
                    className={`ml-auto ${PROVIDERS[provider].badgeColor} border-0 text-xs`}
                  >
                    {PROVIDERS[provider].badge}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                  {PROVIDERS[provider].description}
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedProviderData && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedProviderData.description}
        </p>
      )}
    </div>
  );
}
